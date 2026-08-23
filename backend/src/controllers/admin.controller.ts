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
          bio: data.bio || `Specialist in ${data.specialty}`,
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
