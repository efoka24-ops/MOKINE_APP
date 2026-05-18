import db from '../db/index.js';

/**
 * InterventionController - Gestion des interventions terrain
 * Tâches assignées aux agents, suivi de progression et rapports
 */

// GET /api/interventions — interventions de mes fermes
export const getInterventions = async (req, res) => {
  try {
    const { status, farmId, agentId } = req.query;
    const userId = req.user.id;

    const farms = await db.farms.filter(f => f.ownerId === userId);
    const farmIds = farmId ? [farmId] : farms.map(f => f.id);

    let interventions = await (db.interventions || { find: async () => [] }).find?.() || [];

    // Filtrer par ferme
    interventions = interventions.filter(i => farmIds.includes(i.farmId));

    // Filtrer par agent si spécifié
    if (agentId) {
      interventions = interventions.filter(i => i.assignedAgents?.includes(agentId));
    }

    // Filtrer par status
    if (status) {
      interventions = interventions.filter(i => i.status === status);
    }

    res.json({ interventions, total: interventions.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/interventions/:agentId/assigned — interventions assignées à un agent
export const getAgentInterventions = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { status } = req.query;

    const interventions = await (db.interventions || { find: async () => [] }).find?.() || [];
    let result = interventions.filter(i => i.assignedAgents?.includes(agentId));

    if (status) {
      result = result.filter(i => i.status === status);
    }

    res.json({ interventions: result });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/interventions — créer une nouvelle intervention
export const createIntervention = async (req, res) => {
  try {
    const { farmId, type, title, description, location, priority = 'normal', assignedAgents = [], dueDate } = req.body;

    if (!farmId || !type || !title) return res.status(400).json({ error: 'farmId, type, title requis' });

    // Vérifier propriété de la ferme
    const farm = await db.farms.findOne(f => f.id === farmId && f.ownerId === req.user.id);
    if (!farm) return res.status(403).json({ error: 'Non autorisé ou ferme introuvable' });

    const intervention = await (db.interventions || { insert: async (d) => ({ ...d, id: `int_${Date.now()}` }) }).insert?.({
      id: `int_${Date.now()}`,
      farmId,
      createdBy: req.user.id,
      type, // veterinary_visit, vaccination, treatment, inspection, maintenance, etc.
      title,
      description: description || '',
      location: location || { latitude: null, longitude: null },
      priority, // low, normal, high, urgent
      status: 'pending', // pending, assigned, in_progress, completed, cancelled
      assignedAgents: assignedAgents || [],
      completedBy: null,
      completionDate: null,
      notes: '',
      photos: [],
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours par défaut
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }) || { id: `int_${Date.now()}` };

    res.status(201).json({ message: 'Intervention créée', intervention });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/interventions/:interventionId — update intervention
export const updateIntervention = async (req, res) => {
  try {
    const { interventionId } = req.params;
    const { status, notes, photos, completionDate, location } = req.body;

    const interventions = db.interventions || {};
    const intervention = await interventions.findOne?.(i => i.id === interventionId);

    if (!intervention) return res.status(404).json({ error: 'Intervention introuvable' });

    // Vérifier autorisation
    const farm = await db.farms.findOne(f => f.id === intervention.farmId && f.ownerId === req.user.id);
    if (!farm) return res.status(403).json({ error: 'Non autorisé' });

    const updated = {
      ...intervention,
      status: status || intervention.status,
      notes: notes !== undefined ? notes : intervention.notes,
      photos: photos || intervention.photos,
      location: location || intervention.location,
      completionDate: completionDate || intervention.completionDate,
      updatedAt: new Date().toISOString(),
    };

    if (interventions.updateOne) {
      await interventions.updateOne({ id: interventionId }, updated);
    }

    res.json({ message: 'Intervention mise à jour', intervention: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/interventions/:interventionId/complete — marquer comme complétée
export const completeIntervention = async (req, res) => {
  try {
    const { interventionId } = req.params;
    const { notes, photos, completionNotes } = req.body;

    const interventions = db.interventions || {};
    const intervention = await interventions.findOne?.(i => i.id === interventionId);

    if (!intervention) return res.status(404).json({ error: 'Intervention introuvable' });

    const completed = {
      ...intervention,
      status: 'completed',
      completionDate: new Date().toISOString(),
      completedBy: req.user.id,
      notes: completionNotes || notes || intervention.notes,
      photos: photos || intervention.photos,
      updatedAt: new Date().toISOString(),
    };

    if (interventions.updateOne) {
      await interventions.updateOne({ id: interventionId }, completed);
    }

    // Enregistrer une activité
    await (db.field_activities || { insert: async (d) => d }).insert?.({
      id: `activity_${Date.now()}`,
      agentId: req.user.id,
      farmId: intervention.farmId,
      type: 'intervention_completed',
      data: { interventionId, interventionType: intervention.type },
      createdAt: new Date().toISOString(),
    });

    res.json({ message: 'Intervention complétée', intervention: completed });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/interventions/stats — statistiques des interventions
export const getInterventionStats = async (req, res) => {
  try {
    const { farmId } = req.query;
    const userId = req.user.id;

    const farms = await db.farms.filter(f => f.ownerId === userId);
    const farmIds = farmId ? [farmId] : farms.map(f => f.id);

    const interventions = await (db.interventions || { find: async () => [] }).find?.() || [];
    const filtered = interventions.filter(i => farmIds.includes(i.farmId));

    const stats = {
      total: filtered.length,
      pending: filtered.filter(i => i.status === 'pending').length,
      inProgress: filtered.filter(i => i.status === 'in_progress').length,
      completed: filtered.filter(i => i.status === 'completed').length,
      overdue: filtered.filter(i => new Date(i.dueDate) < new Date() && i.status !== 'completed').length,
      byType: {},
      byPriority: {},
    };

    filtered.forEach(i => {
      stats.byType[i.type] = (stats.byType[i.type] || 0) + 1;
      stats.byPriority[i.priority] = (stats.byPriority[i.priority] || 0) + 1;
    });

    res.json(stats);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
