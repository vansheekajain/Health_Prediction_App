const fs = require('fs');
const path = require('path');

console.log('Writing all source code files...');

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf-8');
  console.log(`✓ Wrote ${relPath} (${fs.statSync(fullPath).size} bytes)`);
}

// 1. backend/prisma/schema.prisma
writeFile('backend/prisma/schema.prisma', `
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         String   @default("PATIENT") // PATIENT, DOCTOR, ADMIN
  phone        String?
  avatarUrl    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  doctorProfile       DoctorProfile?
  patientAppointments Appointment[]        @relation("PatientAppointments")
  slotHolds           SlotHold[]           @relation("PatientHolds")
  medicationReminders MedicationReminder[]
  notificationLogs    NotificationLog[]
}

model DoctorProfile {
  id                  String   @id @default(uuid())
  userId              String   @unique
  specialty           String
  bio                 String?
  qualification       String?
  experienceYears     Int      @default(0)
  consultationFee     Float    @default(0.0)
  slotDurationMinutes Int      @default(30)
  workingHours        String? // JSON string of DaySchedule[]
  rating              Float    @default(5.0)
  reviewCount         Int      @default(0)
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointments Appointment[] @relation("DoctorAppointments")
  leaves       DoctorLeave[]
  slotHolds    SlotHold[]    @relation("DoctorHolds")
}

model DoctorLeave {
  id        String   @id @default(uuid())
  doctorId  String
  startDate String // YYYY-MM-DD
  endDate   String // YYYY-MM-DD
  reason    String?
  status    String   @default("APPROVED") // APPROVED, CANCELLED
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  doctor DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)
}

model SlotHold {
  id        String   @id @default(uuid())
  doctorId  String
  patientId String
  date      String // YYYY-MM-DD
  startTime String // HH:mm
  endTime   String // HH:mm
  holdToken String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  doctor  DoctorProfile @relation("DoctorHolds", fields: [doctorId], references: [id], onDelete: Cascade)
  patient User          @relation("PatientHolds", fields: [patientId], references: [id], onDelete: Cascade)

  @@index([doctorId, date, startTime])
  @@index([expiresAt])
}

model Appointment {
  id                 String   @id @default(uuid())
  patientId          String
  doctorId           String
  date               String // YYYY-MM-DD
  startTime          String // HH:mm
  endTime            String // HH:mm
  status             String   @default("CONFIRMED") // CONFIRMED, COMPLETED, CANCELLED_BY_PATIENT, CANCELLED_BY_DOCTOR, CANCELLED_DUE_TO_LEAVE, NO_SHOW
  symptomsText       String?
  cancellationReason String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  patient             User                 @relation("PatientAppointments", fields: [patientId], references: [id], onDelete: Cascade)
  doctor              DoctorProfile        @relation("DoctorAppointments", fields: [doctorId], references: [id], onDelete: Cascade)
  preVisitSummary     PreVisitSummary?
  postVisitRecord     PostVisitRecord?
  medicationReminders MedicationReminder[]
  notifications       NotificationLog[]
  calendarSync        CalendarSync?

  @@index([doctorId, date, startTime])
  @@index([patientId, date])
}

model PreVisitSummary {
  id                 String   @id @default(uuid())
  appointmentId      String   @unique
  symptomsText       String
  urgencyLevel       String // LOW, MEDIUM, HIGH
  chiefComplaint     String
  suggestedQuestions String // JSON array of 3 questions
  triageNotes        String?
  rawAiResponse      String?
  createdAt          DateTime @default(now())

  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
}

model PostVisitRecord {
  id                       String   @id @default(uuid())
  appointmentId            String   @unique
  clinicalNotes            String
  diagnosis                String?
  prescriptions            String // JSON array of PrescriptionItem[]
  aiPatientFriendlySummary String
  followUpSteps            String // JSON array of steps
  lifestyleAdvice          String? // JSON array of advice
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt

  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
}

model MedicationReminder {
  id             String   @id @default(uuid())
  patientId      String
  appointmentId  String?
  medicationName String
  dosage         String
  frequency      String
  instructions   String?
  scheduledTimes String // JSON array of times (e.g. ["09:00", "21:00"])
  startDate      String // YYYY-MM-DD
  endDate        String // YYYY-MM-DD
  status         String   @default("ACTIVE") // ACTIVE, COMPLETED, PAUSED
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  patient     User            @relation(fields: [patientId], references: [id], onDelete: Cascade)
  appointment Appointment?    @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
  logs        MedicationLog[]
}

model MedicationLog {
  id            String    @id @default(uuid())
  reminderId    String
  scheduledDate String // YYYY-MM-DD
  scheduledTime String // HH:mm
  status        String    @default("PENDING") // PENDING, TAKEN, SKIPPED
  takenAt       DateTime?
  createdAt     DateTime  @default(now())

  reminder MedicationReminder @relation(fields: [reminderId], references: [id], onDelete: Cascade)

  @@index([reminderId, scheduledDate])
}

model NotificationLog {
  id             String    @id @default(uuid())
  recipientEmail String
  recipientId    String?
  appointmentId  String?
  type           String // BOOKING_CONFIRMATION, REMINDER_24H, REMINDER_1H, LEAVE_CANCELLATION, POST_VISIT_SUMMARY, MEDICATION_REMINDER
  title          String
  message        String
  htmlContent    String?
  status         String    @default("SENT") // PENDING, SENT, FAILED
  retryCount     Int       @default(0)
  lastError      String?
  sentAt         DateTime?
  createdAt      DateTime  @default(now())

  recipient   User?        @relation(fields: [recipientId], references: [id], onDelete: SetNull)
  appointment Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
}

model CalendarSync {
  id                 String    @id @default(uuid())
  appointmentId      String    @unique
  googleEventId      String?
  calendarType       String    @default("GOOGLE") // GOOGLE, OUTLOOK, ICS
  syncedAt           DateTime  @default(now())
  lastSyncStatus     String    @default("SYNCED") // SYNCED, FAILED
  lastError          String?
  icsContentSnapshot String?

  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
}
`);

// 2. backend/package.json
writeFile('backend/package.json', JSON.stringify({
  "name": "healthcare-backend",
  "version": "1.0.0",
  "description": "Healthcare Appointment & Follow-up Manager API",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc && prisma generate",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:push": "prisma db push",
    "seed": "tsx src/seed.ts",
    "test": "jest --detectOpenHandles --forceExit"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "@prisma/client": "^5.22.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.9.0",
    "@types/node-cron": "^3.0.11",
    "@types/nodemailer": "^6.4.16",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "googleapis": "^144.0.0",
    "ics": "^3.8.1",
    "jsonwebtoken": "^9.0.2",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.9.16",
    "prisma": "^5.22.0",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5"
  }
}, null, 2));

// 3. backend/src/config/index.ts
writeFile('backend/src/config/index.ts', `
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'healthcare-jwt-secure-token-secret-2026-key!',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'HealthCare Clinic <noreply@healthcare-platform.com>',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/calendar/oauth2callback',
  },
  slotHoldTtlMinutes: 5,
};
`);

