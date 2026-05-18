import express from 'express';
import * as marketplaceController from '../controllers/marketplaceController.js';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Products (public browsing)
router.get('/products', optionalAuth, marketplaceController.getAllProducts);
router.get('/products/vendor', verifyToken, marketplaceController.getVendorProducts);
router.get('/products/:id', optionalAuth, marketplaceController.getProductById);
router.post('/products', verifyToken, marketplaceController.createProduct);
router.put('/products/:id', verifyToken, marketplaceController.updateProduct);

// Orders
router.post('/orders', verifyToken, marketplaceController.createOrder);
router.get('/orders', verifyToken, marketplaceController.getOrders);
router.get('/orders/:id', verifyToken, marketplaceController.getOrderById);
router.patch('/orders/:id/confirm-payment', verifyToken, marketplaceController.confirmPayment);

export default router;
