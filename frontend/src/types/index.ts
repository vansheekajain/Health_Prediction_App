export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
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

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  specialty: string;
  bio?: string;
  qualification?: string;
  experienceYears: number;
  consultationFee: number;
  slotDurationMinutes: number;
  workingHours: DaySchedule[];
  rating: number;
  reviewCount: number;
  upcomingLeaves?: {
    id: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }[];
}

export interface SlotAvailability {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isHeld: boolean;
  holdExpiresAt?: string;
  reason?: string;
}

export interface PreVisitSummary {
  id: string;
  appointmentId: string;
  symptomsText: string;
  urgencyLevel: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
  triageNotes?: string;
  createdAt: string;
}

export interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  instructions: string;
  durationDays: number;
  scheduledTimes?: string[];
}

export interface PostVisitRecord {
  id: string;
  appointmentId: string;
  clinicalNotes: string;
  diagnosis?: string;
  prescriptions: PrescriptionItem[];
  aiPatientFriendlySummary: string;
  followUpSteps: string[];
  lifestyleAdvice: string[];
  createdAt: string;
}

export interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  symptomsText?: string;
  cancellationReason?: string;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  doctor: {
    id: string;
    name: string;
    email: string;
    specialty: string;
    consultationFee: number;
  };
  preVisitSummary?: PreVisitSummary | null;
  hasPostVisitRecord?: boolean;
  postVisitRecord?: PostVisitRecord | null;
}

export interface MedicationReminder {
  id: string;
  patientId: string;
  appointmentId?: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  scheduledTimes: string[];
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  logs: {
    id: string;
    scheduledDate: string;
    scheduledTime: string;
    status: 'PENDING' | 'TAKEN' | 'SKIPPED';
    takenAt?: string;
  }[];
}

export interface NotificationLog {
  id: string;
  recipientEmail: string;
  recipientId?: string;
  appointmentId?: string;
  type: string;
  title: string;
  message: string;
  htmlContent?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  retryCount: number;
  lastError?: string;
  sentAt?: string;
  createdAt: string;
}