// 4. backend/src/types/index.ts
writeFile('backend/src/types/index.ts', `
export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type AppointmentStatus =
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED_BY_PATIENT'
  | 'CANCELLED_BY_DOCTOR'
  | 'CANCELLED_DUE_TO_LEAVE'
  | 'NO_SHOW';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  doctorProfileId?: string | null;
}

export interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  isWorking: boolean;
  breaks: {
    startTime: string;
    endTime: string;
  }[];
}

export interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  instructions: string;
  durationDays: number;
  scheduledTimes?: string[];
}

export interface PreVisitAiOutput {
  urgencyLevel: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
  triageNotes: string;
}

export interface PostVisitAiOutput {
  patientFriendlySummary: string;
  medicationSchedule: {
    medication: string;
    dosage: string;
    frequency: string;
    timing: string;
    duration: string;
    instructions: string;
  }[];
  followUpSteps: string[];
  lifestyleAdvice: string[];
}

export interface SlotAvailability {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isHeld: boolean;
  holdExpiresAt?: string;
  reason?: string;
}
`);

// 5. backend/src/utils/prisma.ts
writeFile('backend/src/utils/prisma.ts', `
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
`);

// 6. backend/src/middlewares/auth.middleware.ts
writeFile('backend/src/middlewares/auth.middleware.ts', `
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { AuthUser, UserRole } from '../types/index';
import { prisma } from '../utils/prisma';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const authenticateJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role: UserRole };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { doctorProfile: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'User account not found.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      doctorProfileId: user.doctorProfile?.id || null,
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: \`Forbidden. Role '\${req.user.role}' is not authorized to access this resource.\`,
      });
      return;
    }

    next();
  };
};
`);

// 7. backend/src/middlewares/error.middleware.ts
writeFile('backend/src/middlewares/error.middleware.ts', `
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(\`[Error] \${req.method} \${req.url}:\`, err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: \`Resource not found: \${req.method} \${req.originalUrl}\`,
  });
};
`);

// 8. backend/src/services/ai.service.ts
writeFile('backend/src/services/ai.service.ts', `
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index';
import { PostVisitAiOutput, PreVisitAiOutput, UrgencyLevel } from '../types/index';

let genAI: GoogleGenerativeAI | null = null;
if (config.geminiApiKey) {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
}

export async function generatePreVisitSummary(symptomsText: string): Promise<PreVisitAiOutput> {
  if (!symptomsText || !symptomsText.trim()) {
    return {
      urgencyLevel: 'LOW',
      chiefComplaint: 'Routine Consultation / General Checkup',
      suggestedQuestions: [
        'How long have you had these symptoms?',
        'Have you noticed any triggers or changes?',
        'Are you currently taking any medications for this?',
      ],
      triageNotes: 'Patient has booked for a standard health consultation.',
    };
  }

  if (genAI && config.geminiApiKey) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = \`You are an expert clinical triage assistant.
Analyse these patient-reported symptoms and return a strictly valid JSON object matching this schema:
{
  "urgencyLevel": "Low" | "Medium" | "High",
  "chiefComplaint": "Concise summary of main medical concern (10 words max)",
  "suggestedQuestions": ["Question 1 for doctor", "Question 2 for doctor", "Question 3 for doctor"],
  "triageNotes": "Brief 1-2 sentence clinical context for the doctor"
}

Prompt Instruction:
Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: "\${symptomsText}"

IMPORTANT: Output ONLY the raw JSON string without markdown code fences or backticks.\`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanedJson = text.replace(/\\\`\\\`\\\`json/gi, '').replace(/\\\`\\\`\\\`/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      const urgencyUpper = (parsed.urgencyLevel || 'LOW').toUpperCase();
      const validUrgency: UrgencyLevel =
        urgencyUpper === 'HIGH' ? 'HIGH' : urgencyUpper === 'MEDIUM' ? 'MEDIUM' : 'LOW';

      return {
        urgencyLevel: validUrgency,
        chiefComplaint: parsed.chiefComplaint || symptomsText.slice(0, 50),
        suggestedQuestions: Array.isArray(parsed.suggestedQuestions) && parsed.suggestedQuestions.length > 0
          ? parsed.suggestedQuestions.slice(0, 3)
          : [
              'When did these symptoms first manifest?',
              'Have you experienced any similar episodes in the past?',
              'What remedies or treatments have you tried so far?',
            ],
        triageNotes: parsed.triageNotes || \`Clinical assessment for reported: \${symptomsText}\`,
      };
    } catch (error) {
      console.warn('[AI Service] Gemini API call fallback active');
    }
  }

  return fallbackPreVisitAnalysis(symptomsText);
}

export async function generatePostVisitSummary(clinicalNotes: string, diagnosis?: string): Promise<PostVisitAiOutput> {
  const combinedNotes = \`Diagnosis: \${diagnosis || 'Not specified'}\\nClinical Notes: \${clinicalNotes}\`;

  if (genAI && config.geminiApiKey) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = \`You are a patient-centered medical communicator.
Convert the doctor's clinical notes into a patient-friendly summary with medication schedule and follow-up steps.

Return a strictly valid JSON object matching this schema:
{
  "patientFriendlySummary": "Clear, empathetic, jargon-free summary explaining what was diagnosed and the overall recovery plan.",
  "medicationSchedule": [
    {
      "medication": "Name of drug",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. Twice daily",
      "timing": "Morning and Evening after meals",
      "duration": "7 days",
      "instructions": "Take with a full glass of water"
    }
  ],
  "followUpSteps": [
    "Step 1 (e.g. Monitor temperature twice daily)",
    "Step 2 (e.g. Schedule follow-up visit in 2 weeks)"
  ],
  "lifestyleAdvice": [
    "Advice 1 (e.g. Stay hydrated, drink at least 2L of water)",
    "Advice 2 (e.g. Avoid heavy lifting for 3 days)"
  ]
}

Prompt Instruction:
Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: "\${combinedNotes}"

IMPORTANT: Output ONLY the raw JSON string without markdown code fences.\`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanedJson = text.replace(/\\\`\\\`\\\`json/gi, '').replace(/\\\`\\\`\\\`/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      return {
        patientFriendlySummary: parsed.patientFriendlySummary || 'Your consultation notes have been summarized by your physician.',
        medicationSchedule: Array.isArray(parsed.medicationSchedule) ? parsed.medicationSchedule : [],
        followUpSteps: Array.isArray(parsed.followUpSteps) ? parsed.followUpSteps : ['Rest and hydrate', 'Return if symptoms worsen'],
        lifestyleAdvice: Array.isArray(parsed.lifestyleAdvice) ? parsed.lifestyleAdvice : ['Adequate rest', 'Maintain balanced diet'],
      };
    } catch (error) {
      console.warn('[AI Service] Gemini Post-Visit fallback active');
    }
  }

  return fallbackPostVisitAnalysis(clinicalNotes, diagnosis);
}

function fallbackPreVisitAnalysis(symptoms: string): PreVisitAiOutput {
  const lower = symptoms.toLowerCase();

  const highUrgencyKeywords = [
    'chest pain', 'shortness of breath', 'difficulty breathing', 'sudden numbness',
    'severe bleeding', 'unconscious', 'fainting', 'stroke', 'heart attack', 'severe burn',
    'high fever 104', 'worst headache', 'seizure', 'anaphylaxis', 'suicidal'
  ];

  const mediumUrgencyKeywords = [
    'fever', 'vomiting', 'diarrhea', 'persistent cough', 'severe pain', 'fracture',
    'sprain', 'migraine', 'infection', 'rash', 'dizziness', 'abdominal pain', 'earache',
    'blurred vision', 'asthma'
  ];

  let urgency: UrgencyLevel = 'LOW';
  if (highUrgencyKeywords.some(kw => lower.includes(kw))) {
    urgency = 'HIGH';
  } else if (mediumUrgencyKeywords.some(kw => lower.includes(kw))) {
    urgency = 'MEDIUM';
  }

  const sentences = symptoms.split(/[.\\n]/).filter(s => s.trim().length > 0);
  const firstSentence = sentences[0]?.trim() || symptoms;
  const chiefComplaint = firstSentence.length > 80 ? firstSentence.slice(0, 77) + '...' : firstSentence;

  const suggestedQuestions: string[] = [];
  if (urgency === 'HIGH') {
    suggestedQuestions.push('Have the symptoms worsened rapidly over the past 24 hours?');
    suggestedQuestions.push('Are you experiencing any radiating pain or shortness of breath?');
    suggestedQuestions.push('Do you have a history of cardiovascular or respiratory conditions?');
  } else if (urgency === 'MEDIUM') {
    suggestedQuestions.push('How many days have you been feeling this way?');
    suggestedQuestions.push('Does anything specific make the pain or discomfort better or worse?');
    suggestedQuestions.push('Have you taken any over-the-counter medication with relief?');
  } else {
    suggestedQuestions.push('What specific activities or times of day trigger this?');
    suggestedQuestions.push('Have you experienced similar symptoms before?');
    suggestedQuestions.push('Are you managing any concurrent chronic conditions?');
  }

  return {
    urgencyLevel: urgency,
    chiefComplaint: chiefComplaint || 'General health evaluation',
    suggestedQuestions,
    triageNotes: \`Triage evaluation (\${urgency} priority): Patient reported symptoms including "\${chiefComplaint}". Recommended prompt clinical review.\`,
  };
}

function fallbackPostVisitAnalysis(notes: string, diagnosis?: string): PostVisitAiOutput {
  const diagnosisText = diagnosis ? \`Diagnosis: \${diagnosis}. \` : '';

  return {
    patientFriendlySummary: \`\${diagnosisText}During your consultation, your doctor evaluated your symptoms and documented clinical findings. Please adhere strictly to the prescribed regimen, allow time for recovery, and keep track of your daily improvements.\`,
    medicationSchedule: [
      {
        medication: 'Prescribed Regimen',
        dosage: 'As indicated on prescription bottle',
        frequency: 'As directed by physician',
        timing: 'Take with food and water',
        duration: 'Complete full course as prescribed',
        instructions: 'Do not stop early even if feeling better',
      },
    ],
    followUpSteps: [
      'Take all medications on schedule according to instructions',
      'Monitor your symptoms daily and record any adverse reactions',
      'Book a follow-up consultation in 7-14 days or earlier if symptoms persist',
      'Seek immediate emergency care if you experience chest pain, severe breathing difficulty, or high fever',
    ],
    lifestyleAdvice: [
      'Drink plenty of fluids (2-3 liters/day) to support recovery',
      'Get 7-8 hours of restful sleep every night',
      'Avoid strenuous physical exertion until cleared by your doctor',
    ],
  };
}
`);

