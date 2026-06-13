import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';

// Intervalle de simulation de progression (en ms)
const TRAINING_INTERVAL_MS = 2000;
const TRAINING_STEP = 5; // +5% par tick

// Map des intervalles actifs (jobId → intervalHandle) pour éviter les fuites mémoire
const activeJobs = new Map();

// ─── POST /api/lab/models ─────────────────────────────────────────────────────
export const createModel = async (req, res) => {
  try {
    const { name, description, targetSpecies, targetConditions, hyperparams, architecture } = req.body;

    if (!name || !targetSpecies) {
      return res.status(400).json({ error: 'Nom et espèce cible requis' });
    }

    const model = {
      id: uuidv4(),
      ownerId: req.labUser.id,
      ownerName: req.labUser.name,
      name,
      description: description || '',
      targetSpecies,
      targetConditions: targetConditions || [],
      hyperparams: {
        epochs:    hyperparams?.epochs    || 50,
        batchSize: hyperparams?.batchSize || 32,
        lr:        hyperparams?.lr        || 0.001,
      },
      architecture: architecture || 'MobileNetV2',
      status: 'draft',
      version: '0.1',
      trainingProgress: 0,
      endpoint: null,
      deployedToVeto: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.lab_models.insert(model);
    res.status(201).json({ message: 'Modèle créé', model });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET /api/lab/models ──────────────────────────────────────────────────────
export const getMyModels = async (req, res) => {
  try {
    const models = await db.lab_models.filter(m => m.ownerId === req.labUser.id);
    res.json({ models });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── POST /api/lab/models/:id/train ──────────────────────────────────────────
export const startTraining = async (req, res) => {
  try {
    const { id } = req.params;
    const models = await db.lab_models.filter(m => m.id === id && m.ownerId === req.labUser.id);
    if (!models.length) return res.status(404).json({ error: 'Modèle introuvable' });

    const model = models[0];
    if (model.status === 'training') {
      return res.status(409).json({ error: 'Entraînement déjà en cours' });
    }

    const jobId = uuidv4();
    await db.lab_models.update(id, {
      status: 'training',
      trainingProgress: 0,
      updatedAt: new Date().toISOString(),
    });

    // Insérer un job dans la collection training_jobs
    await db.lab_training_jobs.insert({
      id: jobId,
      modelId: id,
      ownerId: req.labUser.id,
      status: 'running',
      startedAt: new Date().toISOString(),
    });

    // Simulation de progression asynchrone
    const interval = setInterval(async () => {
      try {
        const current = await db.lab_models.filter(m => m.id === id);
        if (!current.length) { clearInterval(interval); activeJobs.delete(jobId); return; }

        const prog = current[0].trainingProgress || 0;
        const newProg = Math.min(100, prog + TRAINING_STEP);

        if (newProg >= 100) {
          await db.lab_models.update(id, {
            status: 'ready',
            trainingProgress: 100,
            version: '1.0',
            updatedAt: new Date().toISOString(),
          });
          await db.lab_training_jobs.update(jobId, {
            status: 'completed',
            completedAt: new Date().toISOString(),
          });
          clearInterval(interval);
          activeJobs.delete(jobId);
        } else {
          await db.lab_models.update(id, {
            trainingProgress: newProg,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch { clearInterval(interval); activeJobs.delete(jobId); }
    }, TRAINING_INTERVAL_MS);

    activeJobs.set(jobId, interval);

    res.json({ message: 'Entraînement démarré', jobId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET /api/lab/models/:id/status ──────────────────────────────────────────
export const getTrainingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const models = await db.lab_models.filter(m => m.id === id && m.ownerId === req.labUser.id);
    if (!models.length) return res.status(404).json({ error: 'Modèle introuvable' });

    const { status, trainingProgress, version } = models[0];
    res.json({ status, trainingProgress, version });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── PATCH /api/lab/models/:id/deploy ────────────────────────────────────────
export const deployModel = async (req, res) => {
  try {
    const { id } = req.params;
    const models = await db.lab_models.filter(m => m.id === id && m.ownerId === req.labUser.id);
    if (!models.length) return res.status(404).json({ error: 'Modèle introuvable' });

    const model = models[0];
    if (model.status !== 'ready') {
      return res.status(409).json({ error: 'Le modèle doit être en statut "ready" pour être déployé' });
    }

    const endpoint = `/api/lab/models/${id}/infer`;
    await db.lab_models.update(id, {
      status: 'deployed',
      endpoint,
      updatedAt: new Date().toISOString(),
    });

    // Créer automatiquement une clé API associée
    const { v4: uuid } = await import('uuid');
    const rawKey = 'mlk_' + [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const apiKey = {
      id: uuid(),
      ownerId: req.labUser.id,
      modelId: id,
      key: rawKey,
      maskedKey: rawKey.slice(-8),
      name: `Clé auto — ${model.name}`,
      requestCount: 0,
      dailyUsage: [],
      createdAt: new Date().toISOString(),
    };
    await db.lab_api_keys.insert(apiKey);

    res.json({
      message: 'Modèle déployé',
      endpoint,
      apiKey: { id: apiKey.id, maskedKey: apiKey.maskedKey, key: rawKey },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── PATCH /api/lab/models/:id/submit-to-veto ────────────────────────────────
export const submitToVeto = async (req, res) => {
  try {
    const { id } = req.params;
    const models = await db.lab_models.filter(m => m.id === id && m.ownerId === req.labUser.id);
    if (!models.length) return res.status(404).json({ error: 'Modèle introuvable' });

    if (models[0].status !== 'deployed') {
      return res.status(409).json({ error: 'Le modèle doit être déployé avant soumission à MokineVeto' });
    }

    await db.lab_models.update(id, {
      deployedToVeto: 'pending',
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: 'Modèle soumis à MokineVeto — en attente de validation admin' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET /api/lab/models/all (admin uniquement) ───────────────────────────────
export const getAllModels = async (req, res) => {
  try {
    const { status, deployedToVeto } = req.query;
    let models = await db.lab_models.filter(() => true);

    if (status) models = models.filter(m => m.status === status);
    if (deployedToVeto) models = models.filter(m => String(m.deployedToVeto) === deployedToVeto);

    res.json({ models, total: models.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── PATCH /api/lab/models/:id/activate-veto (admin uniquement) ──────────────
export const activateForVeto = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'activate' | 'deactivate'

    const models = await db.lab_models.filter(m => m.id === id);
    if (!models.length) return res.status(404).json({ error: 'Modèle introuvable' });

    const newStatus = action === 'deactivate' ? 'inactive' : 'active';
    await db.lab_models.update(id, {
      deployedToVeto: newStatus,
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: `Modèle ${newStatus === 'active' ? 'activé' : 'désactivé'} dans MokineVeto` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
