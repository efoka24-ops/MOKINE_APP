import db from '../db/index.js';

/**
 * AgentController - Gestion des agents terrain (bergers spécialisés)
 * Enregistrement, localisation, tâches et synchronisation
 */

// GET /api/agents — agents assignés à mes fermes
export const getAgents = async (req, res) => {
  try {
    const userId = req.user.id;
    const farms = await db.farms.filter(f => f.ownerId === userId);
    const farmIds = farms.map(f => f.id);
    const agents = await db.agents?.filter(a => farmIds.includes(a.farmId)) || [];
    res.json({ agents });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/agents — créer/ajouter un agent terrain
export const createAgent = async (req, res) => {
  try {
    const { farmId, userId, name, phone, role = 'agent', specialization } = req.body;
    if (!farmId || !userId || !name) return res.status(400).json({ error: 'farmId, userId, name requis' });

    // Vérifier que l'user est propriétaire de la ferme
    const farm = await db.farms.findOne(f => f.id === farmId && f.ownerId === req.user.id);
    if (!farm) return res.status(403).json({ error: 'Non autorisé ou ferme introuvable' });

    const agent = await (db.agents || { insert: async (d) => ({ ...d, id: `agent_${Date.now()}` }) }).insert({
      id: `agent_${Date.now()}`,
      farmId,
      userId,
      name,
      phone,
      role, // agent, berger, vétérinaire_terrain
      specialization: specialization || 'general',
      status: 'active',
      currentLocation: null,
      lastSyncAt: null,
      assignedInterventions: 0,
      completedInterventions: 0,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Agent créé', agent });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/agents/:agentId/location — update GPS de l'agent
export const updateAgentLocation = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { latitude, longitude, accuracy, altitude } = req.body;

    if (!latitude || !longitude) return res.status(400).json({ error: 'latitude et longitude requis' });

    const agents = db.agents || {};
    const agent = await agents.findOne?.(a => a.id === agentId) || { id: agentId };

    const updated = { ...agent, currentLocation: { latitude, longitude, accuracy, altitude, timestamp: new Date().toISOString() } };

    if (agents.updateOne) {
      await agents.updateOne({ id: agentId }, updated);
    }

    res.json({ message: 'Localisation mise à jour', agent: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/agents/:agentId/location — obtenir la position actuelle
export const getAgentLocation = async (req, res) => {
  try {
    const { agentId } = req.params;
    const agents = db.agents || {};
    const agent = await agents.findOne?.(a => a.id === agentId);

    if (!agent) return res.status(404).json({ error: 'Agent introuvable' });

    res.json({
      agentId,
      location: agent.currentLocation || { latitude: null, longitude: null },
      lastUpdate: agent.currentLocation?.timestamp || null,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/agents/:agentId/sync — sync hors-ligne
export const syncAgentData = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { locations, completedInterventions, activities, lastSyncAt } = req.body;

    const agents = db.agents || {};
    const agent = await agents.findOne?.(a => a.id === agentId);

    if (!agent) return res.status(404).json({ error: 'Agent introuvable' });

    // Sauvegarder les activités
    if (activities && Array.isArray(activities)) {
      for (const activity of activities) {
        await (db.field_activities || { insert: async (d) => d }).insert({
          id: `activity_${Date.now()}_${Math.random()}`,
          agentId,
          farmId: agent.farmId,
          type: activity.type, // location_update, intervention_completed, etc.
          data: activity.data,
          createdAt: activity.timestamp || new Date().toISOString(),
          syncedAt: new Date().toISOString(),
        });
      }
    }

    // Mettre à jour le dernier sync
    const updated = { ...agent, lastSyncAt: new Date().toISOString() };
    if (agents.updateOne) {
      await agents.updateOne({ id: agentId }, updated);
    }

    res.json({
      message: 'Synchronisation réussie',
      syncedAt: updated.lastSyncAt,
      agent: updated,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// DELETE /api/agents/:agentId — désactiver un agent
export const deleteAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const agents = db.agents || {};

    const agent = await agents.findOne?.(a => a.id === agentId);
    if (!agent) return res.status(404).json({ error: 'Agent introuvable' });

    // Vérifier autorisation
    const farm = await db.farms.findOne(f => f.id === agent.farmId && f.ownerId === req.user.id);
    if (!farm) return res.status(403).json({ error: 'Non autorisé' });

    if (agents.updateOne) {
      await agents.updateOne({ id: agentId }, { ...agent, status: 'inactive' });
    }

    res.json({ message: 'Agent désactivé' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
