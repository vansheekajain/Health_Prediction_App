import { google } from 'googleapis';
import * as ics from 'ics';
import { config } from '../config/index';

let oauth2Client: any = null;
if (config.google.clientId && config.google.clientSecret) {
  oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
}

export interface CalendarEventPayload {
  title: string;
  description: string;
  location?: string;
  date: string;
  startTime: string;
  endTime: string;
  doctorName: string;
  patientName: string;
  patientEmail: string;
  doctorEmail?: string;
}

export function generateIcsContent(payload: CalendarEventPayload): Promise<string> {
  return new Promise((resolve, reject) => {
    const [year, month, day] = payload.date.split('-').map(Number);
    const [startHour, startMin] = payload.startTime.split(':').map(Number);
    const [endHour, endMin] = payload.endTime.split(':').map(Number);

    const event: ics.EventAttributes = {
      start: [year, month, day, startHour, startMin],
      end: [year, month, day, endHour, endMin],
      title: payload.title,
      description: payload.description,
      location: payload.location || 'HealthCare Clinic & Telehealth Portal',
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'HealthCare Clinic', email: config.smtp.from.replace(/.*<([^>]+)>.*/, '$1') },
      attendees: [
        { name: payload.patientName, email: payload.patientEmail, rsvp: true, role: 'REQ-PARTICIPANT' },
      ],
      alarms: [
        { action: 'display', description: 'Reminder: Medical Appointment in 24 hours', trigger: { hours: 24, before: true } },
        { action: 'display', description: 'Reminder: Medical Appointment in 1 hour', trigger: { hours: 1, before: true } },
      ],
    };

    ics.createEvent(event, (error, value) => {
      if (error) {
        console.error('[Calendar Service] Error generating ICS:', error);
        return reject(error);
      }
      resolve(value);
    });
  });
}

export function generateGoogleCalendarUrl(payload: CalendarEventPayload): string {
  const [year, month, day] = payload.date.split('-').map(s => s.padStart(2, '0'));
  const [startHour, startMin] = payload.startTime.split(':').map(s => s.padStart(2, '0'));
  const [endHour, endMin] = payload.endTime.split(':').map(s => s.padStart(2, '0'));

  const startIso = `${year}${month}${day}T${startHour}${startMin}00`;
  const endIso = `${year}${month}${day}T${endHour}${endMin}00`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: payload.title,
    dates: `${startIso}/${endIso}`,
    details: payload.description,
    location: payload.location || 'HealthCare Clinic & Telehealth Portal',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export async function syncGoogleCalendarEvent(
  accessToken: string,
  payload: CalendarEventPayload
): Promise<string | null> {
  if (!oauth2Client) return null;

  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDateTime = `${payload.date}T${payload.startTime}:00`;
    const endDateTime = `${payload.date}T${payload.endTime}:00`;

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: payload.title,
        description: payload.description,
        location: payload.location || 'HealthCare Clinic',
        start: { dateTime: startDateTime, timeZone: 'UTC' },
        end: { dateTime: endDateTime, timeZone: 'UTC' },
        attendees: [{ email: payload.patientEmail }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 },
          ],
        },
      },
    });

    return response.data.id || null;
  } catch (error) {
    console.warn('[Calendar Service] Google Calendar API sync skipped or failed:', error);
    return null;
  }
}
