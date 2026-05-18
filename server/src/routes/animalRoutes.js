import express from 'express';
import * as animalController from '../controllers/animalController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Core CRUD
router.get('/',    verifyToken, animalController.getAllAnimals);
router.post('/',   verifyToken, animalController.addAnimal);
router.get('/deceased', verifyToken, animalController.getDeceasedAnimals);
router.get('/alerts',           verifyToken, animalController.getAlerts);
router.patch('/alerts/:id/read', verifyToken, animalController.markAlertRead);
router.get('/treatments/all',   verifyToken, animalController.getAllTreatments);
router.get('/:id',  verifyToken, animalController.getAnimalById);
router.put('/:id',  verifyToken, animalController.updateAnimal);
router.delete('/:id', verifyToken, animalController.deleteAnimal);

// Health records
router.post('/:id/health-records', verifyToken, animalController.addHealthRecord);
router.get('/:id/health-records',  verifyToken, animalController.getHealthRecords);

// Treatments
router.post('/:id/treatments', verifyToken, animalController.addTreatment);
router.get('/:id/treatments',  verifyToken, animalController.getTreatments);

// Reproduction
router.post('/:id/reproduction', verifyToken, animalController.addReproductionRecord);
router.get('/:id/reproduction',  verifyToken, animalController.getReproductionRecords);

// Death declaration
router.post('/:id/declare-death',  verifyToken, animalController.declareDeath);

// Health alert / signalement
router.post('/:id/health-alert', verifyToken, animalController.reportHealthProblem);

export default router;
