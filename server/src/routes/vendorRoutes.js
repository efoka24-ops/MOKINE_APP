import express from 'express';
import * as vendorController from '../controllers/vendorController.js';
import { generatePaymentReceiptPDF } from '../controllers/pdfController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', verifyToken, vendorController.getVendorDashboard);

// KYC
router.post('/kyc/submit', verifyToken, vendorController.submitKYC);
router.post('/kyc', verifyToken, vendorController.submitKYC);           // alias
router.get('/kyc/status', verifyToken, vendorController.getKYCStatus);
router.get('/kyc', verifyToken, vendorController.getKYCStatus);         // alias
router.post('/kyc/approve/:id', verifyToken, vendorController.approveKYC);
router.post('/kyc/reject/:id', verifyToken, vendorController.approveKYC); // same handler, checks body.action
router.patch('/kyc/:id/review', verifyToken, vendorController.approveKYC); // legacy alias

// Delivery tracking
router.patch('/orders/:id/tracking', verifyToken, vendorController.updateDeliveryStatus);
router.get('/orders/:id/tracking', verifyToken, vendorController.getDeliveryTracking);

// Mobile Money
router.post('/payment/mobile-money', verifyToken, vendorController.initiateMobileMoneyPayment);
router.post('/payment/initiate', verifyToken, vendorController.initiateMobileMoneyPayment); // alias
router.post('/payment/webhook', vendorController.confirmMobileMoneyWebhook);
router.post('/payment/:id/webhook', vendorController.confirmMobileMoneyWebhook);            // alias

// Points de vente
router.post('/sales-points', verifyToken, vendorController.createSalesPoint);
router.get('/sales-points', verifyToken, vendorController.getSalesPoints);

// Reçu de paiement PDF
router.get('/payment-receipt/:paymentId', verifyToken, generatePaymentReceiptPDF);

export default router;
