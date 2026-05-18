import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { verifyToken, verifyApiKey, requireAdmin } from '../middleware/authMiddleware.js';
import { validate, paymentRules } from '../middleware/validation.js';

const router = express.Router();

// ─── Paiements internes (abonnements MokineVeto) ──────────────────────────────
router.post('/process', verifyToken, paymentRules, validate, paymentController.processPayment);
router.get('/history', verifyToken, paymentController.getPaymentHistory);
router.post('/refund', verifyToken, paymentController.refundPayment);

// ─── API Commerciale (Camoo Payment) ─────────────────────────────────────────
router.post('/commercial/initiate', paymentController.initiateCommercialPayment);
router.get('/commercial/verify',    paymentController.verifyCommercialPayment);
router.get('/commercial/webhook',   paymentController.camooWebhook);
router.get('/commercial/dashboard', verifyApiKey, paymentController.getCommercialDashboard);
// Admin: Camoo account balance (requires valid admin JWT)
router.get('/commercial/balance',   verifyToken, requireAdmin, paymentController.getCamooBalance);

export default router;
