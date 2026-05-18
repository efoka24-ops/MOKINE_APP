import express from 'express';
import * as tebeController from '../controllers/tebeController.js';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', tebeController.getPublicStats);
router.post('/analyze-image', optionalAuth, tebeController.analyzeImage);
router.post('/analyze-video', optionalAuth, tebeController.analyzeVideo);
router.get('/conditions', tebeController.getDetectableConditions);
router.post('/contribute', optionalAuth, tebeController.contributeTrainingData);

export default router;
