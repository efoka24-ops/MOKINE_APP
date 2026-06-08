import db from '../db/index.js';

// Helper: transform settings array to key→value map
const toMap = (rows) => Object.fromEntries(rows.map(r => [r.key, r.value]));

// GET /api/settings  — public, returns business config as a flat key/value map
export const getPublicSettings = async (req, res) => {
  try {
    const rows = await db.settings.all();
    res.json(toMap(rows));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /api/settings/all  — admin only, returns full rows
export const getAllSettings = async (req, res) => {
  try {
    const rows = await db.settings.all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// PUT /api/settings/:key  — admin only
export const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'value requis' });
    const row = await db.settings.findOne(s => s.key === key);
    if (!row) return res.status(404).json({ error: `Paramètre '${key}' introuvable` });
    const updated = await db.settings.update(row.id, { value, updatedAt: new Date().toISOString() });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /api/subscription-plans  — public
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = (await db.subscription_plans.all()).filter(p => p.isActive);
    plans.sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(plans);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /api/subscription-plans/:slug  — public
export const getSubscriptionPlanBySlug = async (req, res) => {
  try {
    const plan = await db.subscription_plans.findOne(p => p.slug === req.params.slug && p.isActive);
    if (!plan) return res.status(404).json({ error: 'Plan introuvable' });
    res.json(plan);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
