import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tebe } from '../API.js';
import { useI18n } from '../i18n/index.js';
import LanguageSelector from '../components/LanguageSelector';

// ─── Identité graphique Mokine ────────────────────────────────────────────────
const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';
const PRIMARY_L = '#f0fdf4';
const PRIMARY_B = '#bbf7d0';

// ─── Données statiques ───────────────────────────────────────────────────────
const FEATURES = [
  { icon: '📸', title: 'Scan Tebe IA', desc: 'Prenez une photo de votre animal et obtenez un diagnostic visuel instantané parmi 7 pathologies majeures.' },
  { icon: '💬', title: 'Questionnaire Symptômes', desc: 'Répondez à 5 questions sur les symptômes observés et recevez un pré-diagnostic IA en quelques secondes.' },
  { icon: '🤝', title: 'Contribuer au Dataset', desc: 'Soumettez vos photos annotées pour aider à entraîner le futur modèle Tebe v1.0 — MobileNet 1000 images.' },
  { icon: '📊', title: 'Transparence Modèle', desc: 'Suivez en temps réel la progression du dataset, la version du modèle et son taux de précision.' },
  { icon: '🌍', title: 'Noms en Langues Locales', desc: 'Chaque pathologie est disponible en Français, Fulfuldé et Haoussa pour tous les éleveurs du Cameroun.' },
  { icon: '🔌', title: 'API Publique', desc: 'Intégrez le diagnostic Tebe dans vos propres applications via notre API REST ouverte et documentée.' },
];

const STEPS = [
  { step: '1', icon: '📱', title: 'Prenez une photo', desc: 'Photographiez votre animal sous un bon éclairage — tête, corps ou zone symptomatique.' },
  { step: '2', icon: '🧬', title: 'Tebe IA analyse', desc: 'Le modèle analyse les marqueurs visuels en moins de 3 secondes et identifie la pathologie la plus probable.' },
  { step: '3', icon: '📋', title: 'Recevez le diagnostic', desc: 'Résultat + sévérité + recommandations concrètes + proposition de consultation vétérinaire si nécessaire.' },
];

