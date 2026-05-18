import express from 'express';
import * as consultationController from '../controllers/consultationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, consultationController.getAllConsultations);
router.post('/', verifyToken, consultationController.createConsultation);
router.get('/prescriptions', verifyToken, consultationController.getPrescriptions);
router.post('/prescriptions', verifyToken, consultationController.createPrescription);
router.get('/:id', verifyToken, consultationController.getConsultationById);
router.put('/:id', verifyToken, consultationController.updateConsultation);
router.patch('/:id/accept', verifyToken, consultationController.acceptConsultation);
router.patch('/:id/refuse', verifyToken, consultationController.refuseConsultation);
router.post('/:id/request-info', verifyToken, consultationController.requestMoreInfo);
router.post('/:id/messages', verifyToken, consultationController.sendMessage);
router.patch('/:id/close', verifyToken, consultationController.closeConsultation);

export default router;
