import express from 'express';
import * as adminController from '../../controllers/admin/adminController.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Protéger toutes les routes admin avec authentification
router.use(verifyToken);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Utilisateurs
router.get('/users', adminController.getUsers);
router.post('/users/toggle-block', adminController.toggleUserBlock);
router.delete('/users/:id', adminController.deleteUser);

// Vétérinaires
router.get('/veterinarians', adminController.getVeterinarians);
router.put('/veterinarians/:id', adminController.updateVeterinarian);

// Paiements
router.get('/payments', adminController.getPayments);
router.post('/payments/refund', adminController.processRefund);

// Produits
router.get('/products', adminController.getProducts);
router.post('/products', adminController.addProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Paramètres
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

export default router;