// 9. backend/src/services/calendar.service.ts
writeFile('backend/src/services/calendar.service.ts', `
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

  const startIso = \`\${year}\${month}\${day}T\${startHour}\${startMin}00\`;
  const endIso = \`\${year}\${month}\${day}T\${endHour}\${endMin}00\`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: payload.title,
    dates: \`\${startIso}/\${endIso}\`,
    details: payload.description,
    location: payload.location || 'HealthCare Clinic & Telehealth Portal',
  });

  return \`https://calendar.google.com/calendar/render?\${params.toString()}\`;
}

export async function syncGoogleCalendarEvent(
  accessToken: string,
  payload: CalendarEventPayload
): Promise<string | null> {
  if (!oauth2Client) return null;

  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDateTime = \`\${payload.date}T\${payload.startTime}:00\`;
    const endDateTime = \`\${payload.date}T\${payload.endTime}:00\`;

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
`);

// 10. backend/src/services/notification.service.ts
writeFile('backend/src/services/notification.service.ts', `
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
    });
    logId = log.id;

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
      console.log(\`[Notification Service] 📧 Email Preview URL (\${options.type}): \${previewUrl}\`);
    }

    await prisma.notificationLog.update({
      where: { id: logId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    return true;
  } catch (error: any) {
    console.error(\`[Notification Service] Error sending email (\${options.type}) to \${options.to}:\`, error);

    if (logId) {
      await prisma.notificationLog.update({
        where: { id: logId },
        data: {
          status: 'FAILED',
          retryCount: { increment: 1 },
          lastError: error.message || 'Unknown mailer error',
        },
      });
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
        html: log.htmlContent || \`<p>\${log.message}</p>\`,
      });

      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          retryCount: { increment: 1 },
        },
      });
    } catch (error: any) {
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          retryCount: { increment: 1 },
          lastError: error.message || 'Retry failed',
        },
      });
    }
  }
}

export async function sendBookingConfirmationNotification(appointment: any): Promise<void> {
  const patient = appointment.patient;
  const doctor = appointment.doctor.user;
  const specialty = appointment.doctor.specialty;
  const preSummary = appointment.preVisitSummary;

  const calPayload = {
    title: \`Consultation: Dr. \${doctor.name} & \${patient.name}\`,
    description: \`Appointment with Dr. \${doctor.name} (\${specialty}). Symptoms: \${appointment.symptomsText || 'General Consultation'}\`,
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

  const html = \`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px;">Appointment Confirmed!</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">HealthCare Clinic & Follow-up Platform</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #334155;">Hello <strong>\${patient.name}</strong>,</p>
        <p style="color: #64748b; line-height: 1.5;">Your medical appointment has been successfully scheduled. Here are your booking details:</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Doctor:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">Dr. \${doctor.name} (\${specialty})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Date:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">\${appointment.date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Time:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">\${appointment.startTime} - \${appointment.endTime}</td>
            </tr>
            \${preSummary ? \`
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Triage Urgency:</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: \${urgencyColor};">\${preSummary.urgencyLevel}</td>
            </tr>
            \` : ''}
          </table>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="\${googleCalUrl}" target="_blank" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">+ Add to Google Calendar</a>
        </div>
      </div>
    </div>
  \`;

  await sendNotificationEmail({
    to: patient.email,
    recipientId: patient.id,
    appointmentId: appointment.id,
    type: 'BOOKING_CONFIRMATION',
    subject: \`Appointment Confirmed with Dr. \${doctor.name} on \${appointment.date}\`,
    title: \`Appointment Confirmed with Dr. \${doctor.name}\`,
    message: \`Your appointment with Dr. \${doctor.name} is confirmed for \${appointment.date} at \${appointment.startTime}.\`,
    htmlContent: html,
    icsAttachment,
  });
}

export async function sendLeaveCancellationNotification(
  appointment: any,
  leaveReason?: string
): Promise<void> {
  const patient = appointment.patient;
  const doctor = appointment.doctor.user;
  const rebookUrl = \`\${config.frontendUrl}/patient/doctors\`;

  const html = \`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: #dc2626; padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 20px;">Doctor Leave Notice & Reschedule Alert</h1>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #334155;">Dear <strong>\${patient.name}</strong>,</p>
        <p style="color: #475569;">
          We regret to inform you that <strong>Dr. \${doctor.name}</strong> is on leave on <strong>\${appointment.date}</strong>\${leaveReason ? \` (\${leaveReason})\` : ''} and will be unable to hold your appointment at <strong>\${appointment.startTime}</strong>.
        </p>
        <p>Your appointment has been automatically cancelled to avoid delays. Please click below to choose your next preferred slot:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="\${rebookUrl}" style="background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Select New Slot with Dr. \${doctor.name}
          </a>
        </div>
      </div>
    </div>
  \`;

  await sendNotificationEmail({
    to: patient.email,
    recipientId: patient.id,
    appointmentId: appointment.id,
    type: 'LEAVE_CANCELLATION',
    subject: \`IMPORTANT: Appointment Cancellation & Reschedule - Dr. \${doctor.name}\`,
    title: \`Appointment Reschedule Notice: Dr. \${doctor.name} on Leave\`,
    message: \`Dr. \${doctor.name} is on leave on \${appointment.date}. Your appointment at \${appointment.startTime} has been cancelled.\`,
    htmlContent: html,
  });
}

export async function sendPostVisitNotification(appointment: any): Promise<void> {
  const patient = appointment.patient;
  const doctor = appointment.doctor.user;
  const record = appointment.postVisitRecord;

  if (!record) return;

  const prescriptions = JSON.parse(record.prescriptions || '[]');
  const followUpSteps = JSON.parse(record.followUpSteps || '[]');

  const prescriptionRows = prescriptions.map((p: any) => \`
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">\${p.medication} (\${p.dosage})</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">\${p.frequency}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">\${p.instructions} (\${p.durationDays || '7'} days)</td>
    </tr>
  \`).join('');

  const followUpList = followUpSteps.map((s: string) => \`<li>\${s}</li>\`).join('');

  const html = \`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: #059669; padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px;">Your Post-Visit Summary & Care Plan</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Consultation with Dr. \${doctor.name}</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #334155;">Hello <strong>\${patient.name}</strong>,</p>
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 14px; margin: 16px 0;">
          <h3 style="margin: 0 0 6px 0; color: #065f46;">Patient-Friendly Summary</h3>
          <p style="margin: 0; color: #1e293b; font-size: 14px;">\${record.aiPatientFriendlySummary}</p>
        </div>

        \${prescriptions.length > 0 ? \`
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
            <tbody>\${prescriptionRows}</tbody>
          </table>
        </div>\` : ''}

        \${followUpSteps.length > 0 ? \`
        <div style="margin: 20px 0;">
          <h3 style="color: #0f172a;">Next Steps:</h3>
          <ul style="color: #334155; padding-left: 20px;">\${followUpList}</ul>
        </div>\` : ''}
      </div>
    </div>
  \`;

  await sendNotificationEmail({
    to: patient.email,
    recipientId: patient.id,
    appointmentId: appointment.id,
    type: 'POST_VISIT_SUMMARY',
    subject: \`Your Post-Visit Summary & Prescription from Dr. \${doctor.name}\`,
    title: \`Post-Visit Summary from Dr. \${doctor.name}\`,
    message: \`Your post-visit summary is available in your patient portal.\`,
    htmlContent: html,
  });
}
`);

