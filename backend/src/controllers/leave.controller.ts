import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { applyDoctorLeave, previewLeaveConflicts } from '../services/leave.service';
import { prisma } from '../utils/prisma';

const previewSchema = z.object({
  doctorId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
      message: `Leave successfully recorded. ${result.affectedAppointmentsCount} conflicting appointment(s) were cancelled and patients notified.`,
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
