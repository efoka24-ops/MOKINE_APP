import express from 'express';
import * as iaController from '../controllers/iaController.js';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/analyze', optionalAuth, iaController.analyzeAnimalData);
router.post('/diagnose', optionalAuth, iaController.getAIDiagnosis);
router.get('/health-report/:animalId', verifyToken, iaController.getHealthReport);

export default router;
