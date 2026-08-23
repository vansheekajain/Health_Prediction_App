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
