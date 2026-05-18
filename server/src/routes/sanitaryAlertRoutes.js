import express from 'express';
import { verifyToken as authenticate } from '../middleware/authMiddleware.js';
import {
  getSanitaryAlerts,
  createSanitaryAlert,
  verifyAlert,
  deleteAlert,
} from '../controllers/sanitaryAlertController.js';

const router = express.Router();

router.get('/', getSanitaryAlerts);                           // public
router.post('/', authenticate, createSanitaryAlert);
router.patch('/:id/verify', authenticate, verifyAlert);
router.delete('/:id', authenticate, deleteAlert);

export default router;
