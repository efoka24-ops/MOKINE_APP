import express from 'express';
import { register, login, getMe } from '../controllers/labAuthController.js';
import { verifyLabToken } from '../middleware/labAuthMiddleware.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// ── Auth — rate limiter uniquement sur register et login ──────────────────────
router.post('/auth/register', authLimiter, register);
router.post('/auth/login',    authLimiter, login);
router.get('/auth/me',        verifyLabToken, getMe);

export default router;
