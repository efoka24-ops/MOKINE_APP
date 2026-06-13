import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY = '#178A3B';

const STATUS_CONFIG = {
  pending:  { label: 'En attente',  color: 'bg-yellow-100 text-yellow-700' },
  active:   { label: 'Actif',       color: 'bg-green-100 text-green-700'  },
  inactive: { label: 'Inactif',     color: 'bg-gray-100 text-gray-500'    },
};

export default function LabModelIntegration() {
  const { token, user } = useLabAuth();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch('/api/lab/models/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const submitted = (data.models || []).filter(m =>
          m.deployedToVeto === 'pending' || m.deployedToVeto === 'active' || m.deployedToVeto === 'inactive'
        );
        setModels(submitted);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const toggleActivation = async (model) => {
    const action = model.deployedToVeto === 'active' ? 'inactive' : 'active';
    setProcessing(p => ({ ...p, [model.id]: true }));
    try {
      const res = await fetch(`/api/lab/models/${model.id}/activate-veto`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchModels();
    } catch {}
    setProcessing(p => ({ ...p, [model.id]: false }));
  };

  if (user?.role !== 'lab_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-gray-600 font-medium">Accès réservé à l'Admin MokineLab</p>
          <Link to="/mokinelab/dashboard" className="mt-4 inline-block text-sm font-semibold" style={{ color: PRIMARY }}>
            ← Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <Link to="/mokinelab/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
        <span className="text-gray-300">|</span>
        <h1 className="font-bold text-gray-800">Intégration MokineVeto</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Modèles soumis à MokineVeto :</strong> Activez un modèle pour qu'il soit disponible dans le pré-diagnostic de MokineVeto. Les modèles actifs remplacent ou complètent le moteur Tebe selon le contexte.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : models.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-3">🧬</div>
            <p className="text-gray-500 font-medium">Aucun modèle soumis à MokineVeto</p>
            <p className="text-gray-400 text-sm mt-1">Les développeurs peuvent soumettre leurs modèles déployés depuis leur espace.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {models.map(model => {
              const status = STATUS_CONFIG[model.deployedToVeto] || STATUS_CONFIG.pending;
              return (
                <div key={model.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">{model.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      {model.description && (
                        <p className="text-sm text-gray-500 mb-3">{model.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {model.targetSpecies && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                            🐄 {model.targetSpecies}
                          </span>
                        )}
                        {model.architecture && (
                          <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-lg">
                            🏗️ {model.architecture}
                          </span>
                        )}
                        {model.version && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                            v{model.version}
                          </span>
                        )}
                        {model.targetConditions?.length > 0 && model.targetConditions.map(c => (
                          <span key={c} className="bg-green-50 text-green-700 px-2 py-1 rounded-lg">{c}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {model.deployedToVeto === 'pending' ? (
                        <button
                          onClick={() => toggleActivation(model)}
                          disabled={processing[model.id]}
                          className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
                          style={{ background: PRIMARY }}>
                          {processing[model.id] ? '...' : '✅ Activer'}
                        </button>
                      ) : model.deployedToVeto === 'active' ? (
                        <button
                          onClick={() => toggleActivation(model)}
                          disabled={processing[model.id]}
                          className="text-sm font-semibold px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50">
                          {processing[model.id] ? '...' : '⏸️ Désactiver'}
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleActivation(model)}
                          disabled={processing[model.id]}
                          className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
                          style={{ background: PRIMARY }}>
                          {processing[model.id] ? '...' : '▶️ Réactiver'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
