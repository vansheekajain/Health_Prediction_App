import { Router } from 'express';
import {
  cancelAppointment,
  createBooking,
  downloadIcsFile,
  getAppointmentById,
  getMyAppointments,
  getSlots,
  holdSlot,
  releaseHold,
} from '../controllers/appointment.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();

router.get('/slots', getSlots);
router.get('/:id/ics', downloadIcsFile);
router.post('/hold', authenticateJwt, holdSlot);
router.post('/release-hold', releaseHold);
router.post('/book', authenticateJwt, createBooking);
router.get('/my', authenticateJwt, getMyAppointments);
router.get('/:id', authenticateJwt, getAppointmentById);
router.post('/:id/cancel', authenticateJwt, cancelAppointment);

export default router;