const SEVERITY_CONFIG = {
  critical: { label: 'Critique', color: 'bg-red-100 text-red-700 border-red-200',       dot: 'bg-red-500' },
  severe:   { label: 'Élevé',   color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  high:     { label: 'Élevé',   color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  moderate: { label: 'Modéré',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  medium:   { label: 'Modéré',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  low:      { label: 'Faible',  color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400' },
  healthy:  { label: 'Sain',    color: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-500' },
  none:     { label: 'Sain',    color: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-500' },
};

const ANIMAL_TYPES = [
  { value: 'cattle',  label: '🐄 Bovin' },
  { value: 'goat',    label: '🐐 Caprin' },
  { value: 'sheep',   label: '🐑 Ovin' },
  { value: 'pig',     label: '🐷 Porcin' },
  { value: 'poultry', label: '🐔 Volaille' },
  { value: 'other',   label: '🐾 Autre' },
];

// ─── Composants utilitaires ──────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.moderate;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ProgressBar({ value, max }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span className="font-medium">{value.toLocaleString()} / {max.toLocaleString()} images</span>
        <span className="font-bold" style={{ color: PRIMARY }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_D})` }} />
      </div>
    </div>
  );
}

// ─── Scanner interactif ───────────────────────────────────────────────────────
function ScanSection() {
  const { t } = useI18n();
  const [animalType, setAnimalType]   = useState('cattle');
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState('');
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile({ target: { files: [file] } });
  };

  const runScan = async () => {
    setLoading(true);
    setError('');
    try {
      const imageBase64 = imagePreview ? imagePreview.split(',')[1] : null;
      const r = await tebe.analyzeImage({ animalType, imageBase64 });
      setResult(r.data);
    } catch {
      setError('Erreur lors de l\'analyse. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setImageFile(null); setImagePreview(null); setResult(null); setError(''); };

  return (
    <section id="scan" className="py-20 px-4" style={{ background: `linear-gradient(135deg, ${PRIMARY_L} 0%, #ffffff 60%)` }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
            style={{ background: PRIMARY_B, color: PRIMARY_D }}>
            🧬 Propulsé par Tebe IA v0.3
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{t('lab.scan_title')}</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Gratuit, sans compte requis. Résultat en moins de 3 secondes.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
          {/* Sélection espèce */}
          <div className="p-6 border-b border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Espèce animale</label>
            <div className="flex flex-wrap gap-2">
              {ANIMAL_TYPES.map(t => (
                <button key={t.value} onClick={() => setAnimalType(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    animalType === t.value
                      ? 'text-white border-transparent'
                      : 'border-gray-200 text-gray-600 hover:border-green-300'
                  }`}
                  style={animalType === t.value ? { background: PRIMARY, borderColor: PRIMARY } : {}}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-0">
            {/* Zone upload */}
            <div className="p-6 border-r border-gray-100">
              {!imagePreview ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  className="border-2 border-dashed border-green-200 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all">
                  <div className="text-4xl mb-3">📸</div>
                  <p className="font-semibold text-gray-700 mb-1">Glissez une photo ici</p>
                  <p className="text-xs text-gray-400 mb-4">ou cliquez pour choisir un fichier</p>
                  <p className="text-xs text-gray-400">JPG, PNG, WEBP · max 10 Mo</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </div>
              ) : (
                <div className="relative">
                  <img src={imagePreview} alt="preview" className="w-full h-56 object-cover rounded-xl" />
                  <button onClick={reset}
                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-gray-500 hover:text-red-500 text-sm">
                    ✕
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">{imageFile?.name}</p>
                </div>
              )}

              <button onClick={runScan} disabled={loading || !imagePreview}
                className="mt-4 w-full py-3 rounded-xl font-semibold text-white text-sm transition-all shadow-md disabled:opacity-50"
                style={{ background: loading ? '#6ee7a0' : `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})` }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyse en cours…
                  </span>
                ) : '🔍 Lancer le diagnostic Tebe IA'}
              </button>

              {!imagePreview && (
                <button onClick={runScan}
                  className="mt-2 w-full py-2.5 rounded-xl text-sm font-medium border transition-all hover:bg-green-50"
                  style={{ borderColor: PRIMARY, color: PRIMARY }}>
                  Tester sans photo (demo)
                </button>
              )}

              {error && <p className="mt-3 text-xs text-red-500 text-center">{error}</p>}
            </div>

            {/* Résultat */}
            <div className="p-6">
              {!result && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="text-5xl mb-4">🔬</div>
                  <p className="text-gray-400 text-sm font-medium">Le résultat apparaîtra ici</p>
                  <p className="text-gray-300 text-xs mt-1">Uploadez une photo et lancez l'analyse</p>
                </div>
              )}
              {loading && (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4" />
                  <p className="font-semibold text-sm" style={{ color: PRIMARY }}>Analyse visuelle en cours…</p>
                  <p className="text-gray-400 text-xs mt-1">Tebe IA traite l'image</p>
                </div>
              )}
              {result && !loading && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Diagnostic principal</p>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{result.diagnosis?.condition}</h3>
                      {result.diagnosis?.condition_ff && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          ff: {result.diagnosis.condition_ff} · ha: {result.diagnosis.condition_ha}
                        </p>
                      )}
                    </div>
                    <SeverityBadge severity={result.diagnosis?.severity} />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((result.diagnosis?.confidence || 0) * 100)}%`, background: PRIMARY }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: PRIMARY }}>{Math.round((result.diagnosis?.confidence || 0) * 100)}%</span>
                    <span className="text-xs text-gray-400">confiance</span>
                  </div>

                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
                    {result.diagnosis?.description}
                  </p>

                  {result.recommendations?.[0] && (
                    <div className="rounded-lg p-3" style={{ background: PRIMARY_L, border: `1px solid ${PRIMARY_B}` }}>
                      <p className="text-xs font-bold mb-1" style={{ color: PRIMARY_D }}>Recommandation</p>
                      <p className="text-xs leading-relaxed" style={{ color: PRIMARY_D }}>{result.recommendations[0]}</p>
                    </div>
                  )}

                  {result.urgency && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      <p className="text-xs font-semibold text-red-700">{result.urgency}</p>
                    </div>
                  )}

                  {result.differentials?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Diagnostics différentiels</p>
                      <div className="space-y-1.5">
                        {result.differentials.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-700">{d.condition}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">{Math.round(d.confidence * 100)}%</span>
                              <SeverityBadge severity={d.severity} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 italic">{result.disclaimer}</p>

                  <div className="flex gap-2 pt-1">
                    <button onClick={reset}
                      className="flex-1 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                      Nouveau scan
                    </button>
                    {result.consultVet && (
                      <a href="/mokineveto"
                        className="flex-1 py-2 text-xs font-semibold rounded-lg text-white text-center transition"
                        style={{ background: PRIMARY }}>
                        Consulter un vét. →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Catalogue des maladies ───────────────────────────────────────────────────
function DiseasesCatalogue() {
  const { t } = useI18n();
  const [conditions, setConditions] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    tebe.getConditions()
      .then(r => setConditions(r.data.conditions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sevLabel = { critical: 'Critique', high: 'Élevé', medium: 'Modéré', low: 'Faible', none: 'Aucune' };
  const sevColor = {
    critical: 'text-red-600 bg-red-50',
    high:     'text-orange-600 bg-orange-50',
    medium:   'text-yellow-600 bg-yellow-50',
    low:      'text-blue-600 bg-blue-50',
    none:     'text-green-600 bg-green-50',
  };

  return (
    <section id="catalogue" className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{t('lab.catalogue_title')}</h2>
          <p className="text-gray-500 max-w-lg mx-auto">7 pathologies majeures avec noms locaux et protocoles de traitement</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {conditions.map(c => (
              <div key={c.id}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
                className="bg-white rounded-xl border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-green-200 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1 pr-2">{c.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${sevColor[c.severity] || 'text-gray-600 bg-gray-100'}`}>
                    {sevLabel[c.severity] || c.severity}
                  </span>
                </div>
                {c.localName && (
                  <div className="flex gap-3 mb-3">
                    {c.localName.ff && <span className="text-xs text-gray-500">ff: <span className="italic">{c.localName.ff}</span></span>}
                    {c.localName.ha && <span className="text-xs text-gray-500">ha: <span className="italic">{c.localName.ha}</span></span>}
                  </div>
                )}
                <p className="text-xs text-gray-500 leading-relaxed">{c.description}</p>
                {selected?.id === c.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {(c.visual_markers || []).map(m => (
                        <span key={m} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: PRIMARY_L, color: PRIMARY_D }}>
                          {m.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs p-2 rounded-lg leading-relaxed"
                      style={{ background: PRIMARY_L, color: PRIMARY_D }}>
                      {c.action}
                    </p>
                    {c.consultVet && (
                      <p className="text-xs text-red-600 font-semibold">⚕️ Consultation vétérinaire recommandée</p>
                    )}
                  </div>
                )}
                <p className="text-xs mt-2 font-medium" style={{ color: PRIMARY }}>
                  {selected?.id === c.id ? '▲ Moins d\'infos' : '▼ Plus d\'infos'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Contribuer au dataset ────────────────────────────────────────────────────
function ContributeSection({ stats }) {
  const { t } = useI18n();
  const [conditions, setConditions] = useState([]);
  const [form, setForm]             = useState({ animalType: 'cattle', condition: '', vetValidated: false });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(null);
  const [error, setError]           = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    tebe.getConditions().then(r => setConditions(r.data.conditions || [])).catch(() => {});
  }, []);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.condition) { setError('Veuillez sélectionner une condition.'); return; }
    setLoading(true); setError('');
    try {
      const r = await tebe.contributeTrainingData({ ...form, imageBase64 });
      setSuccess(r.data);
      setForm({ animalType: 'cattle', condition: '', vetValidated: false });
      setImagePreview(null); setImageBase64(null);
    } catch {
      setError('Erreur lors de la soumission. Réessayez.');
    } finally { setLoading(false); }
  };

  const collected = stats?.dataset?.collected || 847;
  const target    = stats?.dataset?.target || 1000;

  return (
    <section id="contribuer" className="py-20 px-4"
      style={{ background: `linear-gradient(135deg, ${PRIMARY_D} 0%, ${PRIMARY} 60%, #20a852 100%)` }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            🤝 Rejoignez la communauté Tebe
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">{t('lab.contribute_title')}</h2>
          <p className="text-green-100 max-w-lg mx-auto">
            Chaque photo annotée nous rapproche du modèle MobileNet v1.0. Votre contribution est visible en temps réel.
          </p>
        </div>

        {/* Progression */}
        <div className="bg-white/15 rounded-2xl p-5 mb-8 backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold text-sm">Progression du dataset Tebe</span>
            <span className="text-green-200 text-xs">Objectif : {target.toLocaleString()} images</span>
          </div>
          <div>
            <div className="flex justify-between text-xs text-green-200 mb-1.5">
              <span className="font-medium">{collected.toLocaleString()} / {target.toLocaleString()} images</span>
              <span className="font-bold text-white">{((collected / target) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${Math.min((collected / target) * 100, 100)}%` }} />
            </div>
          </div>
          <div className="flex justify-around mt-4 text-center">
            <div><p className="text-white font-bold text-xl">{collected}</p><p className="text-green-200 text-xs">Images collectées</p></div>
            <div><p className="text-white font-bold text-xl">{target - collected}</p><p className="text-green-200 text-xs">Restantes</p></div>
            <div><p className="text-white font-bold text-xl">sept. 2026</p><p className="text-green-200 text-xs">Lancement v1.0</p></div>
          </div>
        </div>

        {success ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Merci pour votre contribution !</h3>
            <p className="text-gray-600 text-sm mb-4">Votre photo a été soumise et sera examinée par notre équipe.</p>
            <div className="rounded-xl p-4 mb-6" style={{ background: PRIMARY_L }}>
              <ProgressBar value={success.datasetProgress?.total || collected} max={target} />
            </div>
            <button onClick={() => setSuccess(null)}
              className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
              style={{ background: PRIMARY }}>
              Soumettre une autre photo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Espèce *</label>
                <select value={form.animalType}
                  onChange={e => setForm(f => ({ ...f, animalType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
                  {ANIMAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Condition observée *</label>
                <select value={form.condition}
                  onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
                  <option value="">-- Sélectionner --</option>
                  {conditions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Photo de l'animal <span className="text-gray-400 font-normal">(optionnel mais valorisée)</span>
              </label>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-xl" />
                  <button type="button"
                    onClick={() => { setImagePreview(null); setImageBase64(null); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-xs text-gray-500">
                    ✕
                  </button>
                </div>
              ) : (
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-green-300 hover:bg-green-50 transition-all">
                  <p className="text-sm text-gray-500">📎 Cliquez pour ajouter une photo</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.vetValidated}
                onChange={e => setForm(f => ({ ...f, vetValidated: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300" />
              <span className="text-sm text-gray-700">
                Ce diagnostic a été confirmé par un vétérinaire{' '}
                <span className="text-xs font-medium" style={{ color: PRIMARY }}>(x2 valeur d'entraînement)</span>
              </span>
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})` }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi en cours…
                </span>
              ) : '🤝 Soumettre ma contribution'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ─── Transparence modèle ──────────────────────────────────────────────────────
function ModelTransparency({ stats }) {
  const { t } = useI18n();
  const models = stats?.models || [];
  const statusMap = {
    production: ['bg-green-100 text-green-700', 'Production'],
    training:   ['bg-yellow-100 text-yellow-700', 'Entraînement'],
    deprecated: ['bg-gray-100 text-gray-500', 'Déprécié'],
  };

  return (
    <section id="modele" className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{t('lab.model_title')}</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Nous publions publiquement l'état de nos modèles, leur précision et la progression de l'entraînement.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {models.map(m => {
            const [cls, label] = statusMap[m.status] || ['bg-gray-100 text-gray-500', m.status];
            return (
              <div key={m.id} className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{m.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {m.id === 'tebe' ? 'Analyse photo & vidéo' : 'Questionnaire symptômes'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${cls}`}>{label}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 mb-0.5">Version actuelle</p>
                    <p className="font-mono font-bold text-gray-800">{m.version}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 mb-0.5">Prochaine version</p>
                    <p className="font-mono font-bold text-gray-800">{m.nextVersion}</p>
                  </div>
                  {m.accuracy && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 mb-0.5">Précision</p>
                      <p className="font-bold text-gray-800">{Math.round(m.accuracy * 100)}%</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 mb-0.5">Lancement estimé</p>
                    <p className="font-semibold text-gray-800">{m.estimatedLaunch}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* API publique */}
        <div className="mt-8 rounded-2xl p-6" style={{ background: PRIMARY_L, border: `1px solid ${PRIMARY_B}` }}>
          <h3 className="font-bold mb-2" style={{ color: PRIMARY_D }}>🔌 API Publique Tebe</h3>
          <p className="text-sm mb-4" style={{ color: PRIMARY_D }}>
            Intégrez le diagnostic visuel dans vos propres applications. Gratuit jusqu'à 100 requêtes/jour.
          </p>
          <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs overflow-x-auto">
            <p className="text-gray-500 mb-1"># POST /api/tebe/analyze-image</p>
            <p>{`{`}</p>
            <p className="ml-4"><span className="text-yellow-400">"animalType"</span>: <span className="text-green-300">"cattle"</span>,</p>
            <p className="ml-4"><span className="text-yellow-400">"imageBase64"</span>: <span className="text-green-300">"..."</span></p>
            <p>{`}`}</p>
          </div>
          <p className="text-xs mt-3" style={{ color: PRIMARY }}>
            Aucune clé API requise pour les appels publics ·{' '}
            <a href="/mokinelab/commercial" className="underline hover:opacity-80 font-semibold">🔑 Usage commercial →</a>
            {' '}·{' '}
            <a href="/mokinelab/docs" className="underline hover:opacity-80 font-semibold">📄 Documentation complète →</a>
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MokineLabPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    tebe.getPublicStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  const collected = stats?.dataset?.collected || 847;
  const target    = stats?.dataset?.target || 1000;
  const pct       = ((collected / target) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: PRIMARY }}>M</div>
            <span className="font-bold text-gray-800 text-lg">
              Mokine<span style={{ color: PRIMARY }}>Lab</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#scan"       className="transition hover:text-green-600">{t('lab.nav.scan')}</a>
            <a href="#catalogue"  className="transition hover:text-green-600">{t('lab.nav.catalogue')}</a>
            <a href="#contribuer" className="transition hover:text-green-600">{t('lab.nav.contribute')}</a>
            <a href="#modele"     className="transition hover:text-green-600">{t('lab.nav.model')}</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector compact />
            <a href="/mokineveto" className="text-sm text-gray-500 hover:text-green-600 transition hidden sm:block">
              MokineVeto →
            </a>
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-white text-sm rounded-lg transition"
                style={{ background: PRIMARY }}>
                {t('lab.nav.dashboard')}
              </button>
            ) : (
              <button onClick={() => navigate('/register')}
                className="px-4 py-2 text-white text-sm rounded-lg transition"
                style={{ background: PRIMARY }}>
                {t('lab.nav.register')}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-4"
        style={{ background: `linear-gradient(135deg, ${PRIMARY_L} 0%, #ffffff 50%, ${PRIMARY_L} 100%)` }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
            style={{ background: PRIMARY_B, color: PRIMARY_D }}>
            {t('lab.badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
            {t('lab.hero_title')}<br />
            <span style={{ color: PRIMARY }}>{t('lab.hero_title2')}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">{t('lab.hero_desc')}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <a href="#scan"
              className="px-8 py-3.5 text-white font-semibold rounded-xl shadow-lg transition-all text-sm"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})`, boxShadow: `0 8px 25px ${PRIMARY}50` }}>
              🔍 Scanner mon animal maintenant
            </a>
            <a href="#contribuer"
              className="px-8 py-3.5 font-semibold rounded-xl border-2 text-sm transition-all hover:bg-green-50"
              style={{ borderColor: PRIMARY, color: PRIMARY }}>
              🤝 Contribuer au dataset
            </a>
          </div>

          {/* Mini dataset card */}
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-green-100 p-5">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span className="font-semibold">Dataset Tebe IA</span>
              <span className="font-bold" style={{ color: PRIMARY }}>{pct}% vers v1.0-MobileNet</span>
            </div>
            <ProgressBar value={collected} max={target} />
            <div className="flex justify-around mt-4 text-center">
              <div><p className="font-bold text-gray-900">{collected}</p><p className="text-xs text-gray-400">Images</p></div>
              <div><p className="font-bold text-gray-900">{stats?.conditionsCount || 7}</p><p className="text-xs text-gray-400">Maladies</p></div>
              <div><p className="font-bold text-gray-900">Gratuit</p><p className="text-xs text-gray-400">Pour tous</p></div>
              <div><p className="font-bold text-gray-900">API</p><p className="text-xs text-gray-400">Ouverte</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-12" style={{ background: PRIMARY }}>
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { value: `${collected}+`, label: 'Images dataset' },
            { value: stats?.conditionsCount || '7', label: 'Maladies détectables' },
            { value: `${pct}%`,       label: 'Objectif atteint' },
            { value: '0 FCFA',        label: 'Gratuit & ouvert' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-green-200 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">{t('lab.features_title')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Une plateforme ouverte dédiée à l'IA vétérinaire — accessibilité maximale, zéro friction
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title}
                className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-md hover:border-green-200 transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scanner ── */}
      <ScanSection />

      {/* ── Comment ça marche ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">{t('lab.how_title')}</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 text-white"
                  style={{ background: PRIMARY }}>
                  {s.step}
                </div>
                <div className="text-2xl mb-2">{s.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Questionnaire IA ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="text-6xl flex-shrink-0">💬</div>
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                Pas de photo ? Utilisez le Questionnaire IA
              </h2>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Répondez à 5 questions sur les symptômes de votre animal et obtenez un pré-diagnostic instantané.
                L'IA Questionnaire (v2.1) atteint 78% de précision sur les maladies bovines et caprines.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Perte d\'appétit', 'Fièvre', 'Boiterie', 'Toux', 'Diarrhée'].map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full border border-green-200 bg-green-50"
                    style={{ color: PRIMARY }}>
                    {s}
                  </span>
                ))}
              </div>
              <button
                onClick={() => {
                  if (!isAuthenticated) { navigate('/register'); return; }
                  const role = user?.role;
                  if (role === 'farmer') navigate('/ia/questionnaire');
                  else if (role === 'veterinarian') navigate('/vet/dashboard');
                  else if (role === 'vendor') navigate('/vendor/dashboard');
                  else navigate('/ia/questionnaire');
                }}
                className="px-6 py-2.5 text-white font-semibold rounded-xl text-sm transition-all"
                style={{ background: PRIMARY }}>
                {!isAuthenticated ? 'Créer un compte gratuit →'
                  : user?.role === 'farmer' ? 'Lancer le questionnaire →'
                  : 'Accéder à mon espace →'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Catalogue ── */}
      <DiseasesCatalogue />

      {/* ── Contribuer ── */}
      <ContributeSection stats={stats} />

      {/* ── Transparence ── */}
      <ModelTransparency stats={stats} />

      {/* ── CTA final ── */}
      <section className="py-16 px-4 text-white text-center"
        style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})` }}>
        <h2 className="text-3xl font-bold mb-3">Besoin d'un vétérinaire ?</h2>
        <p className="mb-8 max-w-md mx-auto text-green-200">
          MokineLab vous donne le pré-diagnostic. Pour une consultation complète et une ordonnance officielle,
          rejoignez MokineVeto.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            className="px-8 py-3.5 bg-white font-bold rounded-xl hover:bg-green-50 transition-all text-sm"
            style={{ color: PRIMARY }}>
            {isAuthenticated ? 'Mon espace MokineVeto →' : 'Créer un compte gratuit →'}
          </button>
          <a href="/"
            className="px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-sm">
            Retour à l'accueil
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400 text-center text-sm">
        <p className="font-semibold text-white mb-1">🧬 MokineLab — Intelligence Artificielle Vétérinaire</p>
        <p>Plateforme ouverte de diagnostic animal · Yaoundé, Cameroun</p>
        <p className="mt-2">
          <a href="/mokineveto" className="hover:text-green-400 transition">MokineVeto</a>
          <span className="mx-2">·</span>
          <a href="/" className="hover:text-white transition">Accueil Mokine</a>
          <span className="mx-2">·</span>
          <a href="/mokinelab/docs" className="hover:text-green-400 transition font-medium">📄 Documentation API</a>
          <span className="mx-2">·</span>
          <a href="/mokinelab/commercial" className="hover:text-green-400 transition font-medium">🔑 Usage Commercial</a>
          <span className="mx-2">·</span>
          <span>contact@mokine.cm</span>
        </p>
        <p className="mt-2 text-xs text-gray-600">
          © {new Date().getFullYear()} Mokine · Tebe IA v0.3-rule-based · Dataset {847}/1000
        </p>
      </footer>
    </div>
  );
}
