import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';

// Statistiques fictives du dataset Tebe
const DATASET_STATS = {
  totalImages: 847,
  byCondition: [
    { name: 'Fièvre aphteuse',                count: 142 },
    { name: 'Péripneumonie Contagieuse Bovine', count: 128 },
    { name: 'Dermatose Nodulaire Contagieuse',  count: 115 },
    { name: 'Trypanosomose',                    count: 98  },
    { name: 'Peste des Petits Ruminants (PPR)', count: 134 },
    { name: 'Charbon symptomatique',            count: 87  },
    { name: 'Babésiose / Piroplasmose',         count: 143 },
  ],
  lastUpdated: '2025-12-01',
  format: 'JPEG/PNG 224x224px',
  splitTrain: '80%',
  splitVal: '10%',
  splitTest: '10%',
};

// ─── POST /api/lab/api-keys ───────────────────────────────────────────────────
export const createKey = async (req, res) => {
  try {
    const { name, modelId } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom de la clé requis' });

    // Générer clé format 'mlk_' + 32 chars hex
    const rawKey = 'mlk_' + [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const maskedKey = rawKey.slice(-8);

    const apiKey = {
      id: uuidv4(),
      ownerId: req.labUser.id,
      modelId: modelId || null,
      key: rawKey,
      maskedKey,
      name,
      requestCount: 0,
      dailyUsage: generateDailyUsage(),
      createdAt: new Date().toISOString(),
    };

    await db.lab_api_keys.insert(apiKey);

    res.status(201).json({
      message: 'Clé API créée',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey,         // Affiché une seule fois à la création
        maskedKey,
        modelId: apiKey.modelId,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET /api/lab/api-keys ────────────────────────────────────────────────────
export const getMyKeys = async (req, res) => {
  try {
    const keys = await db.lab_api_keys.filter(k => k.ownerId === req.labUser.id);

    // On masque la clé complète dans le listing
    const sanitized = keys.map(k => ({
      id: k.id,
      name: k.name,
      maskedKey: k.maskedKey,
      modelId: k.modelId,
      requestCount: k.requestCount,
      dailyUsage: k.dailyUsage || [],
      createdAt: k.createdAt,
    }));

    res.json({ keys: sanitized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── DELETE /api/lab/api-keys/:id ────────────────────────────────────────────
export const revokeKey = async (req, res) => {
  try {
    const { id } = req.params;
    const keys = await db.lab_api_keys.filter(k => k.id === id && k.ownerId === req.labUser.id);
    if (!keys.length) return res.status(404).json({ error: 'Clé introuvable' });

    await db.lab_api_keys.remove(id);
    res.json({ message: 'Clé révoquée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET /api/lab/dataset/info ────────────────────────────────────────────────
export const getDatasetInfo = async (req, res) => {
  try {
    const users = await db.lab_users.filter(u => u.id === req.labUser.id);
    if (!users.length || users[0].datasetAccess !== 'approved') {
      return res.status(403).json({ error: 'Accès dataset non approuvé' });
    }
    res.json(DATASET_STATS);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── POST /api/lab/dataset/request ───────────────────────────────────────────
export const requestDatasetAccess = async (req, res) => {
  try {
    const { projectDescription, usage, githubUrl } = req.body;
    if (!projectDescription || !usage) {
      return res.status(400).json({ error: 'Description du projet et usage requis' });
    }

    const users = await db.lab_users.filter(u => u.id === req.labUser.id);
    if (!users.length) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const user = users[0];
    if (user.datasetAccess === 'approved') {
      return res.status(409).json({ error: 'Accès dataset déjà accordé' });
    }
    if (user.datasetAccess === 'pending') {
      return res.status(409).json({ error: 'Demande déjà en attente de validation' });
    }

    const request = {
      id: uuidv4(),
      userId: req.labUser.id,
      userName: req.labUser.name,
      projectDescription,
      usage,
      githubUrl: githubUrl || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await db.lab_dataset_requests.insert(request);
    await db.lab_users.update(req.labUser.id, {
      datasetAccess: 'pending',
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Demande envoyée — en attente de validation admin', requestId: request.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Helper : génère 7 jours de données fictives ─────────────────────────────
function generateDailyUsage() {
  const usage = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    usage.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 80),
    });
  }
  return usage;
}
