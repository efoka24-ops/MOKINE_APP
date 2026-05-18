import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ia as iaAPI, animals as animalsAPI } from '../API';
import { useAuth } from '../context/AuthContext';

const SEVERITY_CONFIG = {
  critical: { color: 'bg-red-100 border-red-400 text-red-800', icon: '🚨', label: 'CRITIQUE' },
  high: { color: 'bg-orange-100 border-orange-400 text-orange-800', icon: '⚠️', label: 'ÉLEVÉ' },
  medium: { color: 'bg-yellow-100 border-yellow-400 text-yellow-800', icon: '⚡', label: 'MODÉRÉ' },
  low: { color: 'bg-green-100 border-green-400 text-green-800', icon: '✅', label: 'FAIBLE' },
  unknown: { color: 'bg-gray-100 border-gray-400 text-gray-800', icon: '❓', label: 'INCONNU' },
};

export default function IaQuestionnaire() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('select'); // select | questionnaire | result
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [myAnimals, setMyAnimals] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, animRes] = await Promise.all([
          iaAPI.getQuestionnaire(),
          animalsAPI.getAll().catch(() => ({ data: [] }))
        ]);
        setQuestions(qRes.data.questions || []);
        setMyAnimals(animRes.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleAnswer = async (key, value) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      // All questions answered — analyze
      setLoading(true);
      try {
        const res = await iaAPI.analyze({ animalId: selectedAnimalId, answers: newAnswers });
        setResult(res.data.analysis);
        setStep('result');
      } catch (e) {
        console.error(e);
        setResult({ diagnosis: 'Erreur d\'analyse', severity: 'unknown', advice: 'Veuillez consulter un vétérinaire.', severityScore: 0, consultVet: true, urgency: 'Surveillance' });
        setStep('result');
      } finally {
        setLoading(false);
      }
    }
  };

  const restart = () => {
    setStep('select');
    setAnswers({});
    setCurrentQ(0);
    setResult(null);
    setSelectedAnimalId('');
  };

  const progress = questions.length > 0 ? ((currentQ / questions.length) * 100) : 0;
  const question = questions[currentQ];

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">←</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🧠 Diagnostic IA</h1>
          <p className="text-sm text-gray-500">Questionnaire symptomatique pour votre cheptel</p>
        </div>
      </div>

      {/* Step: Select animal */}
      {step === 'select' && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Pour quel animal?</h2>
          
          {myAnimals.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {myAnimals.map(animal => (
                <button key={animal.id} onClick={() => setSelectedAnimalId(animal.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedAnimalId === animal.id ? 'border-[#178A3B] bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="font-medium text-gray-800">{animal.name}</div>
                  <div className="text-xs text-gray-500">{animal.type} — {animal.breed || 'Race inconnue'}</div>
                  {animal.status !== 'healthy' && (
                    <div className="text-xs text-orange-600 mt-1">⚠️ {animal.status}</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <div className="text-4xl mb-2">🐄</div>
              <p className="text-sm">Aucun animal enregistré</p>
              <button onClick={() => navigate('/animals/add')} className="text-[#178A3B] text-sm mt-2 hover:underline">
                Ajouter un animal
              </button>
            </div>
          )}

          {myAnimals.length === 0 && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Ou analysez sans sélectionner d'animal:</p>
              <button onClick={() => { setSelectedAnimalId('demo'); setStep('questionnaire'); }}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors">
                Continuer sans animal spécifique
              </button>
            </div>
          )}

          {selectedAnimalId && selectedAnimalId !== 'demo' && (
            <button onClick={() => setStep('questionnaire')}
              className="w-full py-3 bg-[#178A3B] hover:bg-[#136B2F] text-white font-medium rounded-lg transition-colors">
              Commencer le questionnaire →
            </button>
          )}
        </div>
      )}

      {/* Step: Questionnaire */}
      {step === 'questionnaire' && question && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Question {currentQ + 1} / {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[#178A3B] h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-800">{question.text}</h2>

          {question.type === 'yesno' && (
            <div className="flex gap-3">
              <button onClick={() => handleAnswer(question.key, true)}
                className="flex-1 py-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400 text-green-700 font-medium rounded-xl transition-all text-lg">
                ✅ Oui
              </button>
              <button onClick={() => handleAnswer(question.key, false)}
                className="flex-1 py-4 bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-400 text-red-700 font-medium rounded-xl transition-all text-lg">
                ❌ Non
              </button>
            </div>
          )}

          {question.type === 'choice' && (
            <div className="space-y-2">
              {question.options?.map(option => (
                <button key={option} onClick={() => handleAnswer(question.key, option)}
                  className="w-full text-left py-3 px-4 bg-gray-50 hover:bg-green-50 border-2 border-gray-200 hover:border-[#178A3B] rounded-xl transition-all text-sm font-medium text-gray-700">
                  {option}
                </button>
              ))}
            </div>
          )}

          <button onClick={() => currentQ > 0 ? setCurrentQ(q => q - 1) : setStep('select')}
            className="text-sm text-gray-400 hover:text-gray-600">
            ← Question précédente
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-3 animate-pulse">🧠</div>
          <p className="text-gray-600 font-medium">Analyse en cours...</p>
          <p className="text-sm text-gray-400 mt-1">Calcul du diagnostic symptomatique</p>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && result && (
        <div className="space-y-4">
          {/* Severity header */}
          {(() => {
            const sev = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.unknown;
            return (
              <div className={`rounded-xl border-2 p-5 ${sev.color}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{sev.icon}</span>
                  <div>
                    <div className="text-xs font-semibold tracking-wider">{sev.label}</div>
                    <div className="text-xl font-bold">{result.diagnosis}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="opacity-70">Score: </span>
                    <strong>{result.severityScore}/10</strong>
                  </div>
                  <div>
                    <span className="opacity-70">Confiance: </span>
                    <strong>{result.confidence}%</strong>
                  </div>
                  <div className="ml-auto">
                    <span className="font-semibold">{result.urgency}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Advice */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-2">Recommandation</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{result.advice}</p>
          </div>

          {/* Score visualization */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Indice de gravité</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${result.severityScore >= 7 ? 'bg-red-500' : result.severityScore >= 4 ? 'bg-orange-400' : 'bg-green-400'}`}
                  style={{ width: `${(result.severityScore / 10) * 100}%` }}
                />
              </div>
              <span className="font-bold text-gray-700 text-lg">{result.severityScore}/10</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Bénin</span>
              <span>Modéré</span>
              <span>Critique</span>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            {result.consultVet && (
              <button onClick={() => navigate('/consultation')}
                className="w-full py-3 bg-[#178A3B] hover:bg-[#136B2F] text-white font-medium rounded-xl transition-colors">
                💬 Consulter un vétérinaire maintenant
              </button>
            )}
            <button onClick={restart}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
              🔄 Nouveau diagnostic
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
