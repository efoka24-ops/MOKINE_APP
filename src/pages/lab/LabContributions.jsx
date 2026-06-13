import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY = '#178A3B';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SPECIES_OPTIONS = [
  { value: 'cattle',   label: 'Bovin (cattle)',    icon: '🐄' },
  { value: 'goat',     label: 'Caprin (goat)',      icon: '🐐' },
  { value: 'sheep',    label: 'Ovin (sheep)',        icon: '🐑' },
  { value: 'pig',      label: 'Porcin (pig)',        icon: '🐖' },
  { value: 'poultry',  label: 'Volaille (poultry)', icon: '🐔' },
  { value: 'other',    label: 'Autre',              icon: '🐾' },
];

const PATHOLOGIES = [
  'Dermatophilose',
  'Pasteurellose',
  'Fièvre aphteuse',
  'PPCB',
  'Newcastle',
  'Charbon bactéridien',
  'Trypanosomose',
];

const STATUS_BADGE = {
  pending:   { label: 'En attente',  cls: 'bg-yellow-100 text-yellow-700' },
  validated: { label: 'Validée',     cls: 'bg-green-100 text-green-700'  },
  rejected:  { label: 'Rejetée',     cls: 'bg-red-100 text-red-700'      },
};

function api(token) {
  return axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default function LabContributions() {
  const { user, token } = useLabAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    species: '',
    pathology: '',
    vetValidated: false,
    notes: '',
    photo: null,       // base64
    photoName: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg]   = useState({ type: '', text: '' });

  const [contributions, setContributions] = useState([]);
  const [loadingList, setLoadingList]     = useState(true);

  // ── Charger l'historique ─────────────────────────────────────────────────
  const fetchContributions = async () => {
    try {
      const r = await api(token).get('/api/lab/contributions');
      setContributions(r.data.contributions || []);
    } catch {
      setContributions([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchContributions(); }, []);

  // ── Gestion photo ────────────────────────────────────────────────────────
  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, photo: ev.target.result, photoName: file.name }));
    reader.readAsDataURL(file);
  };

  const removePhoto = () => setForm(f => ({ ...f, photo: null, photoName: '' }));

  // ── Soumission ───────────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.species || !form.pathology) {
      setSubmitMsg({ type: 'error', text: "L'espèce et la pathologie sont obligatoires." });
      return;
    }
    setSubmitting(true);
    setSubmitMsg({ type: '', text: '' });
    try {
      await api(token).post('/api/lab/contributions', {
        photo: form.photo,
        species: form.species,
        pathology: form.pathology,
        vetValidated: form.vetValidated,
        notes: form.notes,
      });
      setSubmitMsg({ type: 'success', text: 'Contribution soumise avec succès !' });
      setForm({ species: '', pathology: '', vetValidated: false, notes: '', photo: null, photoName: '' });
      fetchContributions();
    } catch (err) {
      setSubmitMsg({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la soumission.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar simple */}
      <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4">
        <Link to="/mokinelab/dashboard"
          className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
          &larr; Dashboard
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="font-semibold text-gray-800 text-sm">Mes contributions — Dataset Tebe</h1>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">

        {/* ── Formulaire de soumission ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 text-lg mb-1">Soumettre une contribution</h2>
          <p className="text-gray-500 text-sm mb-6">
            Contribuez au dataset Tebe en annotant vos observations cliniques. Chaque contribution enrichit le modèle IA.
          </p>

          {submitMsg.text && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${
              submitMsg.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {submitMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo (optionnelle)
              </label>
              {form.photo ? (
                <div className="relative inline-block">
                  <img src={form.photo} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-gray-200" />
                  <button type="button" onClick={removePhoto}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
                    ×
                  </button>
                  <p className="text-xs text-gray-400 mt-1 max-w-[128px] truncate">{form.photoName}</p>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-green-300 hover:text-green-600 transition-all">
                  📷 Ajouter une photo
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>

            {/* Espèce */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Espèce animale <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SPECIES_OPTIONS.map(s => (
                  <button key={s.value} type="button"
                    onClick={() => setForm(f => ({ ...f, species: s.value }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                      form.species === s.value
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-green-200'
                    }`}>
                    <span>{s.icon}</span>
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pathologie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pathologie observée <span className="text-red-500">*</span>
              </label>
              <select
                value={form.pathology}
                onChange={e => setForm(f => ({ ...f, pathology: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200">
                <option value="">— Sélectionner une pathologie —</option>
                {PATHOLOGIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Diagnostic confirmé */}
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
              <input
                type="checkbox" id="vetValidated"
                checked={form.vetValidated}
                onChange={e => setForm(f => ({ ...f, vetValidated: e.target.checked }))}
                className="mt-0.5 w-4 h-4 accent-green-600"
              />
              <label htmlFor="vetValidated" className="text-sm text-gray-700 cursor-pointer">
                <span className="font-semibold text-green-700">Diagnostic confirmé par un vétérinaire</span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-200 text-green-800 font-bold">×2 valeur</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Si ce diagnostic a été posé ou validé par un vétérinaire, cochez cette case. Votre contribution vaudra 2x plus en valeur d'entraînement.
                </p>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes / observations (optionnel)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                placeholder="Décrivez vos observations cliniques…"
              />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60"
              style={{ background: PRIMARY }}>
              {submitting ? 'Soumission en cours…' : '🤝 Soumettre la contribution'}
            </button>
          </form>
        </div>

        {/* ── Historique ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Mes contributions</h2>

          {loadingList ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🤝</div>
              <p className="text-gray-500 text-sm font-medium">Aucune contribution pour l'instant</p>
              <p className="text-gray-400 text-xs mt-1">Soumettez votre première contribution ci-dessus.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contributions.map(c => {
                const badge = STATUS_BADGE[c.status] || STATUS_BADGE.pending;
                const sp = SPECIES_OPTIONS.find(s => s.value === c.species);
                return (
                  <div key={c.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    {/* Photo miniature */}
                    {c.photo ? (
                      <img src={c.photo} alt="contribution" className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg flex-shrink-0 bg-gray-100 flex items-center justify-center text-2xl">
                        {sp?.icon || '🐾'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-sm">{c.pathology}</span>
                        <span className="text-xs text-gray-400">{sp?.label || c.species}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {c.vetValidated && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">
                            ✅ Vet ×2
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          Valeur: {c.trainingValue}x
                        </span>
                      </div>
                      {c.notes && <p className="text-xs text-gray-400 mt-1 truncate">{c.notes}</p>}
                      {c.validatorNote && (
                        <p className="text-xs text-gray-500 mt-1 italic">Note: {c.validatorNote}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
