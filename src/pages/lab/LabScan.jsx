import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';
const PRIMARY_L = '#f0fdf4';
const PRIMARY_B = '#bbf7d0';
const API_BASE  = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ANIMAL_TYPES = [
  { value: 'cattle',  label: '🐄 Bovin' },
  { value: 'goat',    label: '🐐 Caprin' },
  { value: 'sheep',   label: '🐑 Ovin' },
  { value: 'pig',     label: '🐷 Porcin' },
  { value: 'poultry', label: '🐔 Volaille' },
  { value: 'other',   label: '🐾 Autre' },
];

const SEVERITY_CONFIG = {
  critical: { label: 'Critique', color: 'bg-red-100 text-red-700 border-red-200',         dot: 'bg-red-500' },
  severe:   { label: 'Élevé',   color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  high:     { label: 'Élevé',   color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  moderate: { label: 'Modéré',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  medium:   { label: 'Modéré',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  low:      { label: 'Faible',  color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400' },
  healthy:  { label: 'Sain',    color: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-500' },
  none:     { label: 'Sain',    color: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-500' },
};

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.moderate;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function LabScan() {
  const { user, token } = useLabAuth();

  const [animalType, setAnimalType]     = useState('cattle');
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading]               = useState(false);
  const [loadingStage, setLoadingStage]     = useState(null);
  const [autoClassifying, setAutoClassifying] = useState(false);
  const [preClassified, setPreClassified]   = useState(false);
  const [result, setResult]                 = useState(null);
  const [error, setError]                   = useState('');
  const [saving, setSaving]                 = useState(false);
  const [saveMsg, setSaveMsg]               = useState('');
  const [classification, setClassification] = useState(null);
  const [history, setHistory]           = useState([]);
  const [histLoading, setHistLoading]   = useState(true);
  const fileRef = useRef(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API_BASE}/api/lab/scans`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => setHistory(d.scans || []))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, [token]);

  // ── Auto-classification dès le chargement de l'image ─────────────────────────
  const autoClassify = async (imageBase64) => {
    setAutoClassifying(true);
    setClassification(null);
    setPreClassified(false);
    try {
      const res = await fetch(`${API_BASE}/api/lab/scans/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ imageBase64 }),
      });
      const classif = await res.json();
      setClassification(classif);
      setPreClassified(true);

      // Humain détecté → archiver immédiatement sans attendre le clic
      if (classif.isHuman) {
        try {
          await fetch(`${API_BASE}/api/lab/scans/archive-rejection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ classificationResult: classif }),
          });
          const hRes  = await fetch(`${API_BASE}/api/lab/scans`, { headers: authHeaders });
          const hData = await hRes.json();
          setHistory(hData.scans || []);
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[AutoClassify]', err.message);
    } finally {
      setAutoClassifying(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);
    setError('');
    setSaveMsg('');
    setClassification(null);
    setPreClassified(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result;
      setImagePreview(preview);
      autoClassify(preview.split(',')[1]);
    };
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
    setSaveMsg('');
    setClassification(null);
    setResult(null);

    try {
      const imageBase64 = imagePreview ? imagePreview.split(',')[1] : null;

      // ── ÉTAPE 1 : Classification (déjà faite à l'upload si image présente) ──
      let classif = preClassified ? classification : null;
      if (imageBase64 && !preClassified) {
        setLoadingStage('classification');
        const classifRes = await fetch(`${API_BASE}/api/lab/scans/classify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ imageBase64 }),
        });
        classif = await classifRes.json();
        setClassification(classif);
      }

      // Humain détecté → on s'arrête (déjà archivé si via auto-classify)
      if (classif?.isHuman) {
        setError('Analyse interrompue : être humain détecté. MokineLab ne traite que les animaux.');
        setLoading(false);
        setLoadingStage(null);
        return;
      }

      // Objet non-animal détecté (et ce n'est pas un fallback/mode sans image)
      if (classif?.isAnimal === false && !classif?.noImage && !classif?.fallback) {
        const detected = classif.topDetection ? `Objet identifié : "${classif.topDetection}".` : 'Aucun animal reconnu.';
        setError(`Image rejetée : ${detected} Veuillez soumettre une photo claire d'un animal.`);
        setLoading(false);
        setLoadingStage(null);
        return;
      }

      // ── ÉTAPE 2 : Diagnostic Tebe IA ──
      setLoadingStage('diagnostic');
      const r = await fetch(`${API_BASE}/api/tebe/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ animalType, imageBase64 }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erreur analyse');
      setResult(data);

      // ── ÉTAPE 3 : Sauvegarde (avec la classification déjà faite) ──
      setSaving(true);
      const saveRes = await fetch(`${API_BASE}/api/lab/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ animalType, imageBase64, result: data, preClassification: classif }),
      });
      const saveData = await saveRes.json();
      // Si pas d'image, récupérer la classification retournée par le serveur
      if (!classif && saveData.scan?.classificationResult) {
        setClassification(saveData.scan.classificationResult);
      }
      setSaveMsg('Scan sauvegardé dans votre historique.');

      const hRes  = await fetch(`${API_BASE}/api/lab/scans`, { headers: authHeaders });
      const hData = await hRes.json();
      setHistory(hData.scans || []);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'analyse. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
      setSaving(false);
      setLoadingStage(null);
    }
  };

  const reset = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError('');
    setSaveMsg('');
    setClassification(null);
    setLoadingStage(null);
    setPreClassified(false);
    setAutoClassifying(false);
  };

  const severityColor = {
    critical: 'text-red-600', severe: 'text-orange-600', high: 'text-orange-600',
    moderate: 'text-yellow-600', medium: 'text-yellow-600',
    low: 'text-blue-600', healthy: 'text-green-600', none: 'text-green-600',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar compacte ── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 shadow-sm flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: PRIMARY }}>M</div>
          <span className="font-bold text-gray-800">
            Mokine<span style={{ color: PRIMARY }}>Lab</span>
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <Link to="/mokinelab/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            🏠 Accueil
          </Link>
          <Link to="/mokinelab/scan"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: PRIMARY }}>
            📸 Scan Tebe IA
          </Link>
          <Link to="/mokinelab/questionnaire"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            💬 Questionnaire IA
          </Link>
        </nav>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Link to="/mokinelab/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="font-semibold text-gray-800">📸 Scan Tebe IA</h1>
          </div>
          <div className="text-xs text-gray-400 hidden sm:block">
            {user?.name} · {user?.role}
          </div>
        </header>

        <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-2"
              style={{ background: PRIMARY_B, color: PRIMARY_D }}>
              🧬 Propulsé par Tebe IA v0.3 · Accès membre
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Diagnostic visuel Tebe IA</h2>
            <p className="text-gray-500 text-sm mt-1">Vos scans sont sauvegardés automatiquement dans votre historique.</p>
          </div>

          {/* Interface de scan */}
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden mb-8">
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
              {/* Upload */}
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
                    <img src={imagePreview} alt="preview"
                      className={`w-full h-56 object-cover rounded-xl transition-all ${classification?.isHuman ? 'opacity-60 grayscale' : ''}`} />

                    {/* Overlay pendant l'analyse automatique */}
                    {autoClassifying && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                        <p className="text-white text-xs font-semibold">Identification en cours…</p>
                      </div>
                    )}

                    {/* Badge résultat sur la photo */}
                    {classification && !autoClassifying && (
                      <div className={`absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${
                        classification.isHuman   ? 'bg-red-500'
                        : classification.isAnimal ? 'bg-green-600'
                        : 'bg-orange-500'
                      }`}>
                        {classification.isHuman
                          ? '🚫 Humain'
                          : classification.isAnimal
                            ? `✅ ${classification.detectedIcon || '🐾'} ${classification.detectedLabel || 'Animal'}`
                            : '⚠️ Non identifié'}
                      </div>
                    )}

                    <button onClick={reset}
                      className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-gray-500 hover:text-red-500 text-sm">
                      ✕
                    </button>
                    <p className="text-xs text-gray-400 mt-2 text-center truncate">{imageFile?.name}</p>
                  </div>
                )}

                {/* Bandeau de rejet si image non-animale */}
                {classification && !classification.isAnimal && !classification.isHuman && !classification.noImage && !classification.fallback && !autoClassifying && (
                  <div className="mt-4 rounded-xl border-2 border-orange-200 bg-orange-50 p-3 text-sm">
                    <p className="font-bold text-orange-700 mb-0.5">
                      ⚠️ Image non valide — aucun animal détecté
                    </p>
                    <p className="text-orange-600 text-xs">
                      {classification.topDetection
                        ? `Objet identifié : "${classification.topDetection}" (${(classification.confidence * 100).toFixed(0)}% confiance).`
                        : 'Aucun objet animal reconnu dans cette image.'}
                      {' '}Veuillez soumettre une photo claire d'un animal (bovin, caprin, ovin, porcin, volaille…).
                    </p>
                  </div>
                )}

                <button
                  onClick={runScan}
                  disabled={
                    loading || autoClassifying || classification?.isHuman ||
                    (classification?.isAnimal === false && !classification?.noImage && !classification?.fallback)
                  }
                  className="mt-4 w-full py-3 rounded-xl font-semibold text-white text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: classification?.isHuman
                      ? '#dc2626'
                      : (classification?.isAnimal === false && !classification?.noImage && !classification?.fallback)
                        ? '#ea580c'
                        : loading || autoClassifying
                          ? '#6ee7a0'
                          : `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})`,
                  }}>
                  {autoClassifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Identification de l'image…
                    </span>
                  ) : loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {loadingStage === 'diagnostic' ? 'Diagnostic en cours…' : 'Analyse en cours…'}
                    </span>
                  ) : classification?.isHuman ? (
                    '🚫 Image refusée — être humain détecté'
                  ) : (classification?.isAnimal === false && !classification?.noImage && !classification?.fallback) ? (
                    '🚫 Image refusée — aucun animal détecté'
                  ) : (
                    '🔍 Lancer le diagnostic Tebe IA'
                  )}
                </button>

                {!imagePreview && (
                  <button onClick={runScan}
                    className="mt-2 w-full py-2.5 rounded-xl text-sm font-medium border transition-all hover:bg-green-50"
                    style={{ borderColor: PRIMARY, color: PRIMARY }}>
                    Tester sans photo (demo)
                  </button>
                )}

                {error && <p className="mt-3 text-xs text-red-500 text-center">{error}</p>}
                {saveMsg && <p className="mt-3 text-xs text-center font-medium" style={{ color: PRIMARY }}>{saveMsg}</p>}
                {saving && <p className="mt-2 text-xs text-center text-gray-400">Sauvegarde…</p>}
              </div>

              {/* Panneau résultat (classification + diagnostic) */}
              <div className="p-6 overflow-y-auto max-h-[700px] space-y-4">

                {/* État vide */}
                {!classification && !result && !loading && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <div className="text-5xl mb-4">🔬</div>
                    <p className="text-gray-400 text-sm font-medium">Le résultat apparaîtra ici</p>
                    <p className="text-gray-300 text-xs mt-1">Uploadez une photo et lancez l'analyse</p>
                  </div>
                )}

                {/* Chargement avec étape */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4" />
                    {loadingStage === 'classification' && (
                      <>
                        <p className="font-semibold text-sm" style={{ color: PRIMARY }}>Analyse de l'image…</p>
                        <p className="text-gray-400 text-xs mt-1">Détection du contenu via DETR-ResNet-50</p>
                      </>
                    )}
                    {loadingStage === 'diagnostic' && (
                      <>
                        <p className="font-semibold text-sm" style={{ color: PRIMARY }}>Diagnostic Tebe IA en cours…</p>
                        <p className="text-gray-400 text-xs mt-1">Analyse pathologique de l'animal</p>
                      </>
                    )}
                    {!loadingStage && (
                      <p className="font-semibold text-sm text-gray-500">Traitement en cours…</p>
                    )}
                  </div>
                )}

                {/* ── BLOC CLASSIFICATION (toujours en premier) ── */}
                {classification && !loading && (() => {
                  const isHuman   = classification.isHuman;
                  const isAnimal  = classification.isAnimal;
                  const isUnknown = !isHuman && !isAnimal && !classification.noImage;
                  const conf      = classification.confidence ? `${(classification.confidence * 100).toFixed(0)}%` : null;

                  return (
                    <div className={`rounded-2xl border-2 p-4 ${
                      isHuman   ? 'bg-red-50 border-red-300'
                      : isAnimal ? 'bg-green-50 border-green-300'
                      : isUnknown ? 'bg-orange-50 border-orange-200'
                      : 'bg-gray-50 border-gray-200'
                    }`}>
                      {/* En-tête */}
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wide"
                          style={{ color: isHuman ? '#dc2626' : isAnimal ? PRIMARY_D : '#92400e' }}>
                          {isHuman ? '🚫 Image refusée' : isAnimal ? '✅ Image acceptée' : isUnknown ? '⚠️ Animal non identifié' : '📷 Sans image'}
                        </p>
                        <span className="text-[10px] text-gray-400">{classification.modelUsed}</span>
                      </div>

                      {/* Sujet principal */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 ${
                          isHuman ? 'bg-red-100' : isAnimal ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                          {isHuman ? '👤' : isAnimal ? (classification.detectedIcon || '🐾') : '❓'}
                        </div>
                        <div className="flex-1">
                          <p className={`font-extrabold text-xl leading-tight ${
                            isHuman ? 'text-red-700' : isAnimal ? 'text-green-800' : 'text-orange-700'
                          }`}>
                            {isHuman
                              ? 'Être humain'
                              : isAnimal
                                ? (classification.detectedLabel || classification.detectedSpecies || 'Animal')
                                : (classification.topDetection ? `"${classification.topDetection}"` : 'Non identifié')}
                          </p>
                          {conf && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${(classification.confidence * 100).toFixed(0)}%`,
                                    background: isHuman ? '#dc2626' : PRIMARY,
                                  }} />
                              </div>
                              <span className={`text-xs font-bold ${isHuman ? 'text-red-600' : 'text-green-700'}`}>{conf}</span>
                            </div>
                          )}
                          {isAnimal && classification.speciesGroup && (
                            <p className="text-xs text-green-600 mt-0.5 capitalize">{classification.speciesGroup}</p>
                          )}
                        </div>
                      </div>

                      {/* Message clair */}
                      <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
                        isHuman ? 'bg-red-100 text-red-800'
                        : isAnimal ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                      }`}>
                        {classification.message}
                      </div>

                      {/* Explication (si dispo) */}
                      {classification.explanation && (
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{classification.explanation}</p>
                      )}

                      {/* Tous les objets détectés */}
                      {classification.allDetections?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Objets détectés</p>
                          <div className="flex flex-wrap gap-1.5">
                            {classification.allDetections.slice(0, 5).map((d, i) => (
                              <span key={i} className="text-[10px] bg-white/70 border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                                {d.label} <span className="font-bold">{(d.score * 100).toFixed(0)}%</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Temps traitement */}
                      {classification.processingMs > 0 && (
                        <p className="text-[10px] text-gray-400 mt-2">
                          Analyse : {classification.processingMs}ms
                          {classification.fallback && ' · mode hors-ligne (fallback)'}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* ── DIAGNOSTIC TEBE IA ── */}
                {result && !loading && !classification?.isHuman && (
                  <div className="space-y-4 pt-1">
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

                {/* Bouton reset si humain ou non-animal détecté */}
                {(classification?.isHuman || (classification?.isAnimal === false && !classification?.noImage && !classification?.fallback)) && !loading && (
                  <button onClick={reset}
                    className={`w-full py-2.5 text-xs font-semibold rounded-xl border transition ${
                      classification?.isHuman
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                    }`}>
                    {classification?.isHuman
                      ? 'Retour — essayer avec une photo d\'animal'
                      : 'Retour — choisir une autre image'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Historique des scans */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Historique de mes scans</h3>
              <span className="text-xs text-gray-400">{history.length} scan(s)</span>
            </div>

            {histLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔬</div>
                <p className="text-gray-400 text-sm">Aucun scan enregistré pour le moment.</p>
                <p className="text-gray-300 text-xs mt-1">Lancez votre premier diagnostic ci-dessus.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(s => {
                  const isRejected = s.status === 'rejected';
                  const detectedLabel = s.classificationResult?.detectedLabel;
                  const icon = isRejected ? '🚫' : (s.classificationResult?.detectedIcon || '🐾');
                  return (
                    <div key={s.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        isRejected
                          ? 'border-red-100 bg-red-50/50 hover:border-red-200'
                          : 'border-gray-100 hover:border-green-200 hover:bg-green-50'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                        isRejected ? 'bg-red-100' : ''
                      }`}
                        style={isRejected ? {} : { background: PRIMARY_L }}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isRejected ? 'text-red-700' : 'text-gray-800'}`}>
                          {isRejected
                            ? `Image refusée — être humain détecté ${s.classificationResult?.confidence ? `(${(s.classificationResult.confidence * 100).toFixed(0)}% confiance)` : ''}`
                            : (s.result?.diagnosis?.condition || 'Diagnostic IA')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isRejected
                            ? 'Rejet automatique'
                            : (ANIMAL_TYPES.find(a => a.value === s.animalType)?.label || s.animalType)}
                          {' · '}
                          {new Date(s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' · '}
                          {new Date(s.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isRejected ? (
                          <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full border border-red-200">
                            Refusé
                          </span>
                        ) : (
                          <>
                            {s.result?.diagnosis?.severity && <SeverityBadge severity={s.result.diagnosis.severity} />}
                            {s.result?.diagnosis?.confidence != null && (
                              <span className="text-xs font-bold" style={{ color: PRIMARY }}>
                                {Math.round(s.result.diagnosis.confidence * 100)}%
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <footer className="py-4 px-6 text-center text-xs text-gray-400 border-t border-gray-100">
          © {new Date().getFullYear()} MokineLab · Laboratoire IA vétérinaire Mokine
        </footer>
      </div>
    </div>
  );
}
