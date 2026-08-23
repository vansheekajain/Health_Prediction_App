import { Router } from 'express';
import {
  adminCreateDoctor,
  getAuditLogs,
  getClinicAnalytics,
} from '../controllers/admin.controller';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJwt, requireRole('ADMIN'));

router.get('/analytics', getClinicAnalytics);
router.post('/doctors', adminCreateDoctor);
router.get('/logs', getAuditLogs);

export default router;
