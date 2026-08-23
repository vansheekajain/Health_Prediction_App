import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { cleanupExpiredSlotHolds } from './booking.service';
import { processNotificationRetryQueue, sendNotificationEmail } from './notification.service';

export async function processAppointmentReminders() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const upcoming24h = await prisma.appointment.findMany({
    where: {
      date: tomorrowStr,
      status: 'CONFIRMED',
      notifications: {
        none: {
          type: 'REMINDER_24H',
        },
      },
    },
    include: {
      patient: true,
      doctor: {
        include: { user: true },
      },
    },
  });

  for (const appt of upcoming24h) {
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Reminder: Appointment Tomorrow</h2>
        <p>Hello <strong>${appt.patient.name}</strong>,</p>
        <p>This is a reminder for your medical appointment with <strong>Dr. ${appt.doctor.user.name}</strong> (${appt.doctor.specialty}).</p>
        <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin: 12px 0;">
          <p style="margin: 4px 0;"><strong>Date:</strong> Tomorrow, ${appt.date}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${appt.startTime} - ${appt.endTime}</p>
        </div>
      </div>
    `;

    await sendNotificationEmail({
      to: appt.patient.email,
      recipientId: appt.patient.id,
      appointmentId: appt.id,
      type: 'REMINDER_24H',
      subject: `Reminder: Appointment with Dr. ${appt.doctor.user.name} Tomorrow at ${appt.startTime}`,
      title: `Upcoming Appointment in 24 Hours`,
      message: `Reminder: You have an appointment with Dr. ${appt.doctor.user.name} tomorrow, ${appt.date} at ${appt.startTime}.`,
      htmlContent: html,
    });
  }

  const currentHour = now.getUTCHours();
  const nextHourStr = `${(currentHour + 1).toString().padStart(2, '0')}:`;

  const upcoming1h = await prisma.appointment.findMany({
    where: {
      date: todayStr,
      startTime: { startsWith: nextHourStr },
      status: 'CONFIRMED',
      notifications: {
        none: {
          type: 'REMINDER_1H',
        },
      },
    },
    include: {
      patient: true,
      doctor: {
        include: { user: true },
      },
    },
  });

  for (const appt of upcoming1h) {
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ea580c;">Appointment in 1 Hour</h2>
        <p>Hello <strong>${appt.patient.name}</strong>,</p>
        <p>Your appointment with <strong>Dr. ${appt.doctor.user.name}</strong> is starting soon at <strong>${appt.startTime}</strong>.</p>
      </div>
    `;

    await sendNotificationEmail({
      to: appt.patient.email,
      recipientId: appt.patient.id,
      appointmentId: appt.id,
      type: 'REMINDER_1H',
      subject: `Urgent Reminder: Appointment with Dr. ${appt.doctor.user.name} in 1 hour (${appt.startTime})`,
      title: `Appointment Starting in 1 Hour`,
      message: `Your appointment with Dr. ${appt.doctor.user.name} begins at ${appt.startTime} today.`,
      htmlContent: html,
    });
  }
}

export async function processMedicationReminders() {
  const todayStr = new Date().toISOString().slice(0, 10);

  const activeReminders = await prisma.medicationReminder.findMany({
    where: {
      status: 'ACTIVE',
      startDate: { lte: todayStr },
      endDate: { gte: todayStr },
    },
    include: {
      patient: true,
    },
  });

  for (const reminder of activeReminders) {
    const scheduledTimes: string[] = JSON.parse(reminder.scheduledTimes || '["09:00"]');

    for (const time of scheduledTimes) {
      const existingLog = await prisma.medicationLog.findFirst({
        where: {
          reminderId: reminder.id,
          scheduledDate: todayStr,
          scheduledTime: time,
        },
      });

      if (!existingLog) {
        await prisma.medicationLog.create({
          data: {
            reminderId: reminder.id,
            scheduledDate: todayStr,
            scheduledTime: time,
            status: 'PENDING',
          },
        });

        const html = `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #10b981; border-radius: 8px; max-width: 500px;">
            <h2 style="color: #059669; margin-top: 0;">💊 Medication Dose Reminder</h2>
            <p>Hello <strong>${reminder.patient.name}</strong>,</p>
            <p>It's time to take your scheduled medication:</p>
            <div style="background: #f0fdf4; padding: 14px; border-radius: 6px; margin: 12px 0;">
              <p style="margin: 4px 0;"><strong>Medication:</strong> ${reminder.medicationName}</p>
              <p style="margin: 4px 0;"><strong>Dosage:</strong> ${reminder.dosage}</p>
              <p style="margin: 4px 0;"><strong>Frequency:</strong> ${reminder.frequency}</p>
            </div>
          </div>
        `;

        await sendNotificationEmail({
          to: reminder.patient.email,
          recipientId: reminder.patient.id,
          appointmentId: reminder.appointmentId || undefined,
          type: 'MEDICATION_REMINDER',
          subject: `Medication Reminder: Time to take ${reminder.medicationName} (${reminder.dosage})`,
          title: `Medication Dose: ${reminder.medicationName}`,
          message: `It is time to take ${reminder.medicationName} (${reminder.dosage}).`,
          htmlContent: html,
        });
      }
    }
  }
}

export function startBackgroundScheduler() {
  console.log('[Scheduler] Initializing background workers & cron schedules...');

  cron.schedule('* * * * *', async () => {
    try {
      const cleaned = await cleanupExpiredSlotHolds();
      if (cleaned > 0) {
        console.log(`[Scheduler] Cleaned up ${cleaned} expired slot hold(s).`);
      }
    } catch (e) {
      console.error('[Scheduler Error] Expired hold cleanup failed:', e);
    }
  });

  cron.schedule('*/5 * * * *', async () => {
    try {
      await processNotificationRetryQueue();
    } catch (e) {
      console.error('[Scheduler Error] Notification retry failed:', e);
    }
  });

  cron.schedule('0 * * * *', async () => {
    try {
      await processAppointmentReminders();
    } catch (e) {
      console.error('[Scheduler Error] Appointment reminder check failed:', e);
    }
  });

  cron.schedule('0 8,13,20 * * *', async () => {
    try {
      await processMedicationReminders();
    } catch (e) {
      console.error('[Scheduler Error] Medication reminder check failed:', e);
    }
  });

  console.log('[Scheduler] Background workers active.');
}
