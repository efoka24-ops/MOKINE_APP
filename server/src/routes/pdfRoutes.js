import express from 'express';
import * as pdfController from '../controllers/pdfController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/prescription/:id', verifyToken, pdfController.generatePrescriptionPDF);
router.get('/prescription/:id/verify', pdfController.verifyPrescription);
// Alias for frontend API.js compatibility
router.get('/verify/:id', pdfController.verifyPrescription);

// Reçu de paiement (accessible à tous les rôles authentifiés)
router.get('/payment-receipt/:paymentId', verifyToken, pdfController.generatePaymentReceiptPDF);

export default router;
