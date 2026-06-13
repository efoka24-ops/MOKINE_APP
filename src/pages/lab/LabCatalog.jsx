import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';
const PRIMARY_L = '#f0fdf4';
const API_BASE  = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CATEGORY_META = {
  detection:      { label: 'Détection',       color: 'bg-blue-100 text-blue-700',    icon: '🎯' },
  classification: { label: 'Classification',   color: 'bg-green-100 text-green-700',  icon: '🏷️' },
  segmentation:   { label: 'Segmentation',     color: 'bg-purple-100 text-purple-700',icon: '✂️' },
  'zero-shot':    { label: 'Zero-Shot',         color: 'bg-orange-100 text-orange-700',icon: '🧪' },
};

const DIFFICULTY_META = {
  beginner:     { label: 'Débutant',   color: 'text-green-600' },
  intermediate: { label: 'Intermédiaire', color: 'text-yellow-600' },
  advanced:     { label: 'Avancé',      color: 'text-orange-600' },
  expert:       { label: 'Expert',      color: 'text-red-600' },
};

const LICENSE_COLORS = {
  'MIT':        'bg-green-50 text-green-700 border-green-200',
  'Apache-2.0': 'bg-blue-50 text-blue-700 border-blue-200',
  'AGPL-3.0':   'bg-yellow-50 text-yellow-700 border-yellow-200',
  'CC-BY-4.0':  'bg-purple-50 text-purple-700 border-purple-200',
};

