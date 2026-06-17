import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY = '#178A3B';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SPECIES_LABELS = {
  cattle:  { label: 'Bovin',    icon: '🐄' },
  goat:    { label: 'Caprin',   icon: '🐐' },
  sheep:   { label: 'Ovin',     icon: '🐑' },
  pig:     { label: 'Porcin',   icon: '🐖' },
  poultry: { label: 'Volaille', icon: '🐔' },
  other:   { label: 'Autre',    icon: '🐾' },
};

function api(token) {
  return axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  });
}

const SPECIES_ALL = [
  { value: 'cattle',   label: 'Bovin',        icon: '🐄' },
  { value: 'goat',     label: 'Caprin',        icon: '🐐' },
  { value: 'sheep',    label: 'Ovin',          icon: '🐑' },
  { value: 'pig',      label: 'Porcin',        icon: '🐖' },
  { value: 'poultry',  label: 'Volaille',      icon: '🐔' },
  { value: 'horse',    label: 'Équin',         icon: '🐎' },
  { value: 'other',    label: 'Autre animal',  icon: '🐾' },
  { value: 'non_animal', label: 'PAS un animal — rejeter',  icon: '🚫' },
];

const PATHOLOGIES_ALL = [
  'Fièvre aphteuse','Dermatophilose','Pasteurellose','PPCB','Newcastle',
  'Charbon bactéridien','Trypanosomose','Gale / Dermatite','Conjonctivite',
  'Météorisation','Émaciation / Malnutrition','Infection Respiratoire',
  'Animal sain — aucune pathologie visible',
];

