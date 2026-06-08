import express from 'express';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';
import {
  getPublicSettings, getAllSettings, updateSetting,
  getSubscriptionPlans, getSubscriptionPlanBySlug,
} from '../controllers/settingsController.js';

const router = express.Router();

// ── Business settings ─────────────────────────────────────────────────────────
router.get('/settings',       getPublicSettings);                          // public
router.get('/settings/all',   verifyToken, requireAdmin, getAllSettings);  // admin
router.put('/settings/:key',  verifyToken, requireAdmin, updateSetting);   // admin

// ── Subscription plans ────────────────────────────────────────────────────────
router.get('/subscription-plans',       getSubscriptionPlans);             // public
router.get('/subscription-plans/:slug', getSubscriptionPlanBySlug);        // public

export default router;
