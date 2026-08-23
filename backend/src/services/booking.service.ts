import crypto from 'crypto';
import { config } from '../config/index';
import { DaySchedule, SlotAvailability } from '../types/index';
import { prisma } from '../utils/prisma';
import { generatePreVisitSummary } from './ai.service';
import { sendBookingConfirmationNotification } from './notification.service';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export async function getDoctorAvailableSlots(
  doctorId: string,
  dateStr: string,
  currentPatientId?: string
): Promise<SlotAvailability[]> {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    include: {
      leaves: {
        where: {
          status: 'APPROVED',
          startDate: { lte: dateStr },
          endDate: { gte: dateStr },
        },
      },
      appointments: {
        where: {
          date: dateStr,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      },
      slotHolds: {
        where: {
          date: dateStr,
          expiresAt: { gt: new Date() },
        },
      },
    },
  });

  if (!doctor || !doctor.isActive) {
    throw new Error('Doctor not found or inactive');
  }

  if (doctor.leaves.length > 0) {
    return [];
  }

  let workingHours: DaySchedule[] = [];
  try {
    workingHours = JSON.parse(doctor.workingHours || '[]');
  } catch (e) {
    workingHours = [];
  }

  const targetDate = new Date(`${dateStr}T00:00:00Z`);
  const dayOfWeek = targetDate.getUTCDay();

  const daySchedule = workingHours.find((s) => s.dayOfWeek === dayOfWeek);
  if (!daySchedule || !daySchedule.isWorking) {
    return [];
  }

  const slotDuration = doctor.slotDurationMinutes || 30;
  const startMin = timeToMinutes(daySchedule.startTime);
  const endMin = timeToMinutes(daySchedule.endTime);

  const breaks = (daySchedule.breaks || []).map((b) => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }));

  const bookedSlots = new Set(doctor.appointments.map((a) => a.startTime));
  const activeHolds = new Map(doctor.slotHolds.map((h) => [h.startTime, h]));

  const slots: SlotAvailability[] = [];

  for (let m = startMin; m + slotDuration <= endMin; m += slotDuration) {
    const slotStart = minutesToTime(m);
    const slotEnd = minutesToTime(m + slotDuration);

    const isInBreak = breaks.some((b) => m < b.end && m + slotDuration > b.start);
    if (isInBreak) continue;

    const isBooked = bookedSlots.has(slotStart);
    const hold = activeHolds.get(slotStart);
    const isHeldByOther = hold && hold.patientId !== currentPatientId;
    const isHeldByMe = hold && hold.patientId === currentPatientId;

    const isAvailable = !isBooked && !isHeldByOther;

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      isAvailable: isAvailable || Boolean(isHeldByMe),
      isHeld: Boolean(hold),
      holdExpiresAt: hold ? hold.expiresAt.toISOString() : undefined,
      reason: isBooked
        ? 'Booked'
        : isHeldByOther
        ? 'Held by another patient'
        : undefined,
    });
  }

  return slots;
}

export async function acquireSlotHold(
  doctorId: string,
  patientId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<{ holdToken: string; expiresAt: Date }> {
  const leave = await prisma.doctorLeave.findFirst({
    where: {
      doctorId,
      status: 'APPROVED',
      startDate: { lte: date },
      endDate: { gte: date },
    },
  });

  if (leave) {
    throw new Error('Doctor is on leave for the selected date.');
  }

  const existingBooking = await prisma.appointment.findFirst({
    where: {
      doctorId,
      date,
      startTime,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
  });

  if (existingBooking) {
    throw new Error('This time slot is already booked. Please choose another slot.');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.slotHoldTtlMinutes * 60 * 1000);
  const holdToken = crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.slotHold.deleteMany({
      where: {
        doctorId,
        date,
        startTime,
        expiresAt: { lte: now },
      },
    });

    const activeHold = await tx.slotHold.findFirst({
      where: {
        doctorId,
        date,
        startTime,
        expiresAt: { gt: now },
        patientId: { not: patientId },
      },
    });

    if (activeHold) {
      throw new Error('This slot is currently being held by another patient. Please wait or pick another slot.');
    }

    await tx.slotHold.deleteMany({
      where: {
        doctorId,
        date,
        startTime,
        patientId,
      },
    });

    await tx.slotHold.create({
      data: {
        doctorId,
        patientId,
        date,
        startTime,
        endTime,
        holdToken,
        expiresAt,
      },
    });
  });

  return { holdToken, expiresAt };
}

export async function releaseSlotHold(holdToken: string): Promise<void> {
  await prisma.slotHold.deleteMany({
    where: { holdToken },
  });
}

export async function cleanupExpiredSlotHolds(): Promise<number> {
  const result = await prisma.slotHold.deleteMany({
    where: {
      expiresAt: { lte: new Date() },
    },
  });
  return result.count;
}

export interface BookAppointmentInput {
  doctorId: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  symptomsText: string;
  holdToken?: string;
}

export async function bookAppointment(input: BookAppointmentInput) {
  const now = new Date();

  const appointment = await prisma.$transaction(async (tx) => {
    const leave = await tx.doctorLeave.findFirst({
      where: {
        doctorId: input.doctorId,
        status: 'APPROVED',
        startDate: { lte: input.date },
        endDate: { gte: input.date },
      },
    });

    if (leave) {
      throw new Error('Doctor is on approved leave for this date.');
    }

    const existing = await tx.appointment.findFirst({
      where: {
        doctorId: input.doctorId,
        date: input.date,
        startTime: input.startTime,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
    });

    if (existing) {
      throw new Error('Double-booking conflict: This slot was just reserved by another patient.');
    }

    if (input.holdToken) {
      const hold = await tx.slotHold.findUnique({
        where: { holdToken: input.holdToken },
      });

      if (!hold || hold.expiresAt <= now || hold.patientId !== input.patientId) {
        throw new Error('Slot hold session has expired. Please select the slot again.');
      }
    }

    const newAppointment = await tx.appointment.create({
      data: {
        doctorId: input.doctorId,
        patientId: input.patientId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        status: 'CONFIRMED',
        symptomsText: input.symptomsText,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    await tx.slotHold.deleteMany({
      where: {
        doctorId: input.doctorId,
        date: input.date,
        startTime: input.startTime,
      },
    });

    return newAppointment;
  });

  try {
    const aiSummary = await generatePreVisitSummary(input.symptomsText);
    const preSummary = await prisma.preVisitSummary.create({
      data: {
        appointmentId: appointment.id,
        symptomsText: input.symptomsText,
        urgencyLevel: aiSummary.urgencyLevel,
        chiefComplaint: aiSummary.chiefComplaint,
        suggestedQuestions: JSON.stringify(aiSummary.suggestedQuestions),
        triageNotes: aiSummary.triageNotes,
        rawAiResponse: JSON.stringify(aiSummary),
      },
    }).catch(() => null);

    const fullAppointment = {
      ...appointment,
      preVisitSummary: preSummary,
    };

    await sendBookingConfirmationNotification(fullAppointment).catch(() => {});
  } catch (bgError) {
    console.error('[Booking Post-Processing Error]:', bgError);
  }

  return appointment;
}
