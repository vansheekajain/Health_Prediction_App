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
