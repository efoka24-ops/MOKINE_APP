import express from 'express';
import { register, login, getMe } from '../controllers/labAuthController.js';
import { verifyLabToken } from '../middleware/labAuthMiddleware.js';

const router = express.Router();

// ── Auth (public) ─────────────────────────────────────────────────────────────
router.post('/auth/register', register);
router.post('/auth/login',    login);
router.get('/auth/me',        verifyLabToken, getMe);

export default router;
