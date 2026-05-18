import db from '../db/index.js';

/**
 * FieldActivityController - Journal d'activité terrain
 * Suivi en temps réel de toutes les actions des agents
 */

// GET /api/field-activity — activité terrain des fermes
export const getFieldActivity = async (req, res) => {
  try {
    const { farmId, agentId, type, limit = 100 } = req.query;
    const userId = req.user.id;

    // Vérifier propriété
    if (farmId) {
      const farm = await db.farms.findOne(f => f.id === farmId && f.ownerId === userId);
      if (!farm) return res.status(403).json({ error: 'Non autorisé' });
    } else {
      const farms = await db.farms.filter(f => f.ownerId === userId);
      if (farms.length === 0) return res.json({ activities: [] });
    }

    let activities = await (db.field_activities || { find: async () => [] }).find?.() || [];

    if (farmId) activities = activities.filter(a => a.farmId === farmId);
    if (agentId) activities = activities.filter(a => a.agentId === agentId);
    if (type) activities = activities.filter(a => a.type === type);

    // Trier par date décroissante et limiter
    activities = activities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));

    res.json({ activities, total: activities.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/field-activity — enregistrer une activité
export const logActivity = async (req, res) => {
  try {
    const { agentId, farmId, type, data, location } = req.body;

    if (!agentId || !farmId || !type) return res.status(400).json({ error: 'agentId, farmId, type requis' });

    const activity = await (db.field_activities || { insert: async (d) => ({ ...d, id: `activity_${Date.now()}` }) }).insert?.({
      id: `activity_${Date.now()}`,
      agentId,
      farmId,
      type, // location_update, animal_checked, vaccination_given, medicine_administered, inspection_done, etc.
      data: data || {},
      location: location || null,
      createdAt: new Date().toISOString(),
      syncedAt: null,
    }) || { id: `activity_${Date.now()}` };

    res.status(201).json({ message: 'Activité enregistrée', activity });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/field-activity/timeline/:farmId — timeline visuelle
export const getActivityTimeline = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { days = 7 } = req.query;

    const farm = await db.farms.findOne(f => f.id === farmId && f.ownerId === req.user.id);
    if (!farm) return res.status(403).json({ error: 'Non autorisé' });

    const activities = await (db.field_activities || { find: async () => [] }).find?.() || [];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const filtered = activities.filter(a =>
      a.farmId === farmId && new Date(a.createdAt) >= startDate
    );

    // Grouper par jour et type
    const timeline = {};
    filtered.forEach(a => {
      const day = new Date(a.createdAt).toLocaleDateString('fr-FR');
      if (!timeline[day]) timeline[day] = { date: day, activities: [], counts: {} };
      timeline[day].activities.push(a);
      timeline[day].counts[a.type] = (timeline[day].counts[a.type] || 0) + 1;
    });

    const result = Object.values(timeline).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ timeline: result });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/field-activity/agents/:agentId/performance — performance d'un agent
export const getAgentPerformance = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { days = 30 } = req.query;

    const agents = db.agents || {};
    const agent = await agents.findOne?.(a => a.id === agentId);

    if (!agent) return res.status(404).json({ error: 'Agent introuvable' });

    // Vérifier autorisation
    const farm = await db.farms.findOne(f => f.id === agent.farmId && f.ownerId === req.user.id);
    if (!farm) return res.status(403).json({ error: 'Non autorisé' });

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const activities = await (db.field_activities || { find: async () => [] }).find?.() || [];

    const agentActivities = activities.filter(a =>
      a.agentId === agentId && new Date(a.createdAt) >= startDate
    );

    const performance = {
      agentId,
      agentName: agent.name,
      period: `${days} jours`,
      totalActivities: agentActivities.length,
      activitiesByType: {},
      lastActivityAt: null,
      averageActivitiesPerDay: 0,
    };

    agentActivities.forEach(a => {
      performance.activitiesByType[a.type] = (performance.activitiesByType[a.type] || 0) + 1;
    });

    if (agentActivities.length > 0) {
      performance.lastActivityAt = agentActivities[agentActivities.length - 1].createdAt;
      const daysActive = new Set(agentActivities.map(a => new Date(a.createdAt).toLocaleDateString())).size;
      performance.averageActivitiesPerDay = (agentActivities.length / (daysActive || 1)).toFixed(1);
    }

    res.json(performance);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/field-activity/heatmap/:farmId — heatmap des activités
export const getActivityHeatmap = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { days = 7 } = req.query;

    const farm = await db.farms.findOne(f => f.id === farmId && f.ownerId === req.user.id);
    if (!farm) return res.status(403).json({ error: 'Non autorisé' });

    const activities = await (db.field_activities || { find: async () => [] }).find?.() || [];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activitiesWithLocation = activities.filter(a =>
      a.farmId === farmId &&
      a.location &&
      a.location.latitude &&
      a.location.longitude &&
      new Date(a.createdAt) >= startDate
    );

    // Créer des clusters de localisation
    const heatmap = activitiesWithLocation.map(a => ({
      lat: a.location.latitude,
      lng: a.location.longitude,
      type: a.type,
      agentId: a.agentId,
      timestamp: a.createdAt,
    }));

    res.json({ heatmap, count: heatmap.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