// 11. backend/src/services/booking.service.ts
writeFile('backend/src/services/booking.service.ts', `
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
  return \`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}\`;
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

  const targetDate = new Date(\`\${dateStr}T00:00:00Z\`);
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

  (async () => {
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
      });

      const fullAppointment = {
        ...appointment,
        preVisitSummary: preSummary,
      };

      await sendBookingConfirmationNotification(fullAppointment);
    } catch (bgError) {
      console.error('[Booking Post-Processing Error]:', bgError);
    }
  })();

  return appointment;
}
`);

// 12. backend/src/services/leave.service.ts
writeFile('backend/src/services/leave.service.ts', `
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
        cancellationReason: \`Doctor on leave: \${reason || 'Physician unavailable'}\`,
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
      console.error(\`[Leave Conflict] Failed to notify patient:\`, notifyErr);
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
      time: \`\${a.startTime} - \${a.endTime}\`,
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
`);

// 13. backend/src/services/scheduler.service.ts
writeFile('backend/src/services/scheduler.service.ts', `
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
    const html = \`
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Reminder: Appointment Tomorrow</h2>
        <p>Hello <strong>\${appt.patient.name}</strong>,</p>
        <p>This is a reminder for your medical appointment with <strong>Dr. \${appt.doctor.user.name}</strong> (\${appt.doctor.specialty}).</p>
        <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin: 12px 0;">
          <p style="margin: 4px 0;"><strong>Date:</strong> Tomorrow, \${appt.date}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> \${appt.startTime} - \${appt.endTime}</p>
        </div>
      </div>
    \`;

    await sendNotificationEmail({
      to: appt.patient.email,
      recipientId: appt.patient.id,
      appointmentId: appt.id,
      type: 'REMINDER_24H',
      subject: \`Reminder: Appointment with Dr. \${appt.doctor.user.name} Tomorrow at \${appt.startTime}\`,
      title: \`Upcoming Appointment in 24 Hours\`,
      message: \`Reminder: You have an appointment with Dr. \${appt.doctor.user.name} tomorrow, \${appt.date} at \${appt.startTime}.\`,
      htmlContent: html,
    });
  }

  const currentHour = now.getUTCHours();
  const nextHourStr = \`\${(currentHour + 1).toString().padStart(2, '0')}:\`;

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
    const html = \`
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ea580c;">Appointment in 1 Hour</h2>
        <p>Hello <strong>\${appt.patient.name}</strong>,</p>
        <p>Your appointment with <strong>Dr. \${appt.doctor.user.name}</strong> is starting soon at <strong>\${appt.startTime}</strong>.</p>
      </div>
    \`;

    await sendNotificationEmail({
      to: appt.patient.email,
      recipientId: appt.patient.id,
      appointmentId: appt.id,
      type: 'REMINDER_1H',
      subject: \`Urgent Reminder: Appointment with Dr. \${appt.doctor.user.name} in 1 hour (\${appt.startTime})\`,
      title: \`Appointment Starting in 1 Hour\`,
      message: \`Your appointment with Dr. \${appt.doctor.user.name} begins at \${appt.startTime} today.\`,
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

        const html = \`
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #10b981; border-radius: 8px; max-width: 500px;">
            <h2 style="color: #059669; margin-top: 0;">💊 Medication Dose Reminder</h2>
            <p>Hello <strong>\${reminder.patient.name}</strong>,</p>
            <p>It's time to take your scheduled medication:</p>
            <div style="background: #f0fdf4; padding: 14px; border-radius: 6px; margin: 12px 0;">
              <p style="margin: 4px 0;"><strong>Medication:</strong> \${reminder.medicationName}</p>
              <p style="margin: 4px 0;"><strong>Dosage:</strong> \${reminder.dosage}</p>
              <p style="margin: 4px 0;"><strong>Frequency:</strong> \${reminder.frequency}</p>
            </div>
          </div>
        \`;

        await sendNotificationEmail({
          to: reminder.patient.email,
          recipientId: reminder.patient.id,
          appointmentId: reminder.appointmentId || undefined,
          type: 'MEDICATION_REMINDER',
          subject: \`Medication Reminder: Time to take \${reminder.medicationName} (\${reminder.dosage})\`,
          title: \`Medication Dose: \${reminder.medicationName}\`,
          message: \`It is time to take \${reminder.medicationName} (\${reminder.dosage}).\`,
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
        console.log(\`[Scheduler] Cleaned up \${cleaned} expired slot hold(s).\`);
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
`);