function MetricBar({ label, value, max = 1 }) {
  if (value == null) return null;
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= 90 ? '#178A3B' : pct >= 75 ? '#eab308' : '#f97316';
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-bold" style={{ color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function ModelCard({ model, user, onUseAsBase }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_META[model.category] || CATEGORY_META.classification;
  const diff = DIFFICULTY_META[model.difficultyLevel] || DIFFICULTY_META.intermediate;
  const licColor = LICENSE_COLORS[model.license] || 'bg-gray-50 text-gray-600 border-gray-200';
  const m = model.metrics || {};

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-green-200 hover:shadow-md transition-all">
      {/* Header */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>
                {cat.icon} {cat.label}
              </span>
              {model.animalHumanDiscrimination && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700">
                  👤 Anti-humain
                </span>
              )}
              <span className={`text-xs font-medium ${diff.color}`}>
                ● {diff.label}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{model.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{model.architecture} · v{model.version}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {model.communityRating && (
              <div className="text-sm font-bold text-yellow-500">★ {model.communityRating}</div>
            )}
            <div className="text-xs text-gray-400">{model.communityForks || 0} forks</div>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{model.description}</p>
      </div>

      {/* Metrics rapides */}
      <div className="px-5 py-4 space-y-2">
        <MetricBar label="Précision" value={m.accuracy ?? m.precision} />
        <MetricBar label="F1-Score"  value={m.f1} />
        {m.mAP50 != null && <MetricBar label="mAP@50" value={m.mAP50} />}
        {m.auc != null && <MetricBar label="AUC-ROC" value={m.auc} />}
      </div>

      {/* Stats techniques rapides */}
      <div className="px-5 pb-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg py-2">
            <p className="text-xs font-bold text-gray-800">
              {m.inferenceMs != null ? `${m.inferenceMs}ms` : '—'}
            </p>
            <p className="text-xs text-gray-400">Latence</p>
          </div>
          <div className="bg-gray-50 rounded-lg py-2">
            <p className="text-xs font-bold text-gray-800">
              {m.modelSizeMB != null ? `${m.modelSizeMB}MB` : '—'}
            </p>
            <p className="text-xs text-gray-400">Poids</p>
          </div>
          <div className="bg-gray-50 rounded-lg py-2">
            <p className="text-xs font-bold text-gray-800">
              {m.parameterCount != null
                ? m.parameterCount >= 1e6
                  ? `${(m.parameterCount / 1e6).toFixed(0)}M`
                  : `${(m.parameterCount / 1e3).toFixed(0)}K`
                : '—'}
            </p>
            <p className="text-xs text-gray-400">Params</p>
          </div>
        </div>
      </div>

      {/* Détails expandables */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-50 pt-4 space-y-4">
          {/* Taux succès/échec */}
          {(m.successRateOnBenchmark != null || m.failureRate != null) && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Taux succès / échec</p>
              <div className="grid grid-cols-2 gap-2">
                {m.successRateOnBenchmark != null && (
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <p className="text-base font-extrabold text-green-700">
                      {(m.successRateOnBenchmark * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-green-600">Taux succès</p>
                  </div>
                )}
                {m.failureRate != null && (
                  <div className="bg-red-50 rounded-lg p-2 text-center">
                    <p className="text-base font-extrabold text-red-600">
                      {(m.failureRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-red-500">Taux échec</p>
                  </div>
                )}
                {m.falsePositiveRate != null && (
                  <div className="bg-orange-50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-orange-600">
                      {(m.falsePositiveRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-orange-500">Faux positifs</p>
                  </div>
                )}
                {m.falseNegativeRate != null && (
                  <div className="bg-yellow-50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-yellow-700">
                      {(m.falseNegativeRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-yellow-600">Faux négatifs</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Métriques complètes */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Métriques complètes</p>
            <div className="space-y-1.5">
              <MetricBar label="Précision (Precision)" value={m.precision} />
              <MetricBar label="Rappel (Recall)"        value={m.recall} />
              <MetricBar label="F1-Score"                value={m.f1} />
              {m.accuracy  != null && <MetricBar label="Accuracy"   value={m.accuracy} />}
              {m.auc       != null && <MetricBar label="AUC-ROC"    value={m.auc} />}
              {m.mAP50     != null && <MetricBar label="mAP@50"     value={m.mAP50} />}
              {m.mAP50_95  != null && <MetricBar label="mAP@50-95"  value={m.mAP50_95} />}
              {m.meanIoU   != null && <MetricBar label="Mean IoU"   value={m.meanIoU} />}
            </div>
          </div>

          {/* Infos techniques */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Détails techniques</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
              {m.inputResolution && <><span className="text-gray-400">Résolution</span><span className="font-medium">{m.inputResolution}</span></>}
              {m.trainingEpochs  && <><span className="text-gray-400">Epochs</span><span className="font-medium">{m.trainingEpochs}</span></>}
              {m.batchSize       && <><span className="text-gray-400">Batch size</span><span className="font-medium">{m.batchSize}</span></>}
              {m.optimizer       && <><span className="text-gray-400">Optimizer</span><span className="font-medium">{m.optimizer}</span></>}
              {m.gflops          && <><span className="text-gray-400">GFLOPs</span><span className="font-medium">{m.gflops}</span></>}
            </div>
          </div>

          {/* Dataset */}
          {model.dataset && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Dataset d'entraînement</p>
              <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-0.5">
                <p><span className="text-gray-400">Nom:</span> <span className="font-medium">{model.dataset.name}</span></p>
                {model.dataset.images && (
                  <p><span className="text-gray-400">Images:</span> <span className="font-medium">{model.dataset.images.toLocaleString('fr-FR')}</span></p>
                )}
                <p><span className="text-gray-400">Classes:</span> <span className="font-medium">{model.dataset.classes}</span></p>
                {model.dataset.source && <p><span className="text-gray-400">Source:</span> <span className="font-mono text-gray-500">{model.dataset.source}</span></p>}
              </div>
            </div>
          )}

          {/* Publication */}
          {model.paper && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Publication de référence</p>
              <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-0.5">
                <p className="font-semibold text-blue-800 leading-snug">{model.paper.title}</p>
                <p className="text-blue-600">{model.paper.authors?.slice(0, 3).join(', ')}{model.paper.authors?.length > 3 ? ' et al.' : ''}</p>
                <p className="text-blue-500">{model.paper.venue} · {model.paper.year}</p>
                {model.paper.citationCount && <p className="text-blue-400">{model.paper.citationCount.toLocaleString('fr-FR')} citations</p>}
                {model.paper.doi && (
                  <p className="text-blue-400 font-mono text-xs break-all">DOI: {model.paper.doi}</p>
                )}
              </div>
            </div>
          )}

          {/* Cas d'usage */}
          {model.useCases?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Cas d'usage</p>
              <ul className="space-y-1">
                {model.useCases.map((u, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span style={{ color: PRIMARY }} className="font-bold flex-shrink-0">✓</span>
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded border ${licColor}`}>
            {model.license}
          </span>
          <span className="text-xs text-gray-400">{model.framework?.split(' / ')[0]}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition"
          >
            {expanded ? 'Réduire ↑' : 'Détails ↓'}
          </button>
          {user?.role === 'developer' && (
            <button
              onClick={() => onUseAsBase(model)}
              className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold transition hover:opacity-90"
              style={{ background: PRIMARY }}
            >
              Utiliser comme base →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LabCatalog() {
  const { user, authFetch } = useLabAuth();
  const navigate = useNavigate();

  const [models, setModels]     = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [category, setCategory] = useState('');
  const [species, setSpecies]   = useState('');
  const [search, setSearch]     = useState('');

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (species)  params.set('species', species);
      if (search)   params.set('search', search);

      const res = await authFetch(`${API_BASE}/api/lab/catalog?${params}`);
      const data = await res.json();
      setModels(data.models || []);
      setSummary(data.summary || null);
    } catch {
      setError('Impossible de charger le catalogue.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, category, species, search]);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  const handleUseAsBase = (model) => {
    navigate('/mokinelab/dashboard/models/new', { state: { baseModel: model } });
  };

  const CATEGORY_OPTIONS = [
    { value: '',               label: 'Toutes catégories' },
    { value: 'detection',      label: '🎯 Détection' },
    { value: 'classification', label: '🏷️ Classification' },
    { value: 'segmentation',   label: '✂️ Segmentation' },
    { value: 'zero-shot',      label: '🧪 Zero-Shot' },
  ];

  const SPECIES_OPTIONS = [
    { value: '',        label: 'Toutes espèces' },
    { value: 'cattle',  label: '🐄 Bovins' },
    { value: 'goat',    label: '🐐 Caprins' },
    { value: 'sheep',   label: '🐑 Ovins' },
    { value: 'pig',     label: '🐷 Porcins' },
    { value: 'poultry', label: '🐔 Volaille' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/mokinelab/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
            <span className="text-gray-300">/</span>
            <h1 className="font-bold text-gray-800">🧠 Catalogue Modèles IA Académiques</h1>
          </div>
          {user?.role === 'lab_admin' && (
            <Link
              to="/mokinelab/dashboard/admin"
              className="text-xs px-3 py-1.5 text-white rounded-lg font-semibold"
              style={{ background: PRIMARY }}
            >
              ⚙️ Gérer catalogue
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Intro */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-1">
            Modèles pré-entraînés de référence
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            12 architectures académiques et industrielles, avec métriques complètes, publications de référence et détails techniques.
            Les développeurs peuvent les utiliser comme base de fine-tuning pour leurs propres modèles Tebe.
          </p>
          {summary && (
            <div className="flex flex-wrap gap-3">
              <span className="text-xs bg-white rounded-lg px-3 py-1.5 border border-gray-200 font-semibold">
                {summary.total} modèle{summary.total > 1 ? 's' : ''}
              </span>
              {Object.entries(summary.byCategory || {}).map(([cat, count]) => (
                <span key={cat} className={`text-xs rounded-lg px-3 py-1.5 font-medium ${CATEGORY_META[cat]?.color || 'bg-gray-100 text-gray-600'}`}>
                  {CATEGORY_META[cat]?.icon} {count} {CATEGORY_META[cat]?.label || cat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="🔍 Rechercher (nom, pathologie, tag...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-52 px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-white"
          >
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={species}
            onChange={e => setSpecies(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-white"
          >
            {SPECIES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {(category || species || search) && (
            <button
              onClick={() => { setCategory(''); setSpecies(''); setSearch(''); }}
              className="text-xs text-gray-500 hover:text-red-500 px-2 py-1 transition"
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500">Aucun modèle trouvé pour ces critères.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {models.map(model => (
              <ModelCard
                key={model.id}
                model={model}
                user={user}
                onUseAsBase={handleUseAsBase}
              />
            ))}
          </div>
        )}

        {/* Légende discrimination */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-bold text-gray-700 mb-2">Légende — Discrimination animal/humain</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">👤 Anti-humain</span>
              Modèle capable de discriminer humain vs animal
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">· Les modèles sans ce badge sont spécialisés pathologie uniquement</span>
          </div>
        </div>
      </div>
    </div>
  );
}
