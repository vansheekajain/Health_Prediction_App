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
