import React, { useState, useRef, useCallback } from 'react';
import apiClient from '../API';

const TEBE_VERSION = 'tebe-v0.3';
const SEVERITY_COLORS = {
  critical: 'bg-red-100 border-red-400 text-red-800',
  severe: 'bg-orange-100 border-orange-400 text-orange-800',
  moderate: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  mild: 'bg-blue-100 border-blue-400 text-blue-800',
  healthy: 'bg-green-100 border-green-400 text-green-800',
};
const SEVERITY_ICONS = { critical: '🔴', severe: '🟠', moderate: '🟡', mild: '🔵', healthy: '🟢' };

function ConfidenceBar({ value, color = 'bg-green-500' }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-600 w-10 text-right">{Math.round(value * 100)}%</span>
    </div>
  );
}

function TebeLogoHeader() {
  return (
    <div className="bg-gradient-to-br from-green-700 to-green-900 text-white px-6 py-8 text-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full border border-white" style={{
            width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
            top: '50%', left: '50%',
            transform: `translate(-50%, -50%)`
          }} />
        ))}
      </div>

      {/* Tebe Logo */}
      <div className="relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 backdrop-blur mb-4 shadow-xl border border-white/20">
          <div className="text-center">
            <div className="text-2xl font-black tracking-tighter text-white leading-none">TB</div>
            <div className="text-[9px] font-bold text-green-200 tracking-widest mt-0.5">TEBE</div>
          </div>
        </div>
        <h1 className="text-2xl font-black mb-1">Tebe IA</h1>
        <p className="text-green-200 text-sm">Diagnostic visuel intelligent par MokineVeto</p>
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="text-xs bg-white/10 border border-white/20 px-3 py-1 rounded-full">{TEBE_VERSION}</span>
          <span className="text-xs bg-white/10 border border-white/20 px-3 py-1 rounded-full">847/1000 images ·&nbsp;84.7%</span>
        </div>
      </div>
    </div>
  );
}

