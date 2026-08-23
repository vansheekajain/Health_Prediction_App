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
