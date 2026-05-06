import express from 'express';
import * as userController from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', verifyToken, userController.getUserProfile);
router.put('/profile', verifyToken, userController.updateUserProfile);
router.get('/subscription', verifyToken, userController.getSubscription);
router.put('/settings', verifyToken, userController.updateSettings);

export default router;
