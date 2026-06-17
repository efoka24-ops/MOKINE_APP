import express from 'express';
import * as ctrl from '../../controllers/admin/adminController.js';
import { verifyToken, requireAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();
// All admin routes require a valid JWT AND admin/superadmin role
router.use(verifyToken, requireAdmin);

// ─── Global Dashboard & Analytics ─────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboard);
router.get('/analytics', ctrl.getAnalytics);

// ─── Colliers ──────────────────────────────────────────────────────────────────
router.get('/veto/collars',                         ctrl.getCollars);
router.patch('/veto/collars/:animalId/activate',    ctrl.activateCollar);
router.patch('/veto/collars/:animalId/deactivate',  ctrl.deactivateCollar);

// ─── MokineVeto ────────────────────────────────────────────────────────────────
router.get('/veto/vets', ctrl.getVets);
router.put('/veto/vets/:id', ctrl.updateVet);
router.patch('/veto/vets/:id/toggle-status', ctrl.toggleVetStatus);

router.get('/veto/farmers', ctrl.getFarmers);

router.get('/veto/animals', ctrl.getAllAnimals);
router.put('/veto/animals/:id', ctrl.updateAnimal);
router.delete('/veto/animals/:id', ctrl.deleteAnimal);

router.get('/veto/consultations', ctrl.getAllConsultations);
router.patch('/veto/consultations/:id/close', ctrl.closeConsultation);

router.get('/veto/prescriptions', ctrl.getAllPrescriptions);

router.get('/veto/appointments', ctrl.getAllAppointments);
router.patch('/veto/appointments/:id/status', ctrl.updateAppointmentStatus);

router.get('/veto/sanitary-alerts', ctrl.getSanitaryAlerts);
router.patch('/veto/sanitary-alerts/:id/verify', ctrl.verifySanitaryAlert);
router.delete('/veto/sanitary-alerts/:id', ctrl.deleteSanitaryAlert);

// ─── MokineBox ─────────────────────────────────────────────────────────────────
router.get('/box/stats', ctrl.getBoxStats);
router.get('/box/devices', ctrl.getIotDevices);
router.put('/box/devices/:id', ctrl.updateIotDevice);
router.delete('/box/devices/:id', ctrl.deleteIotDevice);
router.get('/box/alerts', ctrl.getIotAlerts);
router.get('/box/readings', ctrl.getSensorReadings);

// ─── MokineMarket ──────────────────────────────────────────────────────────────
router.get('/market/products', ctrl.getMarketProducts);
router.post('/market/products', ctrl.createMarketProduct);
router.put('/market/products/:id', ctrl.updateMarketProduct);
router.delete('/market/products/:id', ctrl.deleteMarketProduct);

router.get('/market/orders', ctrl.getOrders);
router.patch('/market/orders/:id/status', ctrl.updateOrderStatus);

router.get('/market/vendors', ctrl.getVendors);

router.get('/market/kyc', ctrl.getKycRequests);
router.patch('/market/kyc/:id/approve', ctrl.approveKyc);
router.patch('/market/kyc/:id/reject', ctrl.rejectKyc);

// ─── MokineLab ─────────────────────────────────────────────────────────────────
router.get('/lab/stats', ctrl.getLabStats);
router.get('/lab/contributions', ctrl.getContributions);
router.patch('/lab/contributions/:id/approve', ctrl.approveContribution);
router.patch('/lab/contributions/:id/reject', ctrl.rejectContribution);

// Plans API
router.get('/lab/plans', ctrl.getAdminApiPlans);
router.post('/lab/plans', ctrl.createApiPlan);
router.put('/lab/plans/:id', ctrl.updateApiPlan);
router.patch('/lab/plans/:id/toggle', ctrl.toggleApiPlan);
router.delete('/lab/plans/:id', ctrl.deleteApiPlan);
router.get('/lab/subscriptions', ctrl.getApiSubscriptions);

// ─── MokineField ───────────────────────────────────────────────────────────────
router.get('/field/farms', ctrl.getAllFarms);
router.get('/field/members', ctrl.getFarmMembers);
router.get('/field/activity', ctrl.getFarmActivity);

// ─── System ────────────────────────────────────────────────────────────────────
router.get('/system/users', ctrl.getUsers);
router.post('/system/users', ctrl.createUser);
router.put('/system/users/:id', ctrl.updateUser);
router.patch('/system/users/:id/toggle-block', ctrl.toggleUserBlock);
router.delete('/system/users/:id', ctrl.deleteUser);

router.get('/system/payments', ctrl.getPayments);
router.post('/system/payments/refund', ctrl.processRefund);

router.get('/system/notifications', ctrl.getAllNotifications);
router.post('/system/notifications/broadcast', ctrl.broadcastNotification);

router.get('/system/settings', ctrl.getSettings);
router.put('/system/settings', ctrl.updateSettings);
router.get('/system/database/backups', ctrl.getDatabaseBackups);
router.post('/system/database/reset', ctrl.resetDatabase);
router.post('/system/database/restore/:snapshotId', ctrl.restoreDatabase);
router.get('/system/database/analytics', ctrl.getDatabaseResetAnalytics);

// ─── Legacy routes (backward compat) ──────────────────────────────────────────
router.get('/users', ctrl.getUsers);
router.post('/users/toggle-block', ctrl.toggleUserBlock);
router.delete('/users/:id', ctrl.deleteUser);
router.get('/veterinarians', ctrl.getVets);
router.put('/veterinarians/:id', ctrl.updateVet);
router.get('/payments', ctrl.getPayments);
router.post('/payments/refund', ctrl.processRefund);
router.get('/products', ctrl.getMarketProducts);
router.post('/products', ctrl.createMarketProduct);
router.put('/products/:id', ctrl.updateMarketProduct);
router.delete('/products/:id', ctrl.deleteMarketProduct);
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

export default router;
