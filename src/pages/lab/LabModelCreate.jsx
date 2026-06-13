import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY = '#178A3B';
const API_BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/lab`
  : 'http://localhost:5000/api/lab';

const SPECIES_OPTIONS = [
  { value: 'cattle',   label: 'Bovins (cattle)' },
  { value: 'goat',     label: 'Caprins (goat)' },
  { value: 'sheep',    label: 'Ovins (sheep)' },
  { value: 'pig',      label: 'Porcins (pig)' },
  { value: 'poultry',  label: 'Volaille (poultry)' },
  { value: 'multi',    label: 'Multi-espèces' },
  { value: 'other',    label: 'Autre' },
];

const TEBE_CONDITIONS = [
  'Fièvre aphteuse',
  'Péripneumonie Contagieuse Bovine (PPCB)',
  'Dermatose Nodulaire Contagieuse (DNC)',
  'Trypanosomose (Nagana)',
  'Peste des Petits Ruminants (PPR)',
  'Charbon symptomatique (Blackleg)',
  'Babésiose / Piroplasmose',
];

const ARCHITECTURES = [
  { value: 'MobileNetV2',   label: 'MobileNet v2 (recommandé, léger)' },
  { value: 'ResNet50',      label: 'ResNet50 (haute précision)' },
  { value: 'EfficientNetB0',label: 'EfficientNet-B0 (équilibré)' },
];

const BATCH_SIZES = [16, 32, 64];
const LR_OPTIONS = [
  { value: 0.001,  label: '0.001 (standard)' },
  { value: 0.0001, label: '0.0001 (fin)' },
];

export default function LabModelCreate() {
  const { authFetch } = useLabAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    targetSpecies: 'cattle',
    targetConditions: [],
    architecture: 'MobileNetV2',
    hyperparams: { epochs: 50, batchSize: 32, lr: 0.001 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleCondition = (cond) => {
    setForm(f => ({
      ...f,
      targetConditions: f.targetConditions.includes(cond)
        ? f.targetConditions.filter(c => c !== cond)
        : [...f.targetConditions, cond],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Le nom du modèle est requis'); return; }
    if (form.targetConditions.length === 0) { setError('Sélectionnez au moins une pathologie cible'); return; }

    setLoading(true);
    try {
      // 1. Créer le modèle
      const createRes = await authFetch(`${API_BASE}/models`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Erreur création');

      const modelId = createData.model.id;

      // 2. Lancer l'entraînement
      const trainRes = await authFetch(`${API_BASE}/models/${modelId}/train`, {
        method: 'POST',
      });
      const trainData = await trainRes.json();
      if (!trainRes.ok) throw new Error(trainData.error || 'Erreur démarrage entraînement');

      navigate('/mokinelab/dashboard/models');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setHP = (key, value) => setForm(f => ({ ...f, hyperparams: { ...f.hyperparams, [key]: value } }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/mokinelab/dashboard/models" className="text-gray-400 hover:text-gray-600">
            &larr; Mes modèles
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="font-bold text-gray-800 text-xl">Créer un modèle</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {/* Infos générales */}
          <Section title="Informations générales">
            <Field label="Nom du modèle *">
              <input
                type="text"
                required
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="input"
                placeholder="Mon modèle PPCB Bovins"
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={2}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="input resize-none"
                placeholder="Description du modèle et de son usage..."
              />
            </Field>
          </Section>

          {/* Cible */}
          <Section title="Cible du modèle">
            <Field label="Espèce cible *">
              <select
                value={form.targetSpecies}
                onChange={e => set('targetSpecies', e.target.value)}
                className="input"
              >
                {SPECIES_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Pathologies cibles (Tebe) *">
              <div className="grid grid-cols-1 gap-2 mt-1">
                {TEBE_CONDITIONS.map(cond => (
                  <label key={cond} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ borderColor: form.targetConditions.includes(cond) ? PRIMARY : '#e5e7eb' }}>
                    <input
                      type="checkbox"
                      checked={form.targetConditions.includes(cond)}
                      onChange={() => toggleCondition(cond)}
                      className="w-4 h-4 accent-[#178A3B]"
                    />
                    <span className="text-sm text-gray-700">{cond}</span>
                  </label>
                ))}
              </div>
            </Field>
          </Section>

          {/* Architecture */}
          <Section title="Architecture">
            <div className="grid grid-cols-1 gap-2">
              {ARCHITECTURES.map(a => (
                <label key={a.value} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: form.architecture === a.value ? PRIMARY : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="architecture"
                    value={a.value}
                    checked={form.architecture === a.value}
                    onChange={() => set('architecture', a.value)}
                    className="w-4 h-4 accent-[#178A3B]"
                  />
                  <span className="text-sm text-gray-700">{a.label}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* Hyperparamètres */}
          <Section title="Hyperparamètres">
            <div className="grid grid-cols-3 gap-4">
              <Field label={`Epochs : ${form.hyperparams.epochs}`}>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={form.hyperparams.epochs}
                  onChange={e => setHP('epochs', parseInt(e.target.value))}
                  className="w-full accent-[#178A3B]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>10</span><span>100</span>
                </div>
              </Field>

              <Field label="Batch size">
                <select
                  value={form.hyperparams.batchSize}
                  onChange={e => setHP('batchSize', parseInt(e.target.value))}
                  className="input"
                >
                  {BATCH_SIZES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>

              <Field label="Learning rate">
                <select
                  value={form.hyperparams.lr}
                  onChange={e => setHP('lr', parseFloat(e.target.value))}
                  className="input"
                >
                  {LR_OPTIONS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* Résumé config */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-1">
            <p className="font-semibold mb-2">Résumé de la configuration</p>
            <p>Architecture : <strong>{form.architecture}</strong></p>
            <p>Espèce : <strong>{form.targetSpecies}</strong></p>
            <p>Pathologies : <strong>{form.targetConditions.length} sélectionnée(s)</strong></p>
            <p>Hyperparamètres : epochs={form.hyperparams.epochs}, batch={form.hyperparams.batchSize}, lr={form.hyperparams.lr}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all"
            style={{ backgroundColor: PRIMARY, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Création et lancement de l\'entraînement...' : 'Créer et lancer l\'entraînement'}
          </button>
        </form>
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: box-shadow 0.15s;
          background: white;
        }
        .input:focus {
          box-shadow: 0 0 0 2px #178A3B33;
          border-color: #178A3B;
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <h2 className="font-semibold text-gray-800 text-base border-b border-gray-100 pb-2">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
