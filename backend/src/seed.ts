import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

import bcrypt from 'bcryptjs';
import { prisma } from './utils/prisma';

async function main() {
  console.log('🌱 Seeding HealthCare Platform database with realistic demo records...');

  await prisma.calendarSync.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.medicationLog.deleteMany();
  await prisma.medicationReminder.deleteMany();
  await prisma.postVisitRecord.deleteMany();
  await prisma.preVisitSummary.deleteMany();
  await prisma.slotHold.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorLeave.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.user.deleteMany();

  const commonPassword = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Clinic Administrator',
      email: 'admin@cliniccare.com',
      passwordHash: commonPassword,
      role: 'ADMIN',
      phone: '+1 (555) 100-0001',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const defaultSchedule = [
    { dayOfWeek: 1, dayName: 'Monday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
    { dayOfWeek: 2, dayName: 'Tuesday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
    { dayOfWeek: 3, dayName: 'Wednesday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
    { dayOfWeek: 4, dayName: 'Thursday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
    { dayOfWeek: 5, dayName: 'Friday', startTime: '09:00', endTime: '17:00', isWorking: true, breaks: [{ startTime: '13:00', endTime: '14:00' }] },
    { dayOfWeek: 6, dayName: 'Saturday', startTime: '10:00', endTime: '14:00', isWorking: false, breaks: [] },
    { dayOfWeek: 0, dayName: 'Sunday', startTime: '10:00', endTime: '14:00', isWorking: false, breaks: [] },
  ];

  const doctorsData = [
    {
      name: 'Dr. Sarah Jenkins',
      email: 'doctor.jenkins@cliniccare.com',
      specialty: 'Cardiology',
      qualification: 'MD, FACC - Harvard Medical School',
      experienceYears: 14,
      consultationFee: 120.0,
      slotDurationMinutes: 30,
      bio: 'Board-certified cardiologist specializing in preventive cardiovascular care, hypertension, echocardiography, and arrhythmia management.',
      rating: 4.95,
      reviewCount: 48,
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    },
    {
      name: 'Dr. Marcus Chen',
      email: 'doctor.chen@cliniccare.com',
      specialty: 'Neurology',
      qualification: 'MD, PhD - Johns Hopkins University',
      experienceYears: 11,
      consultationFee: 135.0,
      slotDurationMinutes: 30,
      bio: 'Expert in clinical neurophysiology, chronic migraine therapy, neuro-imaging evaluation, and peripheral nerve disorders.',
      rating: 4.88,
      reviewCount: 39,
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    },
    {
      name: 'Dr. Priya Patel',
      email: 'doctor.patel@cliniccare.com',
      specialty: 'Dermatology',
      qualification: 'MD, FAAD - Stanford School of Medicine',
      experienceYears: 8,
      consultationFee: 95.0,
      slotDurationMinutes: 30,
      bio: 'Specialist in medical and surgical dermatology, eczema, psoriasis, acne management, and digital dermoscopy screening.',
      rating: 4.92,
      reviewCount: 56,
      avatarUrl: 'https://images.unsplash.com/photo-1594824813583-98444a7f0e69?w=150',
    },
    {
      name: 'Dr. James Wilson',
      email: 'doctor.wilson@cliniccare.com',
      specialty: 'General Physician & Internal Medicine',
      qualification: 'MBBS, MD - Columbia University',
      experienceYears: 16,
      consultationFee: 80.0,
      slotDurationMinutes: 30,
      bio: 'Comprehensive family physician providing preventive health screenings, chronic disease management, diabetes care, and lifestyle medicine.',
      rating: 4.91,
      reviewCount: 72,
      avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150',
    },
    {
      name: 'Dr. Emily Rodriguez',
      email: 'doctor.rodriguez@cliniccare.com',
      specialty: 'Pediatrics',
      qualification: 'MD, FAAP - UCLA David Geffen School of Medicine',
      experienceYears: 9,
      consultationFee: 85.0,
      slotDurationMinutes: 30,
      bio: 'Dedicated pediatrician focused on developmental milestones, childhood immunization, allergy treatment, and adolescent well-being.',
      rating: 4.97,
      reviewCount: 64,
      avatarUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150',
    },
  ];

  const createdDoctors = [];
  for (const doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        name: doc.name,
        email: doc.email,
        passwordHash: commonPassword,
        role: 'DOCTOR',
        phone: '+1 (555) 234-5678',
        avatarUrl: doc.avatarUrl,
        doctorProfile: {
          create: {
            specialty: doc.specialty,
            bio: doc.bio,
            qualification: doc.qualification,
            experienceYears: doc.experienceYears,
            consultationFee: doc.consultationFee,
            slotDurationMinutes: doc.slotDurationMinutes,
            workingHours: JSON.stringify(defaultSchedule),
            rating: doc.rating,
            reviewCount: doc.reviewCount,
          },
        },
      },
      include: { doctorProfile: true },
    });
    createdDoctors.push(user);
  }

  const patient1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'patient@cliniccare.com',
      passwordHash: commonPassword,
      role: 'PATIENT',
      phone: '+1 (555) 345-6789',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      name: 'Alice Smith',
      email: 'alice@cliniccare.com',
      passwordHash: commonPassword,
      role: 'PATIENT',
      phone: '+1 (555) 456-7890',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const appt1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: createdDoctors[0].doctorProfile!.id,
      date: todayStr,
      startTime: '10:00',
      endTime: '10:30',
      status: 'CONFIRMED',
      symptomsText: 'Experiencing sudden sharp chest pain radiating to left shoulder and mild shortness of breath for the past 4 hours.',
      preVisitSummary: {
        create: {
          symptomsText: 'Experiencing sudden sharp chest pain radiating to left shoulder and mild shortness of breath for the past 4 hours.',
          urgencyLevel: 'HIGH',
          chiefComplaint: 'Acute radiating chest pain with dyspnea',
          suggestedQuestions: JSON.stringify([
            'Does the chest pressure increase with physical exertion or deep inhalation?',
            'Do you have any personal or family history of coronary artery disease or hypertension?',
            'Have you experienced any dizziness, diaphoresis (sweating), or palpitations alongside the pain?',
          ]),
          triageNotes: 'HIGH PRIORITY: Acute onset of radiating chest discomfort with shortness of breath.',
        },
      },
    },
  });

  const appt2 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: createdDoctors[1].doctorProfile!.id,
      date: tomorrowStr,
      startTime: '11:00',
      endTime: '11:30',
      status: 'CONFIRMED',
      symptomsText: 'Severe throbbing migraine on right side of head with visual aura, light sensitivity, and nausea for 3 days.',
      preVisitSummary: {
        create: {
          symptomsText: 'Severe throbbing migraine on right side of head with visual aura, light sensitivity, and nausea for 3 days.',
          urgencyLevel: 'MEDIUM',
          chiefComplaint: 'Unilateral throbbing migraine with aura and photophobia',
          suggestedQuestions: JSON.stringify([
            'Are you currently taking any triptans or preventive migraine medication?',
            'Have you noticed specific triggers such as sleep deprivation or screen fatigue?',
            'Is there any neck stiffness or fever accompanying the headache?',
          ]),
          triageNotes: 'MEDIUM PRIORITY: 3-day duration migraine with classic aura and photophobia.',
        },
      },
    },
  });

  const appt3 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: createdDoctors[3].doctorProfile!.id,
      date: yesterdayStr,
      startTime: '14:00',
      endTime: '14:30',
      status: 'COMPLETED',
      symptomsText: 'Persistent seasonal allergy symptoms, nasal congestion, and mild fatigue.',
      preVisitSummary: {
        create: {
          symptomsText: 'Persistent seasonal allergy symptoms, nasal congestion, and mild fatigue.',
          urgencyLevel: 'LOW',
          chiefComplaint: 'Seasonal allergic rhinitis and nasal congestion',
          suggestedQuestions: JSON.stringify([
            'How frequently do allergy flare-ups occur throughout the year?',
            'Have over-the-counter antihistamines provided adequate relief?',
          ]),
          triageNotes: 'LOW PRIORITY: Mild upper respiratory allergic manifestation.',
        },
      },
      postVisitRecord: {
        create: {
          clinicalNotes: 'Patient evaluated for allergic rhinitis. Prescribed Cetirizine 10mg daily and Fluticasone nasal spray.',
          diagnosis: 'Moderate Seasonal Allergic Rhinitis',
          prescriptions: JSON.stringify([
            {
              medication: 'Cetirizine Hydrochloride',
              dosage: '10mg',
              frequency: 'Once daily at bedtime',
              instructions: 'Take with a glass of water after dinner',
              durationDays: 14,
              scheduledTimes: ['21:30'],
            },
            {
              medication: 'Fluticasone Propionate Nasal Spray',
              dosage: '50 mcg/actuation',
              frequency: '2 sprays in each nostril once daily',
              instructions: 'Blow nose gently before spraying',
              durationDays: 14,
              scheduledTimes: ['08:30'],
            },
          ]),
          aiPatientFriendlySummary: 'Dr. Wilson diagnosed you with seasonal allergic rhinitis. You have been prescribed a daily antihistamine (Cetirizine) and a soothing nasal spray (Fluticasone). Take your medications regularly for 14 days.',
          followUpSteps: JSON.stringify([
            'Take Cetirizine 10mg nightly at 9:30 PM',
            'Use Fluticasone nasal spray every morning after blowing nose',
          ]),
          lifestyleAdvice: JSON.stringify([
            'Keep bedroom windows closed during high pollen days',
            'Stay well-hydrated to help thin mucus secretions',
          ]),
        },
      },
    },
  });

  const med1 = await prisma.medicationReminder.create({
    data: {
      patientId: patient1.id,
      appointmentId: appt3.id,
      medicationName: 'Cetirizine Hydrochloride',
      dosage: '10mg',
      frequency: 'Once daily at bedtime',
      instructions: 'Take after dinner with water',
      scheduledTimes: JSON.stringify(['21:30']),
      startDate: yesterdayStr,
      endDate: new Date(today.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'ACTIVE',
    },
  });

  await prisma.medicationLog.create({
    data: {
      reminderId: med1.id,
      scheduledDate: yesterdayStr,
      scheduledTime: '21:30',
      status: 'TAKEN',
      takenAt: new Date(),
    },
  });

  console.log('✅ Database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
