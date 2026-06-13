import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';
const PRIMARY_L = '#f0fdf4';
const PRIMARY_B = '#bbf7d0';
const API_BASE  = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ANIMAL_TYPES = [
  { value: 'cattle',  label: '🐄 Bovin',    animalId: 'cattle_lab' },
  { value: 'goat',    label: '🐐 Caprin',   animalId: 'goat_lab' },
  { value: 'sheep',   label: '🐑 Ovin',     animalId: 'sheep_lab' },
  { value: 'pig',     label: '🐷 Porcin',   animalId: 'pig_lab' },
  { value: 'poultry', label: '🐔 Volaille', animalId: 'poultry_lab' },
  { value: 'other',   label: '🐾 Autre',    animalId: 'other_lab' },
];

const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    badge: 'bg-red-100 text-red-700',    label: 'Critique' },
  high:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700', label: 'Élevé' },
  medium:   { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700', label: 'Modéré' },
  low:      { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   badge: 'bg-blue-100 text-blue-700',   label: 'Faible' },
  unknown:  { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-800',   badge: 'bg-gray-100 text-gray-600',   label: 'Inconnu' },
};

export default function LabQuestionnaire() {
  const { user, token } = useLabAuth();

  const [animalType, setAnimalType] = useState('cattle');
  const [questions, setQuestions]   = useState([]);
  const [answers, setAnswers]       = useState({});
  const [currentQ, setCurrentQ]     = useState(0);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');
  const [history, setHistory]       = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [started, setStarted]       = useState(false);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/ia/questionnaire`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => setQuestions(d.questions || []))
      .catch(() => setError('Impossible de charger le questionnaire.'))
      .finally(() => setLoading(false));

    fetchHistory();
  }, [token]);

  const fetchHistory = () => {
    fetch(`${API_BASE}/api/lab/scans`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setHistory((d.scans || []).filter(s => s.type === 'questionnaire')))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  };

  const handleAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(q => q + 1), 300);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const selectedAnimal = ANIMAL_TYPES.find(a => a.value === animalType);
      const r = await fetch(`${API_BASE}/api/ia/analyze`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          animalId: selectedAnimal?.animalId || 'unknown_lab',
          answers,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erreur d\'analyse');
      setResult({ ...data, animalType, answers });

      await fetch(`${API_BASE}/api/lab/scans`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          animalType,
          result: data,
          type: 'questionnaire',
        }),
      });
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'analyse. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setAnswers({});
    setCurrentQ(0);
    setResult(null);
    setError('');
    setStarted(false);
  };

  const answeredCount = Object.keys(answers).length;
  const totalQ        = questions.length;
  const progress      = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;
  const allAnswered   = answeredCount >= totalQ && totalQ > 0;
  const currentQuestion = questions[currentQ];

  const sevCfg = SEVERITY_COLORS[result?.diagnosis?.severity] || SEVERITY_COLORS.unknown;

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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            📸 Scan Tebe IA
          </Link>
          <Link to="/mokinelab/questionnaire"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: PRIMARY }}>
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
            <h1 className="font-semibold text-gray-800">💬 Questionnaire Symptômes IA</h1>
          </div>
          <div className="text-xs text-gray-400 hidden sm:block">
            {user?.name} · {user?.role}
          </div>
        </header>

        <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-2"
              style={{ background: PRIMARY_B, color: PRIMARY_D }}>
              💬 IA Questionnaire v2.1 · Accès membre
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Questionnaire Symptômes IA</h2>
            <p className="text-gray-500 text-sm mt-1">
              Répondez à {totalQ || 10} questions et obtenez un pré-diagnostic IA instantané. Les résultats sont sauvegardés.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : result ? (
            /* ── Résultat ── */
            <div className={`bg-white rounded-2xl border p-6 mb-6 ${sevCfg.border}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Pré-diagnostic IA</p>
                  <h3 className={`text-xl font-extrabold ${sevCfg.text}`}>{result.diagnosis?.name || 'Diagnostic non concluant'}</h3>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0 ${sevCfg.badge}`}>
                  {sevCfg.label}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${result.diagnosis?.confidence || 0}%`, background: PRIMARY }} />
                </div>
                <span className="text-sm font-bold" style={{ color: PRIMARY }}>{result.diagnosis?.confidence || 0}%</span>
                <span className="text-xs text-gray-400">de confiance</span>
              </div>

              <div className={`rounded-xl p-4 mb-4 ${sevCfg.bg}`}>
                <p className={`text-sm font-semibold mb-1 ${sevCfg.text}`}>Recommandation</p>
                <p className={`text-sm leading-relaxed ${sevCfg.text}`}>{result.diagnosis?.advice}</p>
              </div>

              {result.diagnosis?.consultVet && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <span className="text-xl">⚕️</span>
                  <p className="text-sm font-semibold text-red-700">Consultation vétérinaire recommandée</p>
                </div>
              )}

              {result.diagnosis?.differentials?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Diagnostics différentiels</p>
                  <div className="space-y-1.5">
                    {result.diagnosis.differentials.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-gray-700">{d.name}</span>
                        <span className="font-medium" style={{ color: PRIMARY }}>{d.confidence}% confiance</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Réponses fournies — Espèce : {ANIMAL_TYPES.find(a => a.value === result.animalType)?.label}</p>
                <p className="text-xs text-gray-300 italic">Ce résultat est indicatif et ne remplace pas un examen vétérinaire.</p>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={reset}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all hover:bg-green-50"
                  style={{ borderColor: PRIMARY, color: PRIMARY }}>
                  Nouveau questionnaire
                </button>
                {result.diagnosis?.consultVet && (
                  <a href="/mokineveto"
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white text-center transition-all"
                    style={{ background: PRIMARY }}>
                    Consulter un vétérinaire →
                  </a>
                )}
              </div>
            </div>
          ) : !started ? (
            /* ── Écran de démarrage ── */
            <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6 text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Questionnaire Symptômes IA</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                Sélectionnez l'espèce de votre animal, puis répondez aux {totalQ} questions sur les symptômes observés.
                Le résultat sera sauvegardé dans votre historique.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Espèce animale</label>
                <div className="flex flex-wrap justify-center gap-2">
                  {ANIMAL_TYPES.map(t => (
                    <button key={t.value} onClick={() => setAnimalType(t.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
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

              <button onClick={() => setStarted(true)} disabled={!questions.length}
                className="px-8 py-3 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})` }}>
                Démarrer le questionnaire →
              </button>
            </div>
          ) : (
            /* ── Questionnaire interactif ── */
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              {/* Entête + progression */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {ANIMAL_TYPES.find(a => a.value === animalType)?.label} — Question {Math.min(currentQ + 1, totalQ)} / {totalQ}
                  </span>
                  <span className="text-xs font-bold" style={{ color: PRIMARY }}>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_D})` }} />
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Navigation rapide des questions */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {questions.map((q, i) => (
                  <button key={q.id}
                    onClick={() => setCurrentQ(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      answers[q.key] !== undefined
                        ? 'text-white'
                        : i === currentQ
                        ? 'border-2 text-gray-700 bg-gray-50'
                        : 'border border-gray-200 text-gray-400'
                    }`}
                    style={answers[q.key] !== undefined ? { background: PRIMARY } : i === currentQ ? { borderColor: PRIMARY } : {}}>
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Question courante */}
              {currentQuestion && (
                <div className="mb-6">
                  <p className="text-base font-semibold text-gray-800 mb-4">{currentQuestion.text}</p>

                  {currentQuestion.type === 'yesno' && (
                    <div className="flex gap-3">
                      {[{ val: true, label: 'Oui', icon: '✓' }, { val: false, label: 'Non', icon: '✗' }].map(opt => (
                        <button key={String(opt.val)}
                          onClick={() => handleAnswer(currentQuestion.key, opt.val)}
                          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                            answers[currentQuestion.key] === opt.val
                              ? 'text-white border-transparent'
                              : 'border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                          }`}
                          style={answers[currentQuestion.key] === opt.val ? { background: PRIMARY, borderColor: PRIMARY } : {}}>
                          <span className="mr-1">{opt.icon}</span> {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'choice' && (
                    <div className="grid grid-cols-2 gap-2">
                      {currentQuestion.options.map(opt => (
                        <button key={opt}
                          onClick={() => handleAnswer(currentQuestion.key, opt)}
                          className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border-2 text-left ${
                            answers[currentQuestion.key] === opt
                              ? 'text-white border-transparent'
                              : 'border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                          }`}
                          style={answers[currentQuestion.key] === opt ? { background: PRIMARY, borderColor: PRIMARY } : {}}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation entre questions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                  disabled={currentQ === 0}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition">
                  ← Précédent
                </button>

                {currentQ < totalQ - 1 ? (
                  <button onClick={() => setCurrentQ(q => Math.min(totalQ - 1, q + 1))}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                    Suivant →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={!allAnswered || submitting}
                    className="px-6 py-2.5 text-sm font-semibold rounded-xl text-white transition-all disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})` }}>
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyse…
                      </span>
                    ) : `Obtenir le diagnostic (${answeredCount}/${totalQ})`}
                  </button>
                )}
              </div>

              {!allAnswered && answeredCount > 0 && (
                <p className="text-xs text-center text-gray-400 mt-3">
                  {totalQ - answeredCount} question(s) sans réponse — cliquez sur les numéros pour y accéder
                </p>
              )}
            </div>
          )}

          {/* Historique questionnaires */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Historique des questionnaires</h3>
              <span className="text-xs text-gray-400">{history.length} résultat(s)</span>
            </div>

            {histLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-400 text-sm">Aucun questionnaire enregistré pour le moment.</p>
                <p className="text-gray-300 text-xs mt-1">Lancez votre premier questionnaire ci-dessus.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(s => {
                  const sc = SEVERITY_COLORS[s.result?.diagnosis?.severity] || SEVERITY_COLORS.unknown;
                  return (
                    <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: PRIMARY_L }}>💬</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {s.result?.diagnosis?.name || 'Diagnostic IA'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ANIMAL_TYPES.find(a => a.value === s.animalType)?.label || s.animalType}
                          {' · '}
                          {new Date(s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${sc.badge}`}>
                        {sc.label}
                      </span>
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
