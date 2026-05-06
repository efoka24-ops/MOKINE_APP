import express from 'express';
import * as consultationController from '../controllers/consultationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, consultationController.getAllConsultations);
router.post('/', verifyToken, consultationController.createConsultation);
router.get('/:id', verifyToken, consultationController.getConsultationById);
router.put('/:id', verifyToken, consultationController.updateConsultation);

export default router;
