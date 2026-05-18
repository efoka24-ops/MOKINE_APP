import express from 'express';
import { verifyToken as authenticate } from '../middleware/authMiddleware.js';
import {
  getAgents,
  createAgent,
  updateAgentLocation,
  getAgentLocation,
  syncAgentData,
  deleteAgent,
} from '../controllers/agentController.js';

const router = express.Router();

router.get('/', authenticate, getAgents);
router.post('/', authenticate, createAgent);
router.patch('/:agentId/location', authenticate, updateAgentLocation);
router.get('/:agentId/location', authenticate, getAgentLocation);
router.patch('/:agentId/sync', authenticate, syncAgentData);
router.delete('/:agentId', authenticate, deleteAgent);

export default router;