function ContributionCard({ contribution, onValidated }) {
  const [note, setNote]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState('');
  const [showAnnotate, setShowAnnotate] = useState(false);
  const [corrSpecies, setCorrSpecies]   = useState(contribution.species || '');
  const [corrPathology, setCorrPathology] = useState(contribution.pathology || '');
  const [annotating, setAnnotating] = useState(false);

  const sp = SPECIES_LABELS[contribution.species] || SPECIES_LABELS.other;
  const firstName = contribution.contributorName?.split(' ')[0] || 'Contributeur';

  const handleAction = async (action) => {
    setLoading(true);
    setMsg('');
    try {
      await api(null).patch(
        `/api/lab/contributions/${contribution.id}/validate`,
        { action, note },
        { headers: { Authorization: `Bearer ${localStorage.getItem('lab_token')}` } }
      );
      setMsg(action === 'validated' ? 'Validée !' : 'Rejetée.');
      setTimeout(() => onValidated(contribution.id), 800);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnotate = async () => {
    if (!corrSpecies || !corrPathology) { setMsg('Espèce et pathologie obligatoires.'); return; }
    setAnnotating(true);
    setMsg('');
    try {
      const isNonAnimal = corrSpecies === 'non_animal';
      await api(null).patch(
        `/api/lab/contributions/${contribution.id}/validate`,
        {
          action: isNonAnimal ? 'rejected' : 'validated',
          note: `[Annotation entraineur] Espèce corrigée: ${corrSpecies}. Pathologie: ${corrPathology}. ${note || ''}`.trim(),
          correctedSpecies: isNonAnimal ? null : corrSpecies,
          correctedPathology: isNonAnimal ? null : corrPathology,
          annotated: true,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('lab_token')}` } }
      );
      setMsg(isNonAnimal ? 'Image rejetée (non-animal).' : 'Annotation sauvegardée et image validée pour le dataset !');
      setTimeout(() => onValidated(contribution.id), 1000);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Erreur annotation.');
    } finally {
      setAnnotating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all">
      <div className="flex gap-4">
        {/* Photo */}
        {contribution.photo ? (
          <img src={contribution.photo} alt="contribution"
            className="w-24 h-24 object-cover rounded-xl flex-shrink-0 border border-gray-200" />
        ) : (
          <div className="w-24 h-24 rounded-xl flex-shrink-0 bg-gray-100 flex flex-col items-center justify-center gap-1">
            <span className="text-3xl">{sp.icon}</span>
            <span className="text-xs text-gray-400">Sans photo</span>
          </div>
        )}

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{contribution.pathology}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-500">{sp.icon} {sp.label}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">Par {firstName}</span>
                {contribution.vetValidated && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                    ✅ Confirmé vétérinaire
                  </span>
                )}
              </div>
            </div>
            {/* Badge valeur d'entraînement */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold"
              style={{ background: '#f0fdf4', color: PRIMARY }}>
              ×{contribution.trainingValue} entraînement
              {contribution.trainingValue >= 2 && (
                <span className="ml-1 bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full text-xs">Vet bonus</span>
              )}
            </div>
          </div>

          {contribution.notes && (
            <p className="text-xs text-gray-500 mt-2 leading-relaxed italic">"{contribution.notes}"</p>
          )}

          <p className="text-xs text-gray-400 mt-1">
            Soumis le {new Date(contribution.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {/* Note du validateur */}
          <div className="mt-3">
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="Note optionnelle pour le contributeur…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          {msg && (
            <p className="text-xs font-medium mt-1 text-green-600">{msg}</p>
          )}

          {/* Actions rapides */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => handleAction('validated')}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all disabled:opacity-60 hover:opacity-90"
              style={{ background: PRIMARY }}>
              ✅ Valider
            </button>
            <button
              onClick={() => handleAction('rejected')}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold transition-all disabled:opacity-60 hover:bg-red-600">
              ❌ Rejeter
            </button>
            <button
              onClick={() => setShowAnnotate(a => !a)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 text-xs font-semibold transition-all hover:bg-purple-200">
              🏷️ Corriger & Annoter
            </button>
          </div>

          {/* Panel d'annotation — pour corriger espèce et pathologie */}
          {showAnnotate && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-purple-800">Correction d'étiquette pour l'entraînement du modèle Tebe</p>
              <p className="text-xs text-purple-600">Indiquez la bonne espèce et la bonne pathologie afin que cette image soit correctement intégrée dans le dataset.</p>

              <div>
                <label className="block text-xs font-semibold text-purple-700 mb-1">Espèce correcte *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SPECIES_ALL.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setCorrSpecies(s.value)}
                      className={`flex flex-col items-center p-2 rounded-xl border-2 text-xs transition-all ${
                        corrSpecies === s.value
                          ? s.value === 'non_animal' ? 'border-red-500 bg-red-50 text-red-700' : 'border-purple-500 bg-purple-100 text-purple-800'
                          : 'border-gray-200 hover:border-purple-300 text-gray-600'
                      }`}
                    >
                      <span className="text-lg">{s.icon}</span>
                      <span className="mt-0.5 leading-tight text-center">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {corrSpecies && corrSpecies !== 'non_animal' && (
                <div>
                  <label className="block text-xs font-semibold text-purple-700 mb-1">Pathologie correcte *</label>
                  <select
                    value={corrPathology}
                    onChange={e => setCorrPathology(e.target.value)}
                    className="w-full border border-purple-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                  >
                    <option value="">— Sélectionner —</option>
                    {PATHOLOGIES_ALL.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}

              {corrSpecies === 'non_animal' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                  Cette image sera <strong>rejetée</strong> du dataset et marquée comme non-animal. Elle ne sera pas utilisée pour l'entraînement.
                </div>
              )}

              {msg && <p className="text-xs font-medium text-purple-700">{msg}</p>}

              <button
                onClick={handleAnnotate}
                disabled={annotating || !corrSpecies || (corrSpecies !== 'non_animal' && !corrPathology)}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {annotating ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enregistrement…</> : '💾 Sauvegarder l\'annotation dans le dataset'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LabValidate() {
  const { token } = useLabAuth();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const r = await api(token).get('/api/lab/contributions/pending');
      setContributions(r.data.contributions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de charger les contributions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleValidated = (id) => {
    setContributions(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4">
        <Link to="/mokinelab/dashboard"
          className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
          &larr; Dashboard
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="font-semibold text-gray-800 text-sm">Validation des contributions</h1>
        {!loading && contributions.length > 0 && (
          <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
            {contributions.length} en attente
          </span>
        )}
      </header>

      <div className="max-w-3xl mx-auto p-6">
        {/* Info badge vétérinaire */}
        <div className="mb-6 flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
          <span className="text-2xl flex-shrink-0">🩺</span>
          <div>
            <p className="font-semibold text-green-800 text-sm">Votre validation vaut ×2</p>
            <p className="text-green-700 text-xs mt-0.5">
              En tant que vétérinaire, votre validation double la valeur d'entraînement de chaque contribution approuvée.
              Cela améliore significativement la qualité du modèle Tebe.
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-10">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={fetchPending}
              className="mt-3 text-sm text-green-600 font-semibold hover:underline">
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && contributions.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-gray-700 font-semibold">Aucune contribution en attente</p>
            <p className="text-gray-400 text-sm mt-1">
              Toutes les contributions ont été traitées. Revenez plus tard.
            </p>
            <Link to="/mokinelab/dashboard/contributions"
              className="mt-4 inline-block text-sm font-semibold px-4 py-2 rounded-xl text-white"
              style={{ background: PRIMARY }}>
              Voir mes contributions
            </Link>
          </div>
        )}

        {!loading && contributions.length > 0 && (
          <div className="space-y-4">
            {contributions.map(c => (
              <ContributionCard key={c.id} contribution={c} onValidated={handleValidated} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
