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
