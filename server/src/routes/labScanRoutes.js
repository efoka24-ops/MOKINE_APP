import { Router } from 'express';
import { verifyLabToken } from '../middleware/labAuthMiddleware.js';
import { createScan, getMyScans } from '../controllers/labScanController.js';

const router = Router();

router.use(verifyLabToken);
router.post('/', createScan);
router.get('/', getMyScans);

export default router;
