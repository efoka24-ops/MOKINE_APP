import { Router } from 'express';
import { verifyLabToken, requireLabRole } from '../middleware/labAuthMiddleware.js';
import {
  createModel,
  getMyModels,
  startTraining,
  getTrainingStatus,
  deployModel,
  submitToVeto,
  getAllModels,
  activateForVeto,
} from '../controllers/labModelController.js';
import {
  createKey,
  getMyKeys,
  revokeKey,
  getDatasetInfo,
  requestDatasetAccess,
} from '../controllers/labApiKeyController.js';

const router = Router();

// Toutes les routes nécessitent un token lab valide
router.use(verifyLabToken);

// ── Routes Modèles (developer) ────────────────────────────────────────────────
router.post('/', requireLabRole('developer'), createModel);
router.get('/', requireLabRole('developer'), getMyModels);

// IMPORTANT : routes statiques AVANT la route paramétrée :id
router.get('/all', requireLabRole('lab_admin'), getAllModels);

// Routes dataset (developer)
router.get('/dataset/info', requireLabRole('developer'), getDatasetInfo);
router.post('/dataset/request', requireLabRole('developer'), requestDatasetAccess);

// Routes clés API (developer)
router.post('/api-keys', requireLabRole('developer'), createKey);
router.get('/api-keys', requireLabRole('developer'), getMyKeys);
router.delete('/api-keys/:id', requireLabRole('developer'), revokeKey);

// Routes paramétriques (developer)
router.post('/:id/train', requireLabRole('developer'), startTraining);
router.get('/:id/status', requireLabRole('developer'), getTrainingStatus);
router.patch('/:id/deploy', requireLabRole('developer'), deployModel);
router.patch('/:id/submit-to-veto', requireLabRole('developer'), submitToVeto);

// Routes admin
router.patch('/:id/activate-veto', requireLabRole('lab_admin'), activateForVeto);

export default router;
