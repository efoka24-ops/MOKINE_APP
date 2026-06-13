import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY = '#178A3B';
const API_BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/lab`
  : 'http://localhost:5000/api/lab';

export default function LabDatasetRequest() {
  const { labUser, authFetch } = useLabAuth();

  const [status, setStatus] = useState(labUser?.datasetAccess || 'none');
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [form, setForm] = useState({ projectDescription: '', usage: '', githubUrl: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'approved') {
      authFetch(`${API_BASE}/models/dataset/info`)
        .then(r => r.json())
        .then(d => setDatasetInfo(d))
        .catch(() => {});
    }
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/models/dataset/request`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la demande');
      setSuccess('Demande envoyée avec succès !');
      setStatus('pending');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/mokinelab/dashboard" className="text-gray-400 hover:text-gray-600">
            &larr; Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="font-bold text-gray-800 text-xl">Accès Dataset</h1>
        </div>

        {/* Statut = approved */}
        {status === 'approved' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-4">
              <span className="text-3xl">✅</span>
              <div>
                <h2 className="font-bold text-green-800 text-lg">Accès accordé !</h2>
                <p className="text-green-700 text-sm mt-1">
                  Vous avez accès au dataset Tebe — images vétérinaires annotées pour l'Afrique subsaharienne.
                </p>
              </div>
            </div>

            {datasetInfo && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Statistiques du dataset</h3>
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <StatBox value={datasetInfo.totalImages} label="Images totales" />
                  <StatBox value={datasetInfo.splitTrain} label="Entraînement" />
                  <StatBox value={datasetInfo.splitTest} label="Test" />
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  Format : {datasetInfo.format} — Dernière mise à jour : {datasetInfo.lastUpdated}
                </p>

                <h4 className="font-medium text-gray-700 mb-3 text-sm">Répartition par pathologie</h4>
                <div className="space-y-2">
                  {(datasetInfo.byCondition || []).map(c => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-52 truncate">{c.name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.round((c.count / datasetInfo.totalImages) * 100)}%`,
                            backgroundColor: PRIMARY,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-8 text-right">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statut = pending */}
        {status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <span className="text-4xl mb-3 block">⏳</span>
            <h2 className="font-bold text-yellow-800 text-lg">Demande en cours d'examen</h2>
            <p className="text-yellow-700 text-sm mt-2">
              Votre demande d'accès au dataset est en cours de traitement par l'équipe MokineLab.
              Vous serez notifié par email dès qu'une décision sera prise.
            </p>
          </div>
        )}

        {/* Statut = rejected */}
        {status === 'rejected' && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <span className="text-3xl block mb-2">❌</span>
              <h2 className="font-bold text-red-800 text-lg">Demande refusée</h2>
              <p className="text-red-700 text-sm mt-1">
                Votre demande a été refusée. Vous pouvez soumettre une nouvelle demande en fournissant
                plus de détails sur votre projet.
              </p>
            </div>
            {/* Formulaire disponible pour re-demander */}
            <RequestForm
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
              success={success}
            />
          </div>
        )}

        {/* Statut = none */}
        {(status === 'none' || !status) && !success && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h2 className="font-bold text-blue-800 text-lg mb-1">Demander l'accès au dataset Tebe</h2>
              <p className="text-blue-700 text-sm">
                Le dataset Tebe contient 847 images annotées de pathologies vétérinaires pour 7 maladies
                prioritaires en Afrique subsaharienne. Remplissez le formulaire ci-dessous pour demander l'accès.
              </p>
            </div>
            <RequestForm
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
              success={success}
            />
          </div>
        )}

        {success && status === 'pending' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <span className="text-3xl block mb-2">🎉</span>
            <p className="font-semibold text-green-800">{success}</p>
            <p className="text-green-700 text-sm mt-1">Votre demande est en attente de validation.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestForm({ form, setForm, onSubmit, loading, error, success }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Formulaire de demande</h3>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description du projet <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={form.projectDescription}
            onChange={e => setForm(f => ({ ...f, projectDescription: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B] resize-none"
            placeholder="Décrivez votre projet de recherche ou d'application..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usage prévu des données <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={form.usage}
            onChange={e => setForm(f => ({ ...f, usage: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B] resize-none"
            placeholder="Entraînement de modèle, recherche académique, application commerciale..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lien GitHub ou site web (optionnel)
          </label>
          <input
            type="url"
            value={form.githubUrl}
            onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]"
            placeholder="https://github.com/..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-all"
          style={{ backgroundColor: '#178A3B', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
        </button>
      </form>
    </div>
  );
}

function StatBox({ value, label }) {
  return (
    <div className="text-center p-3 bg-green-50 rounded-xl">
      <div className="text-xl font-bold text-[#178A3B]">{value}</div>
      <div className="text-xs text-gray-600 mt-0.5">{label}</div>
    </div>
  );
}
