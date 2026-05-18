import express from 'express';
import { verifyToken as authenticate } from '../middleware/authMiddleware.js';
import {
  submitKYC,
  getKYCStatus,
  getPendingKYC,
  approveKYC,
  rejectKYC,
  getKYCStats,
} from '../controllers/marketKYCController.js';

const router = express.Router();

router.post('/submit', authenticate, submitKYC);
router.get('/status', authenticate, getKYCStatus);
router.get('/pending', authenticate, getPendingKYC);
router.get('/stats', authenticate, getKYCStats);
router.patch('/:kycId/approve', authenticate, approveKYC);
router.patch('/:kycId/reject', authenticate, rejectKYC);

export default router;
