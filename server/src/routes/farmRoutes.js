import express from 'express';
import { verifyToken as authenticate } from '../middleware/authMiddleware.js';
import { getFarms, createFarm, getFarmById, inviteMember, joinFarm, removeMember } from '../controllers/farmController.js';

const router = express.Router();

router.get('/', authenticate, getFarms);
router.post('/', authenticate, createFarm);
router.get('/:id', authenticate, getFarmById);
router.post('/:id/invite', authenticate, inviteMember);
router.post('/join/:token', authenticate, joinFarm);
router.delete('/:id/members/:memberId', authenticate, removeMember);

export default router;
