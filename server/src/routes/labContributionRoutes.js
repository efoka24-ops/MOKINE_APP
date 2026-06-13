import express from 'express';
import {
  create,
  getMyContributions,
  getPending,
  validate,
} from '../controllers/labContributionController.js';
import { verifyLabToken, requireLabRole } from '../middleware/labAuthMiddleware.js';

const router = express.Router();

router.use(verifyLabToken);

router.post('/',                  create);
router.get('/',                   getMyContributions);
router.get('/pending',            requireLabRole('veterinarian', 'lab_admin'), getPending);
router.patch('/:id/validate',     requireLabRole('veterinarian', 'lab_admin'), validate);

export default router;
