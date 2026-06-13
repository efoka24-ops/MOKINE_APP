import express from 'express';
import * as iaController from '../controllers/iaController.js';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/questionnaire', iaController.getQuestionnaire);
router.get('/history', optionalAuth, iaController.getChatHistory);
router.post('/analyze', optionalAuth, iaController.analyzeAnimalData);
router.post('/diagnose', optionalAuth, iaController.getAIDiagnosis);
router.post('/chat', optionalAuth, iaController.chatDiagnosis);
router.get('/health-report', verifyToken, iaController.getHealthReport);

// Ia.jsx chat page compatibility routes
router.post('/request/send', optionalAuth, iaController.sendRequest);
router.get('/request/:id', optionalAuth, iaController.getRequest);

// MokineLab integration routes
router.get('/active-lab-models', iaController.getActiveLabModels);
router.post('/analyze-with-model', optionalAuth, iaController.analyzeWithModel);

export default router;
