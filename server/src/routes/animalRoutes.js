import express from 'express';
import * as animalController from '../controllers/animalController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, animalController.getAllAnimals);
router.post('/', verifyToken, animalController.addAnimal);
router.get('/:id', verifyToken, animalController.getAnimalById);
router.put('/:id', verifyToken, animalController.updateAnimal);
router.delete('/:id', verifyToken, animalController.deleteAnimal);

export default router;
