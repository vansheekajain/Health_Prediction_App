import { prisma } from '../utils/prisma';
import { sendLeaveCancellationNotification } from './notification.service';

export interface ApplyDoctorLeaveInput {
  doctorId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface LeaveConflictSummary {
  leave: any;
  affectedAppointmentsCount: number;
  affectedPatients: {
    appointmentId: string;
    patientName: string;
    patientEmail: string;
    date: string;
    time: string;
  }[];
}

export async function applyDoctorLeave(
  input: ApplyDoctorLeaveInput
): Promise<LeaveConflictSummary> {
  const { doctorId, startDate, endDate, reason } = input;

  if (startDate > endDate) {
    throw new Error('Start date must be before or equal to end date.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const leave = await tx.doctorLeave.create({
      data: {
        doctorId,
        startDate,
        endDate,
        reason: reason || 'Scheduled Physician Leave',
        status: 'APPROVED',
      },
    });

    const conflictingAppointments = await tx.appointment.findMany({
      where: {
        doctorId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'CONFIRMED',
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

    await tx.appointment.updateMany({
      where: {
        doctorId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'CONFIRMED',
      },
      data: {
        status: 'CANCELLED_DUE_TO_LEAVE',
        cancellationReason: `Doctor on leave: ${reason || 'Physician unavailable'}`,
      },
    });

    await tx.slotHold.deleteMany({
      where: {
        doctorId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      leave,
      conflictingAppointments,
    };
  });

  for (const appt of result.conflictingAppointments) {
    try {
      await sendLeaveCancellationNotification(appt, reason);
    } catch (notifyErr) {
      console.error(`[Leave Conflict] Failed to notify patient:`, notifyErr);
    }
  }

  return {
    leave: result.leave,
    affectedAppointmentsCount: result.conflictingAppointments.length,
    affectedPatients: result.conflictingAppointments.map((a) => ({
      appointmentId: a.id,
      patientName: a.patient.name,
      patientEmail: a.patient.email,
      date: a.date,
      time: `${a.startTime} - ${a.endTime}`,
    })),
  };
}

export async function previewLeaveConflicts(doctorId: string, startDate: string, endDate: string) {
  const conflicting = await prisma.appointment.findMany({
    where: {
      doctorId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: 'CONFIRMED',
    },
    include: {
      patient: true,
    },
  });

  return {
    count: conflicting.length,
    appointments: conflicting.map((a) => ({
      id: a.id,
      patientName: a.patient.name,
      patientEmail: a.patient.email,
      date: a.date,
      startTime: a.startTime,
      endTime: a.endTime,
      symptoms: a.symptomsText,
    })),
  };
}
