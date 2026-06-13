import express from 'express';
import {
  getMembers,
  blockMember,
  getDatasetRequests,
  processDatasetRequest,
  getAllContributions,
  getStats,
  getTrainingJobs,
} from '../controllers/labAdminController.js';
import { verifyLabToken, requireLabRole } from '../middleware/labAuthMiddleware.js';

const router = express.Router();

router.use(verifyLabToken);
router.use(requireLabRole('lab_admin'));

router.get('/members',                       getMembers);
router.patch('/members/:id/block',           blockMember);
router.get('/dataset-requests',              getDatasetRequests);
router.patch('/dataset-requests/:id',        processDatasetRequest);
router.get('/contributions',                 getAllContributions);
router.get('/stats',                         getStats);
router.get('/jobs',                          getTrainingJobs);

export default router;
