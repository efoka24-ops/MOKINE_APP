import express from 'express';
import * as smsAuth from '../controllers/smsAuthController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { validate, sendOtpRules, verifyOtpRules } from '../middleware/validation.js';

const router = express.Router();

router.post('/send-otp', sendOtpRules, validate, smsAuth.sendOTP);
router.post('/verify-otp', verifyOtpRules, validate, smsAuth.verifyOTP);
router.post('/complete-profile', verifyToken, smsAuth.completeProfile);

export default router;
