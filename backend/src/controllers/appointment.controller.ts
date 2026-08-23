import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { generateIcsContent } from '../services/calendar.service';
import {
  acquireSlotHold,
  bookAppointment as bookAppointmentService,
  getDoctorAvailableSlots,
  releaseSlotHold,
} from '../services/booking.service';
import { prisma } from '../utils/prisma';

export const getSlots = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { doctorId, date } = req.query;

  if (!doctorId || typeof doctorId !== 'string' || !date || typeof date !== 'string') {
    res.status(400).json({ success: false, message: 'doctorId and date are required.' });
    return;
  }

  try {
    const slots = await getDoctorAvailableSlots(doctorId, date, req.user?.id);
    res.json({
      success: true,
      doctorId,
      date,
      count: slots.length,
      slots,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Error fetching slots.' });
  }
};

const holdSlotSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const holdSlot = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const data = holdSlotSchema.parse(req.body);

  try {
    const result = await acquireSlotHold(
      data.doctorId,
      req.user.id,
      data.date,
      data.startTime,
      data.endTime
    );

    res.json({
      success: true,
      message: 'Slot temporarily reserved for 5 minutes.',
      holdToken: result.holdToken,
      expiresAt: result.expiresAt,
    });
  } catch (error: any) {
    res.status(409).json({ success: false, message: error.message || 'Could not hold slot.' });
  }
};

const releaseHoldSchema = z.object({
  holdToken: z.string(),
});

export const releaseHold = async (req: Request, res: Response): Promise<void> => {
  const data = releaseHoldSchema.parse(req.body);
  await releaseSlotHold(data.holdToken);
  res.json({ success: true, message: 'Slot hold released.' });
};

const bookSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  symptomsText: z.string().min(3),
  holdToken: z.string().optional(),
});

export const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const data = bookSchema.parse(req.body);

  try {
    const appointment = await bookAppointmentService({
      doctorId: data.doctorId,
      patientId: req.user.id,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      symptomsText: data.symptomsText,
      holdToken: data.holdToken,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment successfully booked!',
      appointment: {
        id: appointment.id,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        doctor: {
          name: appointment.doctor.user.name,
          specialty: appointment.doctor.specialty,
        },
      },
    });
  } catch (error: any) {
    res.status(409).json({
      success: false,
      message: error.message || 'Failed to complete booking.',
    });
  }
};

export const getMyAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  let whereClause: any = {};
  if (req.user.role === 'PATIENT') {
    whereClause.patientId = req.user.id;
  } else if (req.user.role === 'DOCTOR') {
    whereClause.doctorId = req.user.doctorProfileId;
  }

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: {
      patient: {
        select: { id: true, name: true, email: true, phone: true },
      },
      doctor: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
      preVisitSummary: true,
      postVisitRecord: true,
    },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
  });

  const formatted = appointments.map((a: any) => ({
    id: a.id,
    date: a.date,
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
    symptomsText: a.symptomsText,
    cancellationReason: a.cancellationReason,
    createdAt: a.createdAt,
    patient: a.patient,
    doctor: {
      id: a.doctor.id,
      name: a.doctor.user.name,
      email: a.doctor.user.email,
      specialty: a.doctor.specialty,
      consultationFee: a.doctor.consultationFee,
    },
    preVisitSummary: a.preVisitSummary
      ? {
          ...a.preVisitSummary,
          suggestedQuestions: JSON.parse(a.preVisitSummary.suggestedQuestions || '[]'),
        }
      : null,
    hasPostVisitRecord: Boolean(a.postVisitRecord),
    postVisitRecord: a.postVisitRecord
      ? {
          ...a.postVisitRecord,
          prescriptions: JSON.parse(a.postVisitRecord.prescriptions || '[]'),
          followUpSteps: JSON.parse(a.postVisitRecord.followUpSteps || '[]'),
          lifestyleAdvice: JSON.parse(a.postVisitRecord.lifestyleAdvice || '[]'),
        }
      : null,
  }));

  res.json({
    success: true,
    count: formatted.length,
    appointments: formatted,
  });
};

export const getAppointmentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const appt: any = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: {
        include: { user: true },
      },
      preVisitSummary: true,
      postVisitRecord: true,
      medicationReminders: true,
    },
  });

  if (!appt) {
    res.status(404).json({ success: false, message: 'Appointment not found.' });
    return;
  }

  res.json({
    success: true,
    appointment: {
      ...appt,
      preVisitSummary: appt.preVisitSummary
        ? {
            ...appt.preVisitSummary,
            suggestedQuestions: JSON.parse(appt.preVisitSummary.suggestedQuestions || '[]'),
          }
        : null,
      postVisitRecord: appt.postVisitRecord
        ? {
            ...appt.postVisitRecord,
            prescriptions: JSON.parse(appt.postVisitRecord.prescriptions || '[]'),
            followUpSteps: JSON.parse(appt.postVisitRecord.followUpSteps || '[]'),
            lifestyleAdvice: JSON.parse(appt.postVisitRecord.lifestyleAdvice || '[]'),
          }
        : null,
    },
  });
};

const cancelSchema = z.object({
  reason: z.string().optional(),
});

export const cancelAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const data = cancelSchema.parse(req.body);

  const appt: any = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: { include: { user: true } },
    },
  });

  if (!appt) {
    res.status(404).json({ success: false, message: 'Appointment not found.' });
    return;
  }

  const isPatient = req.user?.id === appt.patientId;
  const isDoctor = req.user?.id === appt.doctor?.userId;
  const isAdmin = req.user?.role === 'ADMIN';

  if (!isPatient && !isDoctor && !isAdmin) {
    res.status(403).json({ success: false, message: 'Forbidden.' });
    return;
  }

  const cancelStatus = isPatient ? 'CANCELLED_BY_PATIENT' : 'CANCELLED_BY_DOCTOR';

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: cancelStatus,
      cancellationReason: data.reason || 'Cancelled by user',
    },
  });

  res.json({
    success: true,
    message: 'Appointment cancelled successfully.',
    appointment: updated,
  });
};

export const downloadIcsFile = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const appt: any = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: { include: { user: true } },
    },
  });

  if (!appt) {
    res.status(404).send('Appointment not found');
    return;
  }

  try {
    const icsString = await generateIcsContent({
      title: `Consultation: Dr. ${appt.doctor?.user?.name} & ${appt.patient?.name}`,
      description: `Appointment with Dr. ${appt.doctor?.user?.name} (${appt.doctor?.specialty}). Symptoms: ${appt.symptomsText || 'General consultation'}`,
      date: appt.date,
      startTime: appt.startTime,
      endTime: appt.endTime,
      doctorName: appt.doctor?.user?.name,
      patientName: appt.patient?.name,
      patientEmail: appt.patient?.email,
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="appointment-${appt.date}.ics"`);
    res.send(icsString);
  } catch (error) {
    res.status(500).send('Error generating calendar file.');
  }
};
