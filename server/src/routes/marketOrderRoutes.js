import express from 'express';
import { verifyToken as authenticate } from '../middleware/authMiddleware.js';
import {
  getMyOrders,
  getOrderById,
  createOrder,
  completePayment,
  updateShipping,
  getOrderStats,
  cancelOrder,
} from '../controllers/marketOrderController.js';

const router = express.Router();

router.get('/', authenticate, getMyOrders);
router.get('/stats', authenticate, getOrderStats);
router.get('/:id', authenticate, getOrderById);
router.post('/', authenticate, createOrder);
router.patch('/:id/payment', authenticate, completePayment);
router.patch('/:id/shipping', authenticate, updateShipping);
router.patch('/:id/cancel', authenticate, cancelOrder);

export default router;