// 14. backend/src/controllers/auth.controller.ts
writeFile('backend/src/controllers/auth.controller.ts', `
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/index';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { prisma } from '../utils/prisma';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['PATIENT', 'DOCTOR', 'ADMIN']).default('PATIENT'),
  specialty: z.string().optional(),
  qualification: z.string().optional(),
  experienceYears: z.number().optional(),
  consultationFee: z.number().optional(),
  slotDurationMinutes: z.number().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const data = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    res.status(400).json({ success: false, message: 'Email address is already registered.' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      phone: data.phone || null,
      role: data.role,
    },
  });

  if (data.role === 'DOCTOR') {
    const defaultWorkingHours = [
      { dayOfWeek: 1, dayName: 'Monday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
      { dayOfWeek: 2, dayName: 'Tuesday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
      { dayOfWeek: 3, dayName: 'Wednesday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
      { dayOfWeek: 4, dayName: 'Thursday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
      { dayOfWeek: 5, dayName: 'Friday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
      { dayOfWeek: 6, dayName: 'Saturday', startTime: '10:00', endTime: '14:00', isWorking: false, breaks: [] },
      { dayOfWeek: 0, dayName: 'Sunday', startTime: '10:00', endTime: '14:00', isWorking: false, breaks: [] },
    ];

    await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        specialty: data.specialty || 'General Physician',
        qualification: data.qualification || 'MBBS, MD',
        experienceYears: data.experienceYears || 5,
        consultationFee: data.consultationFee || 75.0,
        slotDurationMinutes: data.slotDurationMinutes || 30,
        workingHours: JSON.stringify(defaultWorkingHours),
      },
    });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { doctorProfile: true },
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: fullUser.id,
      email: fullUser.email,
      name: fullUser.name,
      role: fullUser.role,
      phone: fullUser.phone,
      doctorProfileId: fullUser.doctorProfile?.id || null,
    },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    include: { doctorProfile: true },
  });

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });

  res.json({
    success: true,
    message: 'Logged in successfully',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      doctorProfileId: user.doctorProfile?.id || null,
    },
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      doctorProfile: true,
      slotHolds: {
        where: { expiresAt: { gt: new Date() } },
      },
    },
  });

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      doctorProfileId: user.doctorProfile?.id || null,
      activeSlotHolds: user.slotHolds,
    },
  });
};
`);

// 15. backend/src/controllers/doctor.controller.ts
writeFile('backend/src/controllers/doctor.controller.ts', `
import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { prisma } from '../utils/prisma';

export const getAllDoctors = async (req: Request, res: Response): Promise<void> => {
  const { specialty, search } = req.query;

  const whereClause: any = {
    isActive: true,
  };

  if (specialty && typeof specialty === 'string' && specialty !== 'All') {
    whereClause.specialty = {
      contains: specialty,
    };
  }

  if (search && typeof search === 'string') {
    whereClause.OR = [
      { user: { name: { contains: search } } },
      { specialty: { contains: search } },
      { qualification: { contains: search } },
    ];
  }

  const doctors = await prisma.doctorProfile.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      leaves: {
        where: {
          status: 'APPROVED',
          endDate: { gte: new Date().toISOString().slice(0, 10) },
        },
      },
    },
    orderBy: { rating: 'desc' },
  });

  const formatted = doctors.map((doc: any) => ({
    id: doc.id,
    userId: doc.userId,
    name: doc.user?.name,
    email: doc.user?.email,
    phone: doc.user?.phone,
    avatarUrl: doc.user?.avatarUrl,
    specialty: doc.specialty,
    bio: doc.bio,
    qualification: doc.qualification,
    experienceYears: doc.experienceYears,
    consultationFee: doc.consultationFee,
    slotDurationMinutes: doc.slotDurationMinutes,
    workingHours: JSON.parse(doc.workingHours || '[]'),
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    upcomingLeaves: (doc.leaves || []).map((l: any) => ({
      id: l.id,
      startDate: l.startDate,
      endDate: l.endDate,
      reason: l.reason,
    })),
  }));

  res.json({
    success: true,
    count: formatted.length,
    doctors: formatted,
  });
};

export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const doctor: any = await prisma.doctorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      leaves: {
        where: {
          status: 'APPROVED',
          endDate: { gte: new Date().toISOString().slice(0, 10) },
        },
      },
    },
  });

  if (!doctor) {
    res.status(404).json({ success: false, message: 'Doctor not found.' });
    return;
  }

  res.json({
    success: true,
    doctor: {
      id: doctor.id,
      userId: doctor.userId,
      name: doctor.user?.name,
      email: doctor.user?.email,
      phone: doctor.user?.phone,
      avatarUrl: doctor.user?.avatarUrl,
      specialty: doctor.specialty,
      bio: doctor.bio,
      qualification: doctor.qualification,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      slotDurationMinutes: doctor.slotDurationMinutes,
      workingHours: JSON.parse(doctor.workingHours || '[]'),
      rating: doctor.rating,
      reviewCount: doctor.reviewCount,
      upcomingLeaves: doctor.leaves,
    },
  });
};

const updateProfileSchema = z.object({
  specialty: z.string().optional(),
  bio: z.string().optional(),
  qualification: z.string().optional(),
  experienceYears: z.number().optional(),
  consultationFee: z.number().optional(),
  slotDurationMinutes: z.number().min(15).max(120).optional(),
  workingHours: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
});

export const updateDoctorProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const data = updateProfileSchema.parse(req.body);

  const doctor = await prisma.doctorProfile.findUnique({ where: { id } });
  if (!doctor) {
    res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    return;
  }

  if (req.user?.role !== 'ADMIN' && doctor.userId !== req.user?.id) {
    res.status(403).json({ success: false, message: 'Forbidden.' });
    return;
  }

  const updated = await prisma.doctorProfile.update({
    where: { id },
    data: {
      specialty: data.specialty,
      bio: data.bio,
      qualification: data.qualification,
      experienceYears: data.experienceYears,
      consultationFee: data.consultationFee,
      slotDurationMinutes: data.slotDurationMinutes,
      workingHours: data.workingHours ? JSON.stringify(data.workingHours) : undefined,
      isActive: data.isActive,
    },
    include: { user: true },
  });

  res.json({
    success: true,
    message: 'Doctor profile updated successfully.',
    doctor: {
      ...updated,
      workingHours: JSON.parse(updated.workingHours || '[]'),
    },
  });
};

export const getDoctorSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  let doctorId = req.query.doctorId as string;

  if (!doctorId && req.user?.doctorProfileId) {
    doctorId = req.user.doctorProfileId;
  }

  if (!doctorId) {
    res.status(400).json({ success: false, message: 'Doctor ID is required.' });
    return;
  }

  const { date, status } = req.query;

  const whereClause: any = {
    doctorId,
  };

  if (date && typeof date === 'string') {
    whereClause.date = date;
  }

  if (status && typeof status === 'string') {
    whereClause.status = status;
  }

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      preVisitSummary: true,
      postVisitRecord: true,
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  const formatted = appointments.map((a: any) => ({
    id: a.id,
    date: a.date,
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
    symptomsText: a.symptomsText,
    cancellationReason: a.cancellationReason,
    patient: a.patient,
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
`);

