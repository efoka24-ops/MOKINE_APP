import express from 'express';
import * as iotController from '../controllers/iotController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { verifyIotApiKey } from '../middleware/iotApiKey.js';
import { validate, iotReadingRules } from '../middleware/validation.js';

const router = express.Router();

router.get('/dashboard', verifyToken, iotController.getIoTDashboard);
router.get('/devices', verifyToken, iotController.getDevices);
router.post('/devices', verifyToken, iotController.registerDevice);
// Firmware endpoint — protected by shared API key instead of user JWT
router.post('/readings', verifyIotApiKey, iotReadingRules, validate, iotController.ingestReading);
router.get('/readings/:animalId', verifyToken, iotController.getAnimalReadings);
router.get('/alerts', verifyToken, iotController.getIoTAlerts);

export default router;
