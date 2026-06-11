import express from 'express';
import * as vetController from '../controllers/vetController.js';
import { generatePaymentReceiptPDF } from '../controllers/pdfController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', verifyToken, vetController.getVetDashboard);

// Agenda
router.get('/agenda', verifyToken, vetController.getAgenda);
router.post('/agenda', verifyToken, vetController.createAppointmentSlot);
router.put('/agenda/:id', verifyToken, vetController.updateAppointmentSlot);

// Patient history
router.get('/patients', verifyToken, vetController.getPatientHistory);

// Billing
router.post('/invoices', verifyToken, vetController.generateInvoice);
router.get('/invoices', verifyToken, vetController.getInvoices);
router.patch('/invoices/:id/paid', verifyToken, vetController.markInvoicePaid);

// Forum
router.get('/forum', verifyToken, vetController.getForumPosts);
router.post('/forum', verifyToken, vetController.createForumPost);
router.post('/forum/:id/reply', verifyToken, vetController.addForumReply);
router.post('/forum/:id/like', verifyToken, vetController.likeForumPost);
router.patch('/forum/:id/resolve', verifyToken, vetController.resolveForumPost);

// Patient reminders
router.get('/reminders', verifyToken, vetController.getReminders);
router.post('/reminders', verifyToken, vetController.createReminder);
router.patch('/reminders/:id/done', verifyToken, vetController.markReminderDone);

// Sensibilisation / Communication
router.get('/sensibilisation', vetController.getSensitisationPosts);
router.post('/sensibilisation', verifyToken, vetController.createSensitisationPost);

// Référer un confrère
router.get('/referral/vets', verifyToken, vetController.getAvailableVetsForReferral);
router.post('/referral', verifyToken, vetController.referColleague);

// Support / FAQ
router.get('/support/faq', vetController.getSupportFAQ);

// Reçu de paiement PDF
router.get('/payment-receipt/:paymentId', verifyToken, generatePaymentReceiptPDF);

export default router;
