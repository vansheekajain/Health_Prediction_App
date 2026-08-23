import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { generatePostVisitSummary } from '../services/ai.service';
import { sendPostVisitNotification } from '../services/notification.service';
import { PrescriptionItem } from '../types/index';
import { prisma } from '../utils/prisma';

const previewSchema = z.object({
  clinicalNotes: z.string().min(5),
  diagnosis: z.string().optional(),
});

export const previewAiPostVisit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = previewSchema.parse(req.body);

  try {
    const aiOutput = await generatePostVisitSummary(data.clinicalNotes, data.diagnosis);
    res.json({
      success: true,
      summary: aiOutput,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'AI summary generation failed.' });
  }
};

const saveRecordSchema = z.object({
  appointmentId: z.string().uuid(),
  clinicalNotes: z.string().min(5),
  diagnosis: z.string().optional(),
  prescriptions: z.array(
    z.object({
      medication: z.string().min(1),
      dosage: z.string().min(1),
      frequency: z.string().min(1),
      instructions: z.string().default('Take as directed'),
      durationDays: z.number().default(7),
      scheduledTimes: z.array(z.string()).optional(),
    })
  ).default([]),
  aiPatientFriendlySummary: z.string().optional(),
  followUpSteps: z.array(z.string()).optional(),
  lifestyleAdvice: z.array(z.string()).optional(),
});

export const saveConsultationRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const data = saveRecordSchema.parse(req.body);

  const appt = await prisma.appointment.findUnique({
    where: { id: data.appointmentId },
    include: {
      patient: true,
      doctor: { include: { user: true } },
    },
  });

  if (!appt) {
    res.status(404).json({ success: false, message: 'Appointment not found.' });
    return;
  }

  let friendlySummary = data.aiPatientFriendlySummary;
  let followUpSteps = data.followUpSteps || [];
  let lifestyleAdvice = data.lifestyleAdvice || [];

  if (!friendlySummary) {
    const aiOutput = await generatePostVisitSummary(data.clinicalNotes, data.diagnosis);
    friendlySummary = aiOutput.patientFriendlySummary;
    if (followUpSteps.length === 0) followUpSteps = aiOutput.followUpSteps;
    if (lifestyleAdvice.length === 0) lifestyleAdvice = aiOutput.lifestyleAdvice;
  }

  const result = await prisma.$transaction(async (tx: any) => {
    const record = await tx.postVisitRecord.upsert({
      where: { appointmentId: data.appointmentId },
      create: {
        appointmentId: data.appointmentId,
        clinicalNotes: data.clinicalNotes,
        diagnosis: data.diagnosis || null,
        prescriptions: JSON.stringify(data.prescriptions),
        aiPatientFriendlySummary: friendlySummary!,
        followUpSteps: JSON.stringify(followUpSteps),
        lifestyleAdvice: JSON.stringify(lifestyleAdvice),
      },
      update: {
        clinicalNotes: data.clinicalNotes,
        diagnosis: data.diagnosis || null,
        prescriptions: JSON.stringify(data.prescriptions),
        aiPatientFriendlySummary: friendlySummary!,
        followUpSteps: JSON.stringify(followUpSteps),
        lifestyleAdvice: JSON.stringify(lifestyleAdvice),
      },
    });

    await tx.appointment.update({
      where: { id: data.appointmentId },
      data: { status: 'COMPLETED' },
    });

    const startDate = appt.date;
    for (const rx of data.prescriptions) {
      const days = rx.durationDays || 7;
      const start = new Date(startDate);
      const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
      const endDate = end.toISOString().slice(0, 10);

      let defaultTimes = ['09:00'];
      const freqLower = rx.frequency.toLowerCase();
      if (freqLower.includes('twice') || freqLower.includes('2')) {
        defaultTimes = ['09:00', '21:00'];
      } else if (freqLower.includes('thrice') || freqLower.includes('3') || freqLower.includes('8 hour')) {
        defaultTimes = ['08:00', '14:00', '20:00'];
      } else if (freqLower.includes('night') || freqLower.includes('bedtime')) {
        defaultTimes = ['21:30'];
      }

      await tx.medicationReminder.create({
        data: {
          patientId: appt.patientId,
          appointmentId: appt.id,
          medicationName: rx.medication,
          dosage: rx.dosage,
          frequency: rx.frequency,
          instructions: rx.instructions,
          scheduledTimes: JSON.stringify(rx.scheduledTimes || defaultTimes),
          startDate,
          endDate,
          status: 'ACTIVE',
        },
      });
    }

    return record;
  });

  (async () => {
    try {
      const fullAppt = {
        ...appt,
        postVisitRecord: result,
      };
      await sendPostVisitNotification(fullAppt);
    } catch (e) {
      console.error('[Consultation Email Error]:', e);
    }
  })();

  res.json({
    success: true,
    message: 'Consultation notes and digital prescriptions successfully recorded!',
    record: {
      ...result,
      prescriptions: JSON.parse(result.prescriptions || '[]'),
      followUpSteps: JSON.parse(result.followUpSteps || '[]'),
      lifestyleAdvice: JSON.parse(result.lifestyleAdvice || '[]'),
    },
  });
};

export const getPostVisitRecord = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const appointmentId = req.params.appointmentId as string;

  const record = await prisma.postVisitRecord.findUnique({
    where: { appointmentId },
    include: {
      appointment: {
        include: {
          doctor: { include: { user: true } },
          patient: true,
        },
      },
    },
  });

  if (!record) {
    res.status(404).json({ success: false, message: 'No post-visit record found for this appointment.' });
    return;
  }

  res.json({
    success: true,
    record: {
      ...record,
      prescriptions: JSON.parse(record.prescriptions || '[]'),
      followUpSteps: JSON.parse(record.followUpSteps || '[]'),
      lifestyleAdvice: JSON.parse(record.lifestyleAdvice || '[]'),
    },
  });
};