// 16. backend/src/controllers/appointment.controller.ts
writeFile('backend/src/controllers/appointment.controller.ts', `
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
  date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  startTime: z.string().regex(/^\\d{2}:\\d{2}$/),
  endTime: z.string().regex(/^\\d{2}:\\d{2}$/),
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
  date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  startTime: z.string().regex(/^\\d{2}:\\d{2}$/),
  endTime: z.string().regex(/^\\d{2}:\\d{2}$/),
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
      title: \`Consultation: Dr. \${appt.doctor?.user?.name} & \${appt.patient?.name}\`,
      description: \`Appointment with Dr. \${appt.doctor?.user?.name} (\${appt.doctor?.specialty}). Symptoms: \${appt.symptomsText || 'General consultation'}\`,
      date: appt.date,
      startTime: appt.startTime,
      endTime: appt.endTime,
      doctorName: appt.doctor?.user?.name,
      patientName: appt.patient?.name,
      patientEmail: appt.patient?.email,
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', \`attachment; filename="appointment-\${appt.date}.ics"\`);
    res.send(icsString);
  } catch (error) {
    res.status(500).send('Error generating calendar file.');
  }
};
`);

// 17. backend/src/controllers/consultation.controller.ts
writeFile('backend/src/controllers/consultation.controller.ts', `
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
`);

// 18. backend/src/controllers/leave.controller.ts
writeFile('backend/src/controllers/leave.controller.ts', `
import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { applyDoctorLeave, previewLeaveConflicts } from '../services/leave.service';
import { prisma } from '../utils/prisma';

const previewSchema = z.object({
  doctorId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  endDate: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
});

export const previewConflicts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const data = previewSchema.parse(req.body);

  let doctorId = data.doctorId;
  if (!doctorId && req.user?.doctorProfileId) {
    doctorId = req.user.doctorProfileId;
  }

  if (!doctorId) {
    res.status(400).json({ success: false, message: 'doctorId is required.' });
    return;
  }

  try {
    const preview = await previewLeaveConflicts(doctorId, data.startDate, data.endDate);
    res.json({
      success: true,
      ...preview,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const applySchema = z.object({
  doctorId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  endDate: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  reason: z.string().optional(),
});

export const applyLeave = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const data = applySchema.parse(req.body);

  let doctorId = data.doctorId;
  if (!doctorId && req.user?.doctorProfileId) {
    doctorId = req.user.doctorProfileId;
  }

  if (!doctorId) {
    res.status(400).json({ success: false, message: 'doctorId is required.' });
    return;
  }

  try {
    const result = await applyDoctorLeave({
      doctorId,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
    });

    res.status(201).json({
      success: true,
      message: \`Leave successfully recorded. \${result.affectedAppointmentsCount} conflicting appointment(s) were cancelled and patients notified.\`,
      result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDoctorLeaves = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  let doctorId = req.query.doctorId as string;
  if (!doctorId && req.user?.doctorProfileId) {
    doctorId = req.user.doctorProfileId;
  }

  const whereClause: any = {};
  if (doctorId) {
    whereClause.doctorId = doctorId;
  }

  const leaves = await prisma.doctorLeave.findMany({
    where: whereClause,
    include: {
      doctor: {
        include: { user: true },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  res.json({
    success: true,
    count: leaves.length,
    leaves,
  });
};

export const cancelLeave = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  const leave = await prisma.doctorLeave.findUnique({ where: { id } });
  if (!leave) {
    res.status(404).json({ success: false, message: 'Leave record not found.' });
    return;
  }

  await prisma.doctorLeave.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Leave record successfully removed.',
  });
};
`);

// 19. backend/src/controllers/notification.controller.ts
writeFile('backend/src/controllers/notification.controller.ts', `
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
  scheduledDate: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  scheduledTime: z.string().regex(/^\\d{2}:\\d{2}$/),
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
    message: \`Dose marked as \${data.status.toLowerCase()}.\`,
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
    htmlContent: log.htmlContent || \`<p>\${log.message}</p>\`,
  });

  res.json({
    success,
    message: success ? 'Notification re-sent successfully.' : 'Notification retry failed.',
  });
};
`);

// 20. backend/src/controllers/admin.controller.ts
writeFile('backend/src/controllers/admin.controller.ts', `
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { prisma } from '../utils/prisma';

export const getClinicAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const [
    totalAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledLeaveAppointments,
    cancelledPatientAppointments,
    totalDoctors,
    totalPatients,
    preVisitSummaries,
    notifications,
  ] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    prisma.appointment.count({ where: { status: 'CANCELLED_DUE_TO_LEAVE' } }),
    prisma.appointment.count({ where: { status: 'CANCELLED_BY_PATIENT' } }),
    prisma.doctorProfile.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'PATIENT' } }),
    prisma.preVisitSummary.findMany({ select: { urgencyLevel: true } }),
    prisma.notificationLog.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  const urgencyCounts = {
    HIGH: preVisitSummaries.filter((s: any) => s.urgencyLevel === 'HIGH').length,
    MEDIUM: preVisitSummaries.filter((s: any) => s.urgencyLevel === 'MEDIUM').length,
    LOW: preVisitSummaries.filter((s: any) => s.urgencyLevel === 'LOW').length,
  };

  const completedWithDoc = await prisma.appointment.findMany({
    where: { status: { in: ['COMPLETED', 'CONFIRMED'] } },
    include: { doctor: { select: { consultationFee: true } } },
  });

  const estimatedRevenue = completedWithDoc.reduce(
    (acc: number, curr: any) => acc + (curr.doctor?.consultationFee || 0),
    0
  );

  res.json({
    success: true,
    analytics: {
      totalAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledLeaveAppointments,
      cancelledPatientAppointments,
      totalDoctors,
      totalPatients,
      estimatedRevenue,
      urgencyCounts,
      notificationHealth: notifications.reduce((acc: any, curr: any) => {
        acc[curr.status] = curr._count.id;
        return acc;
      }, {}),
    },
  });
};

const createDoctorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  specialty: z.string().min(2),
  bio: z.string().optional(),
  qualification: z.string().min(2),
  experienceYears: z.number().min(0),
  consultationFee: z.number().min(0),
  slotDurationMinutes: z.number().default(30),
  workingHours: z.array(z.any()).optional(),
});

export const adminCreateDoctor = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const data = createDoctorSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    res.status(400).json({ success: false, message: 'Email is already in use.' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const defaultWorkingHours = data.workingHours || [
    { dayOfWeek: 1, dayName: 'Monday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
    { dayOfWeek: 2, dayName: 'Tuesday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
    { dayOfWeek: 3, dayName: 'Wednesday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
    { dayOfWeek: 4, dayName: 'Thursday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
    { dayOfWeek: 5, dayName: 'Friday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
    { dayOfWeek: 6, dayName: 'Saturday', startTime: '10:00', endTime: '14:00', isWorking: false, breaks: [] },
    { dayOfWeek: 0, dayName: 'Sunday', startTime: '10:00', endTime: '14:00', isWorking: false, breaks: [] },
  ];

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      phone: data.phone || null,
      role: 'DOCTOR',
      doctorProfile: {
        create: {
          specialty: data.specialty,
          bio: data.bio || \`Specialist in \${data.specialty}\`,
          qualification: data.qualification,
          experienceYears: data.experienceYears,
          consultationFee: data.consultationFee,
          slotDurationMinutes: data.slotDurationMinutes,
          workingHours: JSON.stringify(defaultWorkingHours),
        },
      },
    },
    include: { doctorProfile: true },
  });

  res.status(201).json({
    success: true,
    message: 'Doctor created successfully.',
    doctor: user,
  });
};

export const getAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const logs = await prisma.notificationLog.findMany({
    include: {
      recipient: {
        select: { name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json({
    success: true,
    count: logs.length,
    logs,
  });
};
`);

