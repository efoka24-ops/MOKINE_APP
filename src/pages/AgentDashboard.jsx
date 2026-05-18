import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, TrendingUp, AlertCircle, Plus, Trash2, MapPinOff } from 'lucide-react';
import { agents } from '../API';
import { useAuth } from '../context/AuthContext';

/**
 * AgentDashboard - Gestion des agents terrain
 * Vue: Ajout d'agents, tracking GPS, statuts
 */
export default function AgentDashboard({ farmId }) {
  const { user } = useAuth();
  const [agentsList, setAgentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', role: 'agent', specialization: 'general' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Charger les agents
  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await agents.getAll();
      setAgentsList(res.data.agents || []);
    } catch (err) {
      console.error('Erreur lors du chargement des agents:', err);
      setError('Impossible de charger les agents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 10000); // Refresh tous les 10 secondes
    return () => clearInterval(interval);
  }, [loadAgents]);

  // Ajouter un agent
  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError('Nom et téléphone requis');
      return;
    }

    try {
      const res = await agents.create({
        farmId,
        userId: user.id,
        ...formData,
      });
      setAgentsList([...agentsList, res.data.agent]);
      setFormData({ name: '', phone: '', role: 'agent', specialization: 'general' });
      setShowAddForm(false);
      setSuccess('Agent ajouté avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout');
    }
  };

  // Supprimer un agent
  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver cet agent ?')) return;
    try {
      await agents.delete(agentId);
      setAgentsList(prev => prev.filter(a => a.id !== agentId));
      setSuccess('Agent désactivé');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la désactivation');
    }
  };

  const ROLE_LABELS = {
    agent: 'Agent Terrain',
    berger: 'Berger',
    veterinaire: 'Vétérinaire Terrain',
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin">⏳</div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={28} className="text-blue-600" />
            Agents Terrain
          </h2>
          <p className="text-sm text-gray-600 mt-1">Gestion des agents et suivi GPS</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus size={18} /> Ajouter Agent
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
      )}

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <form onSubmit={handleAddAgent} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom de l'agent"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="tel"
              placeholder="Numéro téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Spécialisation (ex: vaccins)"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste des agents */}
      {agentsList.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <MapPinOff size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Aucun agent ajouté</p>
          <p className="text-sm text-gray-500 mt-1">Commencez par ajouter des agents terrain</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agentsList.map(agent => (
            <div key={agent.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-xs text-gray-500">{ROLE_LABELS[agent.role] || agent.role}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  agent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {agent.status === 'active' ? '🟢 Actif' : '⚫ Inactif'}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <p className="text-gray-600">📞 {agent.phone}</p>
                {agent.specialization && agent.specialization !== 'general' && (
                  <p className="text-gray-600">🎯 {agent.specialization}</p>
                )}
                {agent.currentLocation && (
                  <p className="text-blue-600 flex items-center gap-1">
                    <MapPin size={14} />
                    {agent.currentLocation.latitude?.toFixed(4)}, {agent.currentLocation.longitude?.toFixed(4)}
                  </p>
                )}
                {agent.lastSyncAt && (
                  <p className="text-gray-500 text-xs">
                    Sync: {new Date(agent.lastSyncAt).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-center text-sm">
                <div className="bg-blue-50 rounded p-2">
                  <p className="font-bold text-blue-700">{agent.assignedInterventions || 0}</p>
                  <p className="text-xs text-gray-600">Assignées</p>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <p className="font-bold text-green-700">{agent.completedInterventions || 0}</p>
                  <p className="text-xs text-gray-600">Complétées</p>
                </div>
              </div>

              <button
                onClick={() => handleDeleteAgent(agent.id)}
                className="w-full px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Désactiver
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
