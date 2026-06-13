import db from '../db/index.js';

// ── GET /api/lab/catalog ──────────────────────────────────────────────────────
export const getCatalog = async (req, res) => {
  try {
    const { category, species, search, isPublic } = req.query;
    let models = await db.lab_catalog_models.filter(() => true);

    if (isPublic !== 'false') models = models.filter(m => m.isPublic);
    if (category) models = models.filter(m => m.category === category);
    if (species)  models = models.filter(m =>
      m.targetSpecies.includes(species) || m.targetSpecies.includes('all')
    );
    if (search) {
      const q = search.toLowerCase();
      models = models.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.shortName.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tags?.some(t => t.toLowerCase().includes(q)) ||
        m.targetConditions?.some(c => c.toLowerCase().includes(q))
      );
    }

    // Résumé stats
    const summary = {
      total: models.length,
      byCategory: models.reduce((acc, m) => {
        acc[m.category] = (acc[m.category] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json({ models, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/lab/catalog/:id ──────────────────────────────────────────────────
export const getCatalogModel = async (req, res) => {
  try {
    const model = await db.lab_catalog_models.findById(req.params.id);
    if (!model) return res.status(404).json({ error: 'Modèle catalogue introuvable.' });
    res.json({ model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/lab/catalog — admin only ───────────────────────────────────────
export const addCatalogModel = async (req, res) => {
  try {
    const {
      slug, name, shortName, architecture, version, category, subcategory,
      description, targetSpecies, targetConditions, animalHumanDiscrimination,
      paper, dataset, metrics, license, framework, checkpointUrl,
      useCases, tags, difficultyLevel, isPublic,
    } = req.body;

    if (!name || !architecture || !category) {
      return res.status(400).json({ error: 'name, architecture et category sont requis.' });
    }

    const model = {
      id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      name,
      shortName: shortName || name,
      architecture,
      version: version || '1.0.0',
      category,
      subcategory: subcategory || category,
      description: description || '',
      targetSpecies: targetSpecies || ['all'],
      targetConditions: targetConditions || [],
      animalHumanDiscrimination: animalHumanDiscrimination || false,
      paper: paper || null,
      dataset: dataset || null,
      metrics: metrics || {},
      license: license || 'MIT',
      framework: framework || 'PyTorch',
      checkpointUrl: checkpointUrl || null,
      useCases: useCases || [],
      tags: tags || [],
      difficultyLevel: difficultyLevel || 'intermediate',
      isPublic: isPublic !== false,
      addedAt: new Date().toISOString(),
      addedBy: req.labUser.id,
      communityForks: 0,
      communityRating: null,
    };

    await db.lab_catalog_models.insert(model);
    res.status(201).json({ message: 'Modèle ajouté au catalogue.', model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PATCH /api/lab/catalog/:id — admin only ───────────────────────────────────
export const updateCatalogModel = async (req, res) => {
  try {
    const { id } = req.params;
    const model = await db.lab_catalog_models.findById(id);
    if (!model) return res.status(404).json({ error: 'Modèle introuvable.' });

    const allowed = [
      'name', 'shortName', 'version', 'description', 'targetSpecies', 'targetConditions',
      'animalHumanDiscrimination', 'paper', 'dataset', 'metrics', 'license', 'framework',
      'checkpointUrl', 'useCases', 'tags', 'difficultyLevel', 'isPublic', 'communityForks',
      'communityRating', 'category', 'subcategory',
    ];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    patch.updatedAt = new Date().toISOString();

    const updated = await db.lab_catalog_models.update(id, patch);
    res.json({ message: 'Modèle catalogue mis à jour.', model: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE /api/lab/catalog/:id — admin only ──────────────────────────────────
export const deleteCatalogModel = async (req, res) => {
  try {
    const { id } = req.params;
    const model = await db.lab_catalog_models.findById(id);
    if (!model) return res.status(404).json({ error: 'Modèle introuvable.' });

    await db.lab_catalog_models.remove(id);
    res.json({ message: 'Modèle supprimé du catalogue.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