// 21. backend/src/routes/auth.routes.ts
writeFile('backend/src/routes/auth.routes.ts', `
import { Router } from 'express';
import { getMe, login, register } from '../controllers/auth.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateJwt, getMe);

export default router;
`);

// 22. backend/src/routes/doctor.routes.ts
writeFile('backend/src/routes/doctor.routes.ts', `
import { Router } from 'express';
import {
  getAllDoctors,
  getDoctorById,
  getDoctorSchedule,
  updateDoctorProfile,
} from '../controllers/doctor.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);
router.put('/:id', authenticateJwt, updateDoctorProfile);
router.get('/schedule/view', authenticateJwt, getDoctorSchedule);

export default router;
`);

// 23. backend/src/routes/appointment.routes.ts
writeFile('backend/src/routes/appointment.routes.ts', `
import { Router } from 'express';
import {
  cancelAppointment,
  createBooking,
  downloadIcsFile,
  getAppointmentById,
  getMyAppointments,
  getSlots,
  holdSlot,
  releaseHold,
} from '../controllers/appointment.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();

router.get('/slots', getSlots);
router.get('/:id/ics', downloadIcsFile);
router.post('/hold', authenticateJwt, holdSlot);
router.post('/release-hold', releaseHold);
router.post('/book', authenticateJwt, createBooking);
router.get('/my', authenticateJwt, getMyAppointments);
router.get('/:id', authenticateJwt, getAppointmentById);
router.post('/:id/cancel', authenticateJwt, cancelAppointment);

export default router;
`);

// 24. backend/src/routes/consultation.routes.ts
writeFile('backend/src/routes/consultation.routes.ts', `
import { Router } from 'express';
import {
  getPostVisitRecord,
  previewAiPostVisit,
  saveConsultationRecord,
} from '../controllers/consultation.controller';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.post('/preview-ai', authenticateJwt, requireRole('DOCTOR', 'ADMIN'), previewAiPostVisit);
router.post('/save', authenticateJwt, requireRole('DOCTOR', 'ADMIN'), saveConsultationRecord);
router.get('/record/:appointmentId', authenticateJwt, getPostVisitRecord);

export default router;
`);

// 25. backend/src/routes/leave.routes.ts
writeFile('backend/src/routes/leave.routes.ts', `
import { Router } from 'express';
import {
  applyLeave,
  cancelLeave,
  getDoctorLeaves,
  previewConflicts,
} from '../controllers/leave.controller';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.post('/preview', authenticateJwt, requireRole('DOCTOR', 'ADMIN'), previewConflicts);
router.post('/apply', authenticateJwt, requireRole('DOCTOR', 'ADMIN'), applyLeave);
router.get('/', authenticateJwt, getDoctorLeaves);
router.delete('/:id', authenticateJwt, requireRole('DOCTOR', 'ADMIN'), cancelLeave);

export default router;
`);

// 26. backend/src/routes/notification.routes.ts
writeFile('backend/src/routes/notification.routes.ts', `
import { Router } from 'express';
import {
  getMedicationReminders,
  getUserNotifications,
  logMedicationDose,
  resendNotification,
} from '../controllers/notification.controller';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/my', authenticateJwt, getUserNotifications);
router.get('/medications', authenticateJwt, getMedicationReminders);
router.post('/medications/log', authenticateJwt, logMedicationDose);
router.post('/resend/:id', authenticateJwt, requireRole('ADMIN'), resendNotification);

export default router;
`);

// 27. backend/src/routes/admin.routes.ts
writeFile('backend/src/routes/admin.routes.ts', `
import { Router } from 'express';
import {
  adminCreateDoctor,
  getAuditLogs,
  getClinicAnalytics,
} from '../controllers/admin.controller';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJwt, requireRole('ADMIN'));

router.get('/analytics', getClinicAnalytics);
router.post('/doctors', adminCreateDoctor);
router.get('/logs', getAuditLogs);

export default router;
`);

// 28. backend/src/routes/index.ts
writeFile('backend/src/routes/index.ts', `
import { Router } from 'express';
import adminRoutes from './admin.routes';
import appointmentRoutes from './appointment.routes';
import authRoutes from './auth.routes';
import consultationRoutes from './consultation.routes';
import doctorRoutes from './doctor.routes';
import leaveRoutes from './leave.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/consultations', consultationRoutes);
router.use('/leaves', leaveRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Healthcare Appointment & Follow-up Manager API',
  });
});

export default router;
`);

// 29. backend/src/server.ts
writeFile('backend/src/server.ts', `
import cors from 'cors';
import express from 'express';
import { config } from './config/index';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import routes from './routes/index';
import { startBackgroundScheduler } from './services/scheduler.service';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(\`[HTTP] \${req.method} \${req.url}\`);
    next();
  });
}

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(\`🚀 HealthCare Backend API running on port \${config.port} (\${config.nodeEnv} mode)\`);
  console.log(\`🌐 Base URL: http://localhost:\${config.port}/api\`);

  startBackgroundScheduler();
});

export default app;
`);

// 30. frontend/package.json
writeFile('frontend/package.json', JSON.stringify({
  "name": "healthcare-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "axios": "^1.7.7",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.460.0",
    "postcss": "^8.4.49",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "tailwind-merge": "^2.5.4",
    "tailwindcss": "^3.4.15",
    "typescript": "^5.6.3",
    "vite": "^5.4.11"
  }
}, null, 2));

// 31. frontend/src/api/index.ts
writeFile('frontend/src/api/index.ts', `
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
`);

