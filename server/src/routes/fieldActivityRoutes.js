import express from 'express';
import { verifyToken as authenticate } from '../middleware/authMiddleware.js';
import {
  getFieldActivity,
  logActivity,
  getActivityTimeline,
  getAgentPerformance,
  getActivityHeatmap,
} from '../controllers/fieldActivityController.js';

const router = express.Router();

router.get('/', authenticate, getFieldActivity);
router.post('/', authenticate, logActivity);
router.get('/timeline/:farmId', authenticate, getActivityTimeline);
router.get('/agent/:agentId/performance', authenticate, getAgentPerformance);
router.get('/heatmap/:farmId', authenticate, getActivityHeatmap);

export default router;
