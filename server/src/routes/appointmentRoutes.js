import express from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, appointmentController.getAllAppointments);
router.post('/', verifyToken, appointmentController.createAppointment);
router.get('/:id', verifyToken, appointmentController.getAppointmentById);
router.put('/:id', verifyToken, appointmentController.updateAppointment);
router.delete('/:id', verifyToken, appointmentController.cancelAppointment);

export default router;
