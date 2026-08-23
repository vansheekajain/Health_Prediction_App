import nodemailer from 'nodemailer';
import { config } from '../config/index';
import { prisma } from '../utils/prisma';
import { generateGoogleCalendarUrl, generateIcsContent } from './calendar.service';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (config.smtp.host && config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (e) {
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
}

export interface SendEmailOptions {
  to: string;
  recipientId?: string;
  appointmentId?: string;
  type: string;
  subject: string;
  title: string;
  message: string;
  htmlContent: string;
  icsAttachment?: string;
}

export async function sendNotificationEmail(options: SendEmailOptions): Promise<boolean> {
  let logId = '';
  try {
    const log = await prisma.notificationLog.create({
      data: {
        recipientEmail: options.to,
        recipientId: options.recipientId || null,
        appointmentId: options.appointmentId || null,
        type: options.type,
        title: options.title,
        message: options.message,
        htmlContent: options.htmlContent,
        status: 'PENDING',
      },
    }).catch(() => null);

    if (log) {
      logId = log.id;
    }

    const mailer = await getTransporter();
    const mailOptions: nodemailer.SendMailOptions = {
      from: config.smtp.from,
      to: options.to,
      subject: options.subject,
      text: options.message,
      html: options.htmlContent,
      attachments: options.icsAttachment
        ? [
            {
              filename: 'appointment.ics',
              content: options.icsAttachment,
              contentType: 'text/calendar; charset=utf-8; method=REQUEST',
            },
          ]
        : undefined,
    };

    const info = await mailer.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Notification Service] 📧 Email Preview URL (${options.type}): ${previewUrl}`);
    }

    if (logId) {
      await prisma.notificationLog.update({
        where: { id: logId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      }).catch(() => {});
    }

    return true;
  } catch (error: any) {
    console.error(`[Notification Service] Error sending email (${options.type}) to ${options.to}:`, error);

    if (logId) {
      await prisma.notificationLog.update({
        where: { id: logId },
        data: {
          status: 'FAILED',
          retryCount: { increment: 1 },
          lastError: error.message || 'Unknown mailer error',
        },
      }).catch(() => {});
    }

    return false;
  }
}

export async function processNotificationRetryQueue(): Promise<void> {
  const failedLogs = await prisma.notificationLog.findMany({
    where: {
      status: 'FAILED',
      retryCount: { lt: 3 },
    },
    take: 20,
  });

  if (failedLogs.length === 0) return;

  const mailer = await getTransporter();

  for (const log of failedLogs) {
    try {
      await mailer.sendMail({
        from: config.smtp.from,
        to: log.recipientEmail,
        subject: log.title,
        text: log.message,
        html: log.htmlContent || `<p>${log.message}</p>`,
      });

      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          retryCount: { increment: 1 },
        },
      }).catch(() => {});
    } catch (error: any) {
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          retryCount: { increment: 1 },
          lastError: error.message || 'Retry failed',
        },
      }).catch(() => {});
    }
  }
}

export async function sendBookingConfirmationNotification(appointment: any): Promise<void> {
  const patient = appointment.patient;
  const doctor = appointment.doctor?.user || appointment.doctor;
  const specialty = appointment.doctor?.specialty || 'Medical Specialist';
  const preSummary = appointment.preVisitSummary;

  if (!patient || !doctor) return;

  const calPayload = {
    title: `Consultation: Dr. ${doctor.name} & ${patient.name}`,
    description: `Appointment with Dr. ${doctor.name} (${specialty}). Symptoms: ${appointment.symptomsText || 'General Consultation'}`,
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    doctorName: doctor.name,
    patientName: patient.name,
    patientEmail: patient.email,
    doctorEmail: doctor.email,
  };

  const icsAttachment = await generateIcsContent(calPayload).catch(() => undefined);
  const googleCalUrl = generateGoogleCalendarUrl(calPayload);

  const urgencyColor =
    preSummary?.urgencyLevel === 'HIGH'
      ? '#ef4444'
      : preSummary?.urgencyLevel === 'MEDIUM'
      ? '#f59e0b'
      : '#10b981';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px;">Appointment Confirmed!</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">HealthCare Clinic & Follow-up Platform</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #334155;">Hello <strong>${patient.name}</strong>,</p>
        <p style="color: #64748b; line-height: 1.5;">Your medical appointment has been successfully scheduled. Here are your booking details:</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Doctor:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">Dr. ${doctor.name} (${specialty})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Date:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${appointment.date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Time:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${appointment.startTime} - ${appointment.endTime}</td>
            </tr>
            ${preSummary ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Triage Urgency:</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: ${urgencyColor};">${preSummary.urgencyLevel}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${googleCalUrl}" target="_blank" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">+ Add to Google Calendar</a>
        </div>
      </div>
    </div>
  `;

  await sendNotificationEmail({
    to: patient.email,
    recipientId: patient.id,
    appointmentId: appointment.id,
    type: 'BOOKING_CONFIRMATION',
    subject: `Appointment Confirmed with Dr. ${doctor.name} on ${appointment.date}`,
    title: `Appointment Confirmed with Dr. ${doctor.name}`,
    message: `Your appointment with Dr. ${doctor.name} is confirmed for ${appointment.date} at ${appointment.startTime}.`,
    htmlContent: html,
    icsAttachment,
  });
}

export async function sendLeaveCancellationNotification(
  appointment: any,
  leaveReason?: string
): Promise<void> {
  const patient = appointment.patient;
  const doctor = appointment.doctor?.user || appointment.doctor;
  const rebookUrl = `${config.frontendUrl}/patient/doctors`;

  if (!patient || !doctor) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: #dc2626; padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 20px;">Doctor Leave Notice & Reschedule Alert</h1>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #334155;">Dear <strong>${patient.name}</strong>,</p>
        <p style="color: #475569;">
          We regret to inform you that <strong>Dr. ${doctor.name}</strong> is on leave on <strong>${appointment.date}</strong>${leaveReason ? ` (${leaveReason})` : ''} and will be unable to hold your appointment at <strong>${appointment.startTime}</strong>.
        </p>
        <p>Your appointment has been automatically cancelled to avoid delays. Please click below to choose your next preferred slot:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${rebookUrl}" style="background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Select New Slot with Dr. ${doctor.name}
          </a>
        </div>
      </div>
    </div>
  `;

  await sendNotificationEmail({
    to: patient.email,
    recipientId: patient.id,
    appointmentId: appointment.id,
    type: 'LEAVE_CANCELLATION',
    subject: `IMPORTANT: Appointment Cancellation & Reschedule - Dr. ${doctor.name}`,
    title: `Appointment Reschedule Notice: Dr. ${doctor.name} on Leave`,
    message: `Dr. ${doctor.name} is on leave on ${appointment.date}. Your appointment at ${appointment.startTime} has been cancelled.`,
    htmlContent: html,
  });
}

export async function sendPostVisitNotification(appointment: any): Promise<void> {
  const patient = appointment.patient;
  const doctor = appointment.doctor?.user || appointment.doctor;
  const record = appointment.postVisitRecord;

  if (!record || !patient || !doctor) return;

  const prescriptions = JSON.parse(record.prescriptions || '[]');
  const followUpSteps = JSON.parse(record.followUpSteps || '[]');

  const prescriptionRows = prescriptions.map((p: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${p.medication} (${p.dosage})</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${p.frequency}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${p.instructions} (${p.durationDays || '7'} days)</td>
    </tr>
  `).join('');

  const followUpList = followUpSteps.map((s: string) => `<li>${s}</li>`).join('');

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: #059669; padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px;">Your Post-Visit Summary & Care Plan</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Consultation with Dr. ${doctor.name}</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #334155;">Hello <strong>${patient.name}</strong>,</p>
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 14px; margin: 16px 0;">
          <h3 style="margin: 0 0 6px 0; color: #065f46;">Patient-Friendly Summary</h3>
          <p style="margin: 0; color: #1e293b; font-size: 14px;">${record.aiPatientFriendlySummary}</p>
        </div>

        ${prescriptions.length > 0 ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #0f172a;">Prescription Schedule</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: left;">Medication</th>
                <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: left;">Frequency</th>
                <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: left;">Instructions</th>
              </tr>
            </thead>
            <tbody>${prescriptionRows}</tbody>
          </table>
        </div>` : ''}

        ${followUpSteps.length > 0 ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #0f172a;">Next Steps:</h3>
          <ul style="color: #334155; padding-left: 20px;">${followUpList}</ul>
        </div>` : ''}
      </div>
    </div>
  `;

  await sendNotificationEmail({
    to: patient.email,
    recipientId: patient.id,
    appointmentId: appointment.id,
    type: 'POST_VISIT_SUMMARY',
    subject: `Your Post-Visit Summary & Prescription from Dr. ${doctor.name}`,
    title: `Post-Visit Summary from Dr. ${doctor.name}`,
    message: `Your post-visit summary is available in your patient portal.`,
    htmlContent: html,
  });
}
