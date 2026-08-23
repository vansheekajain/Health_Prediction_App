import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendNotificationEmail } from '../services/notification.service';
import { prisma } from '../utils/prisma';

export const getUserNotifications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const notifications = await prisma.notificationLog.findMany({
    where: {
      OR: [
        { recipientId: req.user.id },
        { recipientEmail: req.user.email },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({
    success: true,
    count: notifications.length,
    notifications,
  });
};

export const getMedicationReminders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const reminders = await prisma.medicationReminder.findMany({
    where: { patientId: req.user.id },
    include: {
      logs: {
        orderBy: [{ scheduledDate: 'desc' }, { scheduledTime: 'desc' }],
        take: 15,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = reminders.map((r: any) => ({
    ...r,
    scheduledTimes: JSON.parse(r.scheduledTimes || '[]'),
  }));

  res.json({
    success: true,
    count: formatted.length,
    reminders: formatted,
  });
};

const doseSchema = z.object({
  reminderId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(['TAKEN', 'SKIPPED']),
});

export const logMedicationDose = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const data = doseSchema.parse(req.body);

  const existing = await prisma.medicationLog.findFirst({
    where: {
      reminderId: data.reminderId,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
    },
  });

  let log;
  if (existing) {
    log = await prisma.medicationLog.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        takenAt: data.status === 'TAKEN' ? new Date() : null,
      },
    });
  } else {
    log = await prisma.medicationLog.create({
      data: {
        reminderId: data.reminderId,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        status: data.status,
        takenAt: data.status === 'TAKEN' ? new Date() : null,
      },
    });
  }

  res.json({
    success: true,
    message: `Dose marked as ${data.status.toLowerCase()}.`,
    log,
  });
};

export const resendNotification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  const log = await prisma.notificationLog.findUnique({ where: { id } });
  if (!log) {
    res.status(404).json({ success: false, message: 'Notification log not found.' });
    return;
  }

  const success = await sendNotificationEmail({
    to: log.recipientEmail,
    recipientId: log.recipientId || undefined,
    appointmentId: log.appointmentId || undefined,
    type: log.type,
    subject: log.title,
    title: log.title,
    message: log.message,
    htmlContent: log.htmlContent || `<p>${log.message}</p>`,
  });

  res.json({
    success,
    message: success ? 'Notification re-sent successfully.' : 'Notification retry failed.',
  });
};
