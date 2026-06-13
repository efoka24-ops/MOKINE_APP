import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY = '#178A3B';
const API_BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/lab`
  : 'http://localhost:5000/api/lab';

const STATUS_META = {
  draft:     { label: 'Brouillon',      color: 'bg-gray-100 text-gray-600' },
  training:  { label: 'En entraînement',color: 'bg-blue-100 text-blue-700' },
  ready:     { label: 'Prêt',           color: 'bg-green-100 text-green-700' },
  deployed:  { label: 'Déployé',        color: 'bg-purple-100 text-purple-700' },
  failed:    { label: 'Échoué',         color: 'bg-red-100 text-red-700' },
};

export default function LabModels() {
  const { authFetch } = useLabAuth();
  const navigate = useNavigate();

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const fetchModels = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/models`);
      const data = await res.json();
      setModels(data.models || []);
    } catch {
      setError('Erreur lors du chargement des modèles');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Polling pour les modèles en entraînement
  useEffect(() => {
    const hasTraining = models.some(m => m.status === 'training');
    if (!hasTraining) return;

    const interval = setInterval(async () => {
      // Mettre à jour seulement les modèles en entraînement
      const updated = await Promise.all(
        models.map(async m => {
          if (m.status !== 'training') return m;
          try {
            const res = await authFetch(`${API_BASE}/models/${m.id}/status`);
            const data = await res.json();
            return { ...m, ...data };
          } catch { return m; }
        })
      );
      setModels(updated);
    }, 3000);

    return () => clearInterval(interval);
  }, [models, authFetch]);

  const handleDeploy = async (id) => {
    setActionLoading(id + '_deploy');
    try {
      const res = await authFetch(`${API_BASE}/models/${id}/deploy`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchModels();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading('');
    }
  };

  const handleSubmitToVeto = async (id) => {
    setActionLoading(id + '_veto');
    try {
      const res = await authFetch(`${API_BASE}/models/${id}/submit-to-veto`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchModels();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/mokinelab/dashboard" className="text-gray-400 hover:text-gray-600">
              &larr; Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="font-bold text-gray-800 text-xl">Mes modèles</h1>
          </div>
          <Link
            to="/mokinelab/dashboard/models/new"
            className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: PRIMARY }}
          >
            + Créer un modèle
          </Link>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        )}

        {!loading && models.length === 0 && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
            <span className="text-5xl mb-4 block">🧠</span>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun modèle</h3>
            <p className="text-sm text-gray-500 mb-5">Créez votre premier modèle IA vétérinaire.</p>
            <Link
              to="/mokinelab/dashboard/models/new"
              className="px-5 py-2.5 text-white text-sm font-semibold rounded-lg"
              style={{ backgroundColor: PRIMARY }}
            >
              + Créer un modèle
            </Link>
          </div>
        )}

        {!loading && models.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Modèle</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Espèce</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Pathologies</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Version</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {models.map(model => (
                  <tr key={model.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">{model.name}</div>
                      <div className="text-xs text-gray-400">{model.architecture}</div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="capitalize">{model.targetSpecies}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-gray-500 text-xs">
                        {model.targetConditions?.length > 0
                          ? model.targetConditions.slice(0, 2).join(', ') + (model.targetConditions.length > 2 ? '...' : '')
                          : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">v{model.version}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_META[model.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_META[model.status]?.label || model.status}
                        </span>
                        {model.status === 'training' && (
                          <div className="mt-2 w-28">
                            <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                              <span>Progression</span>
                              <span>{model.trainingProgress}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{ width: `${model.trainingProgress}%`, backgroundColor: PRIMARY }}
                              />
                            </div>
                          </div>
                        )}
                        {model.status === 'deployed' && model.deployedToVeto && (
                          <div className="mt-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              model.deployedToVeto === 'active'  ? 'bg-green-50 text-green-600' :
                              model.deployedToVeto === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'text-gray-400'
                            }`}>
                              {model.deployedToVeto === 'active'  ? 'Actif dans MokineVeto' :
                               model.deployedToVeto === 'pending' ? 'En attente admin' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        {model.status === 'ready' && (
                          <button
                            onClick={() => handleDeploy(model.id)}
                            disabled={actionLoading === model.id + '_deploy'}
                            className="text-xs px-3 py-1.5 bg-[#178A3B] text-white rounded-lg hover:bg-[#136B2F] disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === model.id + '_deploy' ? '...' : 'Déployer'}
                          </button>
                        )}
                        {model.status === 'deployed' && !model.deployedToVeto && (
                          <button
                            onClick={() => handleSubmitToVeto(model.id)}
                            disabled={actionLoading === model.id + '_veto'}
                            className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === model.id + '_veto' ? '...' : 'Soumettre à MokineVeto'}
                          </button>
                        )}
                        {model.status === 'deployed' && model.endpoint && (
                          <div className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded mt-1 break-all">
                            {model.endpoint}
                          </div>
                        )}
                        {model.status === 'draft' && (
                          <button
                            onClick={() => navigate(`/mokinelab/dashboard/models/new`)}
                            className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Configurer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
