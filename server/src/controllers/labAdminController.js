import db from '../db/index.js';

// ── GET /api/lab/admin/members ────────────────────────────────────────────────
export const getMembers = async (req, res) => {
  try {
    const users = await db.lab_users.filter(() => true);
    const safe = users.map(({ password: _, ...u }) => u);
    safe.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ members: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PATCH /api/lab/admin/members/:id/block ────────────────────────────────────
export const blockMember = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.lab_users.findById(id);
    if (!user) return res.status(404).json({ error: 'Membre introuvable.' });
    if (user.role === 'lab_admin') {
      return res.status(403).json({ error: 'Impossible de bloquer un admin Lab.' });
    }

    const newBlocked = !user.blocked;
    await db.lab_users.update(id, { blocked: newBlocked });

    res.json({
      message: newBlocked ? 'Membre bloqué.' : 'Membre débloqué.',
      blocked: newBlocked,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/lab/admin/dataset-requests ───────────────────────────────────────
export const getDatasetRequests = async (req, res) => {
  try {
    const requests = await db.lab_dataset_requests.filter(() => true);
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PATCH /api/lab/admin/dataset-requests/:id ─────────────────────────────────
export const processDatasetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body; // action: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: "L'action doit être 'approved' ou 'rejected'." });
    }

    const request = await db.lab_dataset_requests.findById(id);
    if (!request) return res.status(404).json({ error: 'Demande introuvable.' });
    if (request.status !== 'pending') {
      return res.status(409).json({ error: 'Cette demande a déjà été traitée.' });
    }

    await db.lab_dataset_requests.update(id, {
      status: action,
      adminNote: note || '',
      processedAt: new Date().toISOString(),
      processedBy: req.labUser.id,
    });

    // Mettre à jour l'accès dataset du développeur
    if (action === 'approved' && request.devId) {
      await db.lab_users.update(request.devId, { datasetAccess: 'approved' });
    } else if (action === 'rejected' && request.devId) {
      await db.lab_users.update(request.devId, { datasetAccess: 'rejected' });
    }

    const updated = await db.lab_dataset_requests.findById(id);
    res.json({
      message: action === 'approved' ? 'Demande approuvée.' : 'Demande rejetée.',
      request: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/lab/admin/contributions ─────────────────────────────────────────
export const getAllContributions = async (req, res) => {
  try {
    const contributions = await db.lab_contributions.filter(() => true);
    contributions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ contributions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/lab/admin/stats ──────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const [users, contributions, models, scans, jobs] = await Promise.all([
      db.lab_users.filter(() => true),
      db.lab_contributions.filter(() => true),
      db.lab_models.filter(() => true),
      db.lab_scans.filter(() => true),
      db.lab_training_jobs.filter(() => true),
    ]);

    const membersByRole = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    const contribByStatus = contributions.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      stats: {
        totalMembers: users.length,
        membersByRole,
        totalContributions: contributions.length,
        contributionsByStatus: contribByStatus,
        totalModels: models.length,
        totalScans: scans.length,
        totalJobs: jobs.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/lab/admin/jobs ───────────────────────────────────────────────────
export const getTrainingJobs = async (req, res) => {
  try {
    const jobs = await db.lab_training_jobs.filter(() => true);
    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
