import { Router } from 'express';
import { verifyLabToken, requireLabRole } from '../middleware/labAuthMiddleware.js';
import {
  getCatalog,
  getCatalogModel,
  addCatalogModel,
  updateCatalogModel,
  deleteCatalogModel,
} from '../controllers/labCatalogController.js';

const router = Router();

// Lecture accessible à tous les membres Lab authentifiés
router.use(verifyLabToken);

router.get('/',    getCatalog);
router.get('/:id', getCatalogModel);

// Modification réservée à l'admin
router.post('/',    requireLabRole('lab_admin'), addCatalogModel);
router.patch('/:id', requireLabRole('lab_admin'), updateCatalogModel);
router.delete('/:id', requireLabRole('lab_admin'), deleteCatalogModel);

export default router;
