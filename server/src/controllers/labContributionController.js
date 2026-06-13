import db from '../db/index.js';

const VALID_SPECIES = ['cattle', 'goat', 'sheep', 'pig', 'poultry', 'other'];
const VALID_PATHOLOGIES = [
  'Dermatophilose',
  'Pasteurellose',
  'Fièvre aphteuse',
  'PPCB',
  'Newcastle',
  'Charbon bactéridien',
  'Trypanosomose',
];

// ── POST /api/lab/contributions ───────────────────────────────────────────────
export const create = async (req, res) => {
  try {
    const { photo, species, pathology, vetValidated, notes } = req.body;

    if (!species || !pathology) {
      return res.status(400).json({ error: "L'espèce et la pathologie sont obligatoires." });
    }
    if (!VALID_SPECIES.includes(species)) {
      return res.status(400).json({ error: 'Espèce animale invalide.' });
    }
    if (!VALID_PATHOLOGIES.includes(pathology)) {
      return res.status(400).json({ error: 'Pathologie invalide.' });
    }

    const contribution = {
      id: `contrib_${Date.now()}`,
      contributorId: req.labUser.id,
      contributorName: req.labUser.name || req.labUser.email,
      photo: photo || null,
      species,
      pathology,
      vetValidated: !!vetValidated,
      trainingValue: vetValidated ? 2 : 1,
      notes: notes || '',
      status: 'pending',
      validatedBy: null,
      validatorNote: '',
      validatedAt: null,
      createdAt: new Date().toISOString(),
    };

    await db.lab_contributions.insert(contribution);

    res.status(201).json({
      message: 'Contribution soumise avec succès.',
      contribution,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/lab/contributions ────────────────────────────────────────────────
export const getMyContributions = async (req, res) => {
  try {
    const all = await db.lab_contributions.filter(
      c => c.contributorId === req.labUser.id
    );
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ contributions: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/lab/contributions/pending ───────────────────────────────────────
export const getPending = async (req, res) => {
  try {
    const pending = await db.lab_contributions.filter(
      c => c.status === 'pending' && c.contributorId !== req.labUser.id
    );
    pending.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json({ contributions: pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PATCH /api/lab/contributions/:id/validate ─────────────────────────────────
export const validate = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body;

    if (!['validated', 'rejected'].includes(action)) {
      return res.status(400).json({ error: "L'action doit être 'validated' ou 'rejected'." });
    }

    const contribution = await db.lab_contributions.findById(id);
    if (!contribution) {
      return res.status(404).json({ error: 'Contribution introuvable.' });
    }
    if (contribution.status !== 'pending') {
      return res.status(409).json({ error: 'Cette contribution a déjà été traitée.' });
    }

    const isVet = req.labUser.role === 'veterinarian';

    const updates = {
      status: action,
      validatedBy: req.labUser.id,
      validatorNote: note || '',
      validatedAt: new Date().toISOString(),
    };

    if (action === 'validated' && isVet) {
      updates.vetValidated = true;
      updates.trainingValue = 2;
    }

    await db.lab_contributions.update(id, updates);
    const updated = await db.lab_contributions.findById(id);

    res.json({
      message: action === 'validated' ? 'Contribution validée avec succès.' : 'Contribution rejetée.',
      contribution: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
