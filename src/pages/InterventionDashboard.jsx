import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, Plus, Zap, MapPin } from 'lucide-react';
import { interventions } from '../API';
import { useAuth } from '../context/AuthContext';

/**
 * InterventionDashboard - Gestion des interventions terrain
 * Création, assignation et suivi des tâches
 */
export default function InterventionDashboard({ farmId, agents = [] }) {
  const { user } = useAuth();
  const [interventionsList, setInterventionsList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'inspection',
    title: '',
    description: '',
    priority: 'normal',
    assignedAgents: [],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Charger les interventions
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [intRes, statsRes] = await Promise.all([
        interventions.getAll({ farmId, status: filterStatus }),
        interventions.getStats({ farmId }),
      ]);
      setInterventionsList(intRes.data.interventions || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les interventions');
    } finally {
      setLoading(false);
    }
  }, [farmId, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Créer une intervention
  const handleCreateIntervention = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      setError('Titre requis');
      return;
    }

    try {
      const res = await interventions.create({
        farmId,
        ...formData,
      });
      setInterventionsList([res.data.intervention, ...interventionsList]);
      setFormData({
        type: 'inspection',
        title: '',
        description: '',
        priority: 'normal',
        assignedAgents: [],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      setShowAddForm(false);
      setSuccess('Intervention créée');
      setTimeout(() => loadData(), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    }
  };

  // Marquer comme complétée
  const handleCompleteIntervention = async (id) => {
    try {
      const res = await interventions.complete(id, { completionNotes: 'Complétée via dashboard' });
      setInterventionsList(prev =>
        prev.map(i => i.id === id ? res.data.intervention : i)
      );
      setSuccess('Intervention complétée');
      setTimeout(() => loadData(), 1000);
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    }
  };

  const TYPES = {
    inspection: '👁️ Inspection',
    vaccination: '💉 Vaccination',
    treatment: '💊 Traitement',
    maintenance: '🔧 Maintenance',
    intervention: '🚑 Intervention Vétérinaire',
  };

  const PRIORITIES = {
    low: { label: 'Basse', color: 'bg-gray-100 text-gray-700' },
    normal: { label: 'Normale', color: 'bg-blue-100 text-blue-700' },
    high: { label: 'Haute', color: 'bg-orange-100 text-orange-700' },
    urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
  };

  const STATUSES = {
    pending: { label: '⏳ En attente', color: 'bg-gray-50 border-gray-200' },
    assigned: { label: '👤 Assignée', color: 'bg-blue-50 border-blue-200' },
    in_progress: { label: '🔄 En cours', color: 'bg-yellow-50 border-yellow-200' },
    completed: { label: '✅ Complétée', color: 'bg-green-50 border-green-200' },
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin">⏳</div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap size={28} className="text-orange-600" />
            Interventions
          </h2>
          <p className="text-sm text-gray-600 mt-1">Créez et suivez les tâches terrain</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
        >
          <Plus size={18} /> Nouvelle Intervention
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-600 mt-1">Total</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.pending}</p>
            <p className="text-xs text-blue-600 mt-1">En attente</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{stats.inProgress}</p>
            <p className="text-xs text-yellow-600 mt-1">En cours</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
            <p className="text-xs text-red-600 mt-1">En retard</p>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
      )}

      {/* Formulaire */}
      {showAddForm && (
        <form onSubmit={handleCreateIntervention} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {Object.entries(TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Titre de l'intervention"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="col-span-2 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {Object.entries(PRIORITIES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Créer
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

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'assigned', 'in_progress', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
              filterStatus === status
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status ? STATUSES[status]?.label : 'Tous'}
          </button>
        ))}
      </div>

      {/* Liste */}
      {interventionsList.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Clock size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Aucune intervention</p>
          <p className="text-sm text-gray-500 mt-1">Créez une nouvelle intervention pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interventionsList.map(int => (
            <div key={int.id} className={`border rounded-lg p-4 ${STATUSES[int.status]?.color}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{TYPES[int.type]?.split(' ')[0]}</span>
                    <h3 className="font-semibold text-gray-900">{int.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITIES[int.priority]?.color}`}>
                      {PRIORITIES[int.priority]?.label}
                    </span>
                  </div>
                  {int.description && <p className="text-sm text-gray-700">{int.description}</p>}
                </div>
                {int.status !== 'completed' && (
                  <button
                    onClick={() => handleCompleteIntervention(int.id)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-1"
                  >
                    <CheckCircle size={16} /> Complétée
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                <span>📅 {new Date(int.dueDate).toLocaleDateString('fr-FR')}</span>
                {int.assignedAgents?.length > 0 && (
                  <span>👤 {int.assignedAgents.length} agent(s)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