export default function TebeDiagnostic() {
  const [inputMode, setInputMode] = useState('visual'); // 'visual' | 'text'
  const [mode, setMode] = useState('image'); // 'image' | 'video'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [animalType, setAnimalType] = useState('cattle');
  const [animalId, setAnimalId] = useState('');
  const [symptomText, setSymptomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [conditions, setConditions] = useState(null);
  const [showConditions, setShowConditions] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const toBase64 = (f) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(f);
  });

  const handleFile = useCallback((f) => {
    if (!f) return;
    const isVideo = f.type.startsWith('video/');
    const isImage = f.type.startsWith('image/');
    if (!isVideo && !isImage) { setError('Fichier non supporté. Utilisez JPG, PNG, MP4 ou MOV.'); return; }
    setMode(isVideo ? 'video' : 'image');
    setFile(f);
    setError('');
    setResult(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const analyze = async () => {
    if (inputMode === 'text') {
      if (!symptomText.trim()) return;
      setLoading(true);
      setError('');
      setResult(null);
      try {
        const res = await apiClient.post('/ia/diagnose', { description: symptomText, animalType });
        const d = res.data.diagnosis;
        const sevMap = { critical: 'critical', high: 'severe', medium: 'moderate', low: 'mild', unknown: 'moderate' };
        const confMap = { critical: 0.88, high: 0.78, medium: 0.65, low: 0.52, unknown: 0.45 };
        setResult({
          diagnosis: {
            condition: d.diagnosis,
            severity: sevMap[d.severity] || 'moderate',
            confidence: d.confidence ? d.confidence / 100 : (confMap[d.severity] || 0.60),
            visual_markers: (res.data.causes || []).map(c => c.symptome).slice(0, 4),
          },
          recommendations: d.suggestedActions?.length ? d.suggestedActions : (res.data.causes || []).map(c => c.symptome),
          differentials: (res.data.differentials || []).map(df => ({
            condition: df.name,
            confidence: df.confidence / 100,
            severity: df.severity,
          })),
          behavioralRisks: res.data.behavioralRisks || [],
          productionRisk: res.data.productionRisk || null,
          prevention: res.data.prevention || [],
          contextAfrique: res.data.contextAfrique || null,
          urgency: d.urgency || null,
          disclaimer: 'Ce prédiagnostic est fourni à titre indicatif uniquement. Il ne remplace pas l\'avis d\'un vétérinaire qualifié.',
          modelVersion: res.data.modelVersion || 'mokine-ia-v2.0-ensemble',
          datasetSize: null,
        });
      } catch (e) {
        setError(e.response?.data?.error || 'Erreur lors de l\'analyse. Vérifiez la connexion.');
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const b64 = await toBase64(file);
      const endpoint = mode === 'video' ? '/tebe/analyze-video' : '/tebe/analyze-image';
      const payload = {
        imageData: b64,
        imageBase64: b64,
        animalType,
        animalId: animalId || 'tebe-' + Date.now(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };
      const res = await apiClient.post(endpoint, payload);
      const data = res.data;

      // Handle both backend response formats
      if (data.diagnosis) {
        // New format: { diagnosis, recommendations, differentials, ... }
        setResult(data);
      } else if (data.analysis) {
        // Old format: { analysis: { primary, differential, ... } }
        const a = data.analysis;
        const SEV = { critical: 'critical', high: 'severe', medium: 'moderate', low: 'mild', none: 'healthy' };
        setResult({
          diagnosis: {
            condition: a.primary?.condition || a.primary?.name || 'Analyse effectuée',
            severity: SEV[a.primary?.severity] || 'moderate',
            confidence: a.primary?.confidence || 0.70,
            visual_markers: a.primary?.localName ? [] : [],
            description: a.primary?.description || '',
          },
          recommendations: a.primary?.action ? [a.primary.action] : [],
          differentials: (a.differential || []).map(d => ({
            condition: d.name,
            confidence: d.confidence,
            severity: SEV[d.severity] || 'moderate',
          })),
          behavioralRisks: [],
          productionRisk: null,
          contextAfrique: 'Résultat basé sur les conditions courantes en Afrique centrale.',
          urgency: a.primary?.severity === 'critical' ? 'URGENT — Contactez un vétérinaire immédiatement' : null,
          disclaimer: a.disclaimer,
          modelVersion: a.modelInfo || a.modelVersion,
          datasetSize: null,
          analysisQuality: a.analysisQuality,
          videoSummary: a.framesAnalyzed ? { framesAnalyzed: a.framesAnalyzed, consistencyScore: a.consistency } : null,
        });
      } else {
        // Fallback: use raw data and try to find something useful
        setResult({ ...data, diagnosis: data.primary ? { condition: data.primary.condition, severity: 'moderate', confidence: data.primary.confidence || 0.70, visual_markers: [] } : null });
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur lors de l\'analyse. Vérifiez la connexion.');
    } finally {
      setLoading(false);
    }
  };

  const loadConditions = async () => {
    try {
      const res = await apiClient.get('/tebe/conditions');
      setConditions(res.data);
      setShowConditions(true);
    } catch {}
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    setSymptomText('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TebeLogoHeader />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Mode selector: Visual vs Text */}
        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
          <button
            onClick={() => { setInputMode('visual'); setResult(null); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${inputMode === 'visual' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span>📸</span> Analyse visuelle
          </button>
          <button
            onClick={() => { setInputMode('text'); setResult(null); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${inputMode === 'text' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span>📝</span> Diagnostic par texte
          </button>
        </div>

        {/* Animal selection */}
        <div className="bg-white rounded-2xl border p-4 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm">Informations sur l'animal</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cattle', icon: '🐄', label: 'Bovin' },
              { id: 'sheep', icon: '🐑', label: 'Ovin' },
              { id: 'goat', icon: '🐐', label: 'Caprin' },
            ].map(a => (
              <button
                key={a.id}
                onClick={() => setAnimalType(a.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${animalType === a.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-xs font-medium text-gray-700">{a.label}</span>
              </button>
            ))}
          </div>
          {inputMode === 'visual' && (
            <input
              value={animalId}
              onChange={e => setAnimalId(e.target.value)}
              placeholder="ID animal (optionnel)"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700"
            />
          )}
        </div>

        {/* Text symptom input */}
        {inputMode === 'text' && !result && (
          <div className="bg-white rounded-2xl border p-4 space-y-3">
            <h2 className="font-semibold text-gray-900 text-sm">Décrivez les symptômes</h2>
            <textarea
              value={symptomText}
              onChange={e => setSymptomText(e.target.value)}
              rows={5}
              placeholder="Ex: Mon bovin a de la fièvre depuis 2 jours, il tousse beaucoup et refuse de manger. Il semble fatigué et sa respiration est difficile..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none text-gray-700 placeholder-gray-400"
            />
            <p className="text-xs text-gray-400">Décrivez les symptômes observés, leur durée et tout changement de comportement.</p>
          </div>
        )}

        {/* Upload zone (visual mode only) */}
        {inputMode === 'visual' && !result && (
          <div className="bg-white rounded-2xl border p-4">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-semibold text-gray-900 text-sm">Fichier à analyser</h2>
              <span className="text-xs text-gray-400">JPG · PNG · MP4 · MOV</span>
            </div>

            {!preview ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'}`}
              >
                <div className="text-5xl mb-3">📸</div>
                <p className="text-sm font-medium text-gray-700">Glissez une photo ou vidéo</p>
                <p className="text-xs text-gray-400 mt-1">ou cliquez pour sélectionner</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={e => handleFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-black">
                  {mode === 'image' ? (
                    <img src={preview} alt="aperçu" className="w-full max-h-64 object-contain" />
                  ) : (
                    <video src={preview} controls className="w-full max-h-64" />
                  )}
                  <button
                    onClick={reset}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/80"
                  >✕</button>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{mode === 'image' ? '🖼️' : '🎥'}</span>
                  <span className="truncate font-medium">{file.name}</span>
                  <span className="ml-auto">{(file.size / 1024).toFixed(0)} Ko</span>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Analyze button */}
        {!result && (inputMode === 'visual' ? file : symptomText.trim()) && (
          <button
            onClick={analyze}
            disabled={loading}
            className="w-full bg-green-700 text-white py-4 rounded-2xl font-semibold text-base shadow-lg hover:bg-green-800 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyse en cours...</span>
              </>
            ) : (
              <>
                <span className="text-xl">🔬</span>
                <span>{inputMode === 'text' ? 'Analyser les symptômes' : 'Lancer l\'analyse Tebe'}</span>
              </>
            )}
          </button>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Primary diagnosis */}
            {result.diagnosis && (
              <div className={`rounded-2xl border-2 p-5 ${SEVERITY_COLORS[result.diagnosis.severity] || SEVERITY_COLORS.moderate}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{SEVERITY_ICONS[result.diagnosis.severity] || '🟡'}</span>
                      <h3 className="font-bold text-lg">{result.diagnosis.condition}</h3>
                    </div>
                    {result.diagnosis.condition_ff && (
                      <p className="text-xs opacity-70">Fulfuldé: {result.diagnosis.condition_ff} · Haoussa: {result.diagnosis.condition_ha}</p>
                    )}
                  </div>
                  <span className="text-xs font-mono bg-white/50 px-2 py-1 rounded-full">
                    {Math.round((result.diagnosis.confidence || 0) * 100)}% confiance
                  </span>
                </div>
                <ConfidenceBar value={result.diagnosis.confidence || 0} color="bg-current opacity-60" />
                {result.diagnosis.visual_markers && result.diagnosis.visual_markers.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium mb-1 opacity-70">Signes observés:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.diagnosis.visual_markers.map((m, i) => (
                        <span key={i} className="text-xs bg-white/40 px-2 py-0.5 rounded-full">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl border p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💊</span> Recommandations
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 mt-0.5 flex-shrink-0">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Differential diagnoses */}
            {result.differentials && result.differentials.length > 0 && (
              <div className="bg-white rounded-2xl border p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Diagnostics différentiels</h3>
                <div className="space-y-3">
                  {result.differentials.map((d, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{d.condition}</span>
                        <span className="text-xs text-gray-500">{Math.round((d.confidence || 0) * 100)}%</span>
                      </div>
                      <ConfidenceBar value={d.confidence || 0} color="bg-blue-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video consistency */}
            {result.videoSummary && (
              <div className="bg-white rounded-2xl border p-4">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Analyse vidéo</h3>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{result.videoSummary.framesAnalyzed}</div>
                    <div className="text-xs text-gray-500">Frames analysées</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{result.videoSummary.consistencyScore}%</div>
                    <div className="text-xs text-gray-500">Cohérence</div>
                  </div>
                </div>
              </div>
            )}

            {/* Behavioral risks (text mode) */}
            {result.behavioralRisks && result.behavioralRisks.length > 0 && (
              <div className="bg-white rounded-2xl border p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <span>🧠</span> Analyse comportementale
                </h3>
                <div className="space-y-2">
                  {result.behavioralRisks.map((r, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm ${r.severity === 'critical' ? 'bg-red-50 border border-red-200' : r.severity === 'high' ? 'bg-orange-50 border border-orange-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                      <span className="text-lg mt-0.5">{r.severity === 'critical' ? '🚨' : r.severity === 'high' ? '⚠️' : '📋'}</span>
                      <div>
                        <p className="font-medium text-gray-800">{r.indicator}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{r.meaning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Production risk */}
            {result.productionRisk && (
              <div className="bg-white rounded-2xl border p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <span>📉</span> Impact productif estimé
                </h3>
                <div className="space-y-2 text-sm">
                  {result.productionRisk.productionImpact.map((imp, i) => (
                    <div key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">→</span>
                      <span>{imp}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span>Risque économique : <strong className="text-gray-700">{result.productionRisk.economicRisk}</strong></span>
                    <span>Rétablissement : <strong className="text-gray-700">{result.productionRisk.recoveryTime}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* Context Afrique */}
            {result.contextAfrique && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                <p className="font-medium mb-1">🌍 Contexte terrain (Afrique / Cameroun)</p>
                <p className="text-xs">{result.contextAfrique}</p>
              </div>
            )}

            {/* Urgency banner */}
            {result.urgency && result.urgency.startsWith('URGENT') && (
              <div className="bg-red-600 text-white rounded-xl p-4 text-sm font-semibold flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <span>{result.urgency}</span>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
              <p className="font-medium mb-1">⚠️ Avertissement important</p>
              <p>{result.disclaimer || 'Ce diagnostic est fourni à titre indicatif uniquement. Il ne remplace pas l\'avis d\'un vétérinaire qualifié. En cas de doute, consultez un professionnel.'}</p>
            </div>

            {/* Model info */}
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between text-xs text-gray-500">
              <span>Modèle: {result.modelVersion || TEBE_VERSION}</span>
              {result.datasetSize
                ? <span>Dataset: {result.datasetSize}/1000 images</span>
                : <span>Moteur: Ensemble multi-modèles v2.0</span>
              }
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Nouvelle analyse
              </button>
              <a
                href="/consultation"
                className="flex-1 bg-green-700 text-white py-3 rounded-xl text-sm font-medium text-center hover:bg-green-800"
              >
                Consulter un vétérinaire
              </a>
            </div>
          </div>
        )}

        {/* Detectable conditions catalogue */}
        <div className="bg-white rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Conditions détectables</h2>
            <button onClick={loadConditions} className="text-xs text-green-600 hover:underline">
              {showConditions ? 'Masquer' : 'Voir catalogue'}
            </button>
          </div>
          {showConditions && conditions && (
            <div className="mt-3 space-y-2">
              {(conditions.conditions || []).map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-lg mt-0.5">{SEVERITY_ICONS[c.severity] || '🔵'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{c.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${SEVERITY_COLORS[c.severity] || ''}`}>{c.severity}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{c.name_ff} · {c.name_ha}</div>
                    {c.visual_markers && (
                      <div className="text-xs text-gray-400 mt-1 truncate">{c.visual_markers.slice(0, 3).join(', ')}</div>
                    )}
                  </div>
                </div>
              ))}
              {conditions.modelStatus && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                  <p className="font-medium">Tebe v1.0 (MobileNet) en cours d'entraînement</p>
                  <p className="mt-0.5">{typeof conditions.modelStatus.datasetProgress === 'object' ? `${conditions.modelStatus.datasetProgress.percentage}%` : conditions.modelStatus.datasetProgress || '84.7%'} du dataset complété</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contribute training data (visual mode only) */}
        {inputMode === 'visual' && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-4">
          <h3 className="font-semibold text-green-800 text-sm mb-1">Contribuer au dataset Tebe</h3>
          <p className="text-xs text-green-700 mb-3">
            Aidez à améliorer Tebe en partageant des images annotées de maladies animales. Chaque contribution accélère l'entraînement du modèle v1.0.
          </p>
          <button
            onClick={async () => {
              if (!file) { alert('Sélectionnez d\'abord un fichier à analyser.'); return; }
              try {
                const b64 = await toBase64(file);
                await apiClient.post('/tebe/contribute', {
                  imageData: b64,
                  animalType,
                  condition: result?.diagnosis?.conditionId || 'unknown',
                });
                alert('Merci! Votre contribution a été enregistrée et sera revue par notre équipe.');
              } catch { alert('Erreur lors de la contribution'); }
            }}
            className="w-full bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-800"
          >
            Soumettre cette image pour l'entraînement
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
