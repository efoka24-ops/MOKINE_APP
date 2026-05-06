import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/process', verifyToken, paymentController.processPayment);
router.get('/history', verifyToken, paymentController.getPaymentHistory);
router.post('/refund', verifyToken, paymentController.refundPayment);

export default router;
