import express from 'express';
import * as authController from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  validate,
  loginRules,
  registerRules,
  forgotPasswordRules,
  resetPasswordRules,
} from '../middleware/validation.js';
import { passwordResetLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);
router.post('/logout', authController.logout);
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.get('/vets', authController.getAvailableVets);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordRules, validate, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordRules, validate, authController.resetPassword);

export default router;