// 32. frontend/src/context/AuthContext.tsx
writeFile('frontend/src/context/AuthContext.tsx', `
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/index';
import { User, UserRole } from '../types/index';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  switchPersona: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (e) {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password = 'Password123!') => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    }
  };

  const switchPersona = async (role: UserRole) => {
    setLoading(true);
    let targetEmail = 'patient@cliniccare.com';
    if (role === 'DOCTOR') {
      targetEmail = 'doctor.jenkins@cliniccare.com';
    } else if (role === 'ADMIN') {
      targetEmail = 'admin@cliniccare.com';
    }

    try {
      await login(targetEmail, 'Password123!');
    } catch (error) {
      console.error('Failed to switch persona:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        switchPersona,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
`);

// 33. frontend/src/components/common/UrgencyBadge.tsx
writeFile('frontend/src/components/common/UrgencyBadge.tsx', `
import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface UrgencyBadgeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({
  level,
  size = 'md',
  showIcon = true,
}) => {
  const norm = (level || 'LOW').toUpperCase();

  const configs: Record<string, { bg: string; text: string; border: string; label: string; icon: any }> = {
    HIGH: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      label: 'High Urgency',
      icon: AlertCircle,
    },
    MEDIUM: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      label: 'Medium Urgency',
      icon: AlertTriangle,
    },
    LOW: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      label: 'Low Urgency',
      icon: CheckCircle2,
    },
  };

  const current = configs[norm] || configs.LOW;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-bold px-3.5 py-1.5 gap-2',
  };

  return (
    <span
      className={\`inline-flex items-center rounded-full border \${current.bg} \${current.text} \${current.border} \${sizeClasses[size]}\`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      {current.label}
    </span>
  );
};
`);

// 34. frontend/src/components/common/StatusBadge.tsx
writeFile('frontend/src/components/common/StatusBadge.tsx', `
import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    CONFIRMED: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', label: 'Confirmed' },
    COMPLETED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Completed' },
    CANCELLED_BY_PATIENT: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700', label: 'Cancelled (Patient)' },
    CANCELLED_BY_DOCTOR: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', label: 'Cancelled (Doctor)' },
    CANCELLED_DUE_TO_LEAVE: { bg: 'bg-red-50 text-red-700 border-red-200 font-semibold', text: 'text-red-700', label: 'Doctor on Leave' },
    NO_SHOW: { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', label: 'No Show' },
  };

  const current = configs[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: status };

  return (
    <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border \${current.bg}\`}>
      {current.label}
    </span>
  );
};
`);

// 35. frontend/src/components/common/NotificationDrawer.tsx
writeFile('frontend/src/components/common/NotificationDrawer.tsx', `
import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Clock, Mail, RefreshCw, X } from 'lucide-react';
import api from '../../api/index';
import { NotificationLog } from '../../types/index';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/my');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5" />
              <h2 className="text-lg font-bold">Notifications & Alerts</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                title="Refresh notifications"
              >
                <RefreshCw className={\`w-4 h-4 \${loading ? 'animate-spin' : ''}\`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No notification alerts yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="py-3.5 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-800">{n.title}</h4>
                    <span
                      className={\`text-[11px] px-2 py-0.5 rounded font-medium \${
                        n.type === 'LEAVE_CANCELLATION'
                          ? 'bg-red-100 text-red-700'
                          : n.type === 'POST_VISIT_SUMMARY'
                          ? 'bg-emerald-100 text-emerald-700'
                          : n.type === 'MEDICATION_REMINDER'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }\`}
                    >
                      {n.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-2">{n.message}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Delivered
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
`);

// 36. frontend/src/components/common/Navbar.tsx
writeFile('frontend/src/components/common/Navbar.tsx', `
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  Bell,
  Calendar,
  ChevronDown,
  Clock,
  Heart,
  LogOut,
  Pill,
  Shield,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/index';
import { NotificationDrawer } from './NotificationDrawer';

export const Navbar: React.FC = () => {
  const { user, logout, switchPersona, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Top Quick Role Switcher Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-200">Instant Demo Persona Switcher:</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 my-0.5">
          <button
            onClick={() => switchPersona('PATIENT')}
            disabled={loading}
            className={\`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 \${
              user?.role === 'PATIENT'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }\`}
          >
            <User className="w-3.5 h-3.5" />
            Patient Mode
          </button>
          <button
            onClick={() => switchPersona('DOCTOR')}
            disabled={loading}
            className={\`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 \${
              user?.role === 'DOCTOR'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }\`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Doctor Mode
          </button>
          <button
            onClick={() => switchPersona('ADMIN')}
            disabled={loading}
            className={\`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 \${
              user?.role === 'ADMIN'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }\`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin Mode
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                CuraPulse
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                Health Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links by Role */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {user.role === 'PATIENT' && (
                <>
                  <Link
                    to="/patient/doctors"
                    className={\`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${
                      isActive('/patient/doctors')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }\`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    Book Doctor
                  </Link>
                  <Link
                    to="/patient/appointments"
                    className={\`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${
                      isActive('/patient/appointments')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }\`}
                  >
                    <Calendar className="w-4 h-4" />
                    My Appointments
                  </Link>
                  <Link
                    to="/patient/medications"
                    className={\`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${
                      isActive('/patient/medications')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }\`}
                  >
                    <Pill className="w-4 h-4" />
                    Medication Tracker
                  </Link>
                </>
              )}

              {user.role === 'DOCTOR' && (
                <>
                  <Link
                    to="/doctor/dashboard"
                    className={\`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${
                      isActive('/doctor/dashboard')
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }\`}
                  >
                    <Calendar className="w-4 h-4" />
                    Patient Queue & Schedule
                  </Link>
                  <Link
                    to="/doctor/leaves"
                    className={\`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${
                      isActive('/doctor/leaves')
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }\`}
                  >
                    <Clock className="w-4 h-4" />
                    Leave Management
                  </Link>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={\`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${
                      isActive('/admin/dashboard')
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }\`}
                  >
                    <Activity className="w-4 h-4" />
                    Analytics Dashboard
                  </Link>
                  <Link
                    to="/admin/doctors"
                    className={\`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${
                      isActive('/admin/doctors')
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }\`}
                  >
                    <Users className="w-4 h-4" />
                    Doctor Management
                  </Link>
                  <Link
                    to="/admin/conflicts"
                    className={\`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${
                      isActive('/admin/conflicts')
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }\`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Leave Conflict Monitor
                  </Link>
                  <Link
                    to="/admin/logs"
                    className={\`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 \${
                      isActive('/admin/logs')
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }\`}
                  >
                    <Clock className="w-4 h-4" />
                    Notification Audit Logs
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setIsNotifOpen(true)}
                  className="p-2 rounded-full text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600"></span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-800 leading-tight">{user.name}</div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {user.role}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
`);

// 37. render.yaml
writeFile('render.yaml', `
services:
  # ----------------------------------------------------
  # Backend API Web Service
  # ----------------------------------------------------
  - type: web
    name: curapulse-api
    runtime: node
    plan: free
    rootDir: backend
    buildCommand: npm install && npm run build && npx prisma db push --accept-data-loss && npm run seed
    startCommand: node dist/server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: DATABASE_URL
        value: "file:./dev.db"
      - key: JWT_SECRET
        generateValue: true

  # ----------------------------------------------------
  # Frontend Static Site
  # ----------------------------------------------------
  - type: web
    name: curapulse-frontend
    runtime: static
    rootDir: frontend
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_URL
        value: https://curapulse-api.onrender.com/api
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
`);

console.log('✅ All source code and config files populated successfully!');

