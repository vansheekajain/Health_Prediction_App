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
