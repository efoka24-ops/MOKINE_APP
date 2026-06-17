import { Router } from 'express';
import { verifyLabToken } from '../middleware/labAuthMiddleware.js';
import { createScan, getMyScans, classifyOnly, archiveRejection } from '../controllers/labScanController.js';

const router = Router();

router.use(verifyLabToken);
router.post('/classify', classifyOnly);
router.post('/archive-rejection', archiveRejection);
router.post('/', createScan);
router.get('/', getMyScans);

export default router;
