import express from 'express';
import { verifyToken as authenticate } from '../middleware/authMiddleware.js';
import {
  getVendors,
  getVendorById,
  registerVendor,
  getMyVendorProfile,
  updateVendor,
  getPendingVendors,
  approveVendor,
  rejectVendor,
} from '../controllers/marketVendorController.js';

const router = express.Router();

router.get('/', getVendors);
router.get('/pending', authenticate, getPendingVendors);
router.get('/:id', getVendorById);
router.post('/register', authenticate, registerVendor);
router.get('/profile/mine', authenticate, getMyVendorProfile);
router.patch('/:id', authenticate, updateVendor);
router.patch('/:id/approve', authenticate, approveVendor);
router.patch('/:id/reject', authenticate, rejectVendor);

export default router;
