import express from 'express';
import { verifyToken as authenticate } from '../middleware/authMiddleware.js';
import {
  getInterventions,
  getAgentInterventions,
  createIntervention,
  updateIntervention,
  completeIntervention,
  getInterventionStats,
} from '../controllers/interventionController.js';

const router = express.Router();

router.get('/', authenticate, getInterventions);
router.get('/agent/:agentId/assigned', authenticate, getAgentInterventions);
router.post('/', authenticate, createIntervention);
router.patch('/:interventionId', authenticate, updateIntervention);
router.post('/:interventionId/complete', authenticate, completeIntervention);
router.get('/stats/overview', authenticate, getInterventionStats);

export default router;
