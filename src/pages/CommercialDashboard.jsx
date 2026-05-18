import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { payments } from '../API.js';

const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';
const PRIMARY_L = '#f0fdf4';
const PRIMARY_B = '#bbf7d0';

const PLAN_COLORS = {
  starter: { bg: PRIMARY_L, border: PRIMARY_B, text: PRIMARY_D, badge: 'Starter' },
  pro:     { bg: '#fef9c3', border: '#fde68a', text: '#92400e', badge: 'Pro' },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy}
      className="text-xs px-2.5 py-1 rounded font-semibold transition-all flex-shrink-0"
      style={{ background: copied ? PRIMARY_B : '#f3f4f6', color: copied ? PRIMARY_D : '#374151' }}>
      {copied ? '✓ Copié' : 'Copier'}
    </button>
  );
}

function UsageBar({ used, max }) {
  const pct = max ? Math.min((used / max) * 100, 100) : 0;
  const color = pct > 90 ? '#dc2626' : pct > 70 ? '#d97706' : PRIMARY;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{used.toLocaleString()} utilisés</span>
        <span className="font-semibold" style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">{(max - used).toLocaleString()} restantes aujourd'hui</p>
    </div>
  );
}

export default function CommercialDashboard() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [apiKey, setApiKey]   = useState(location.state?.apiKey || '');
  const [inputKey, setInputKey] = useState('');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('mokine_api_key');
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    if (apiKey) {
      sessionStorage.setItem('mokine_api_key', apiKey);
      load(apiKey);
    }
  }, [apiKey]);

  const load = async (key) => {
    setLoading(true);
    setError('');
    try {
      const res = await payments.getCommercialDashboard(key);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Clé API invalide ou expirée.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeySubmit = (e) => {
    e.preventDefault();
    if (inputKey.trim()) setApiKey(inputKey.trim());
  };

  // ─── Page de connexion par clé ─────────────────────────────────────────────
  if (!apiKey || error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: PRIMARY_L }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-3" style={{ background: PRIMARY }}>🔑</div>
            <h1 className="text-xl font-bold text-gray-900">Tableau de bord API</h1>
            <p className="text-sm text-gray-500 mt-1">Entrez votre clé API pour accéder à votre espace</p>
          </div>

          <form onSubmit={handleKeySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Votre clé API</label>
              <input
                value={inputKey} onChange={e => setInputKey(e.target.value)}
                placeholder="mk_live_xxxxxxxxxxxxxxxxxxxx"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
            </div>
            <button type="submit"
              className="w-full py-3 text-white font-bold rounded-xl text-sm transition-all"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})` }}>
              Accéder à mon espace →
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-gray-400 space-y-1">
            <p>Pas encore de clé ? <a href="/mokinelab/commercial" className="underline" style={{ color: PRIMARY }}>Souscrire un plan</a></p>
            <p><a href="/mokinelab/docs" className="underline text-gray-400">Documentation API</a></p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Chargement ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PRIMARY_L }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-500">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const planColor = PLAN_COLORS[data.plan] || PLAN_COLORS.starter;
  const daysLeftPct = data.expiresAt ? Math.min((data.daysLeft / 30) * 100, 100) : 0;
  const isTestMode = data.isTestMode;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/mokinelab')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: PRIMARY }}>M</div>
              <span className="font-bold text-gray-800 hidden sm:inline">MokineLab</span>
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-600">Tableau de bord</span>
          </div>
          <div className="flex items-center gap-3">
            {isTestMode && (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-700">
                🟡 Mode Test
              </span>
            )}
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: planColor.bg, color: planColor.text }}>
              {data.planLabel}
            </span>
            <button onClick={() => { sessionStorage.removeItem('mokine_api_key'); setApiKey(''); setData(null); }}
              className="text-xs text-gray-400 hover:text-red-500 transition">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Bienvenue */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonjour, {data.email?.split('@')[0]} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.organization} · Plan {data.planLabel}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Plan actif', value: data.planLabel, sub: 'Abonnement' },
            { label: 'Jours restants', value: data.daysLeft, sub: 'Avant expiration' },
            { label: 'Utilisées aujourd\'hui', value: data.usage.today.toLocaleString(), sub: `/ ${data.usage.dailyLimit.toLocaleString()} max` },
            { label: 'Reste aujourd\'hui', value: data.usage.remaining.toLocaleString(), sub: 'Requêtes disponibles' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 mb-1">{k.label}</p>
              <p className="text-xl font-extrabold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Clés API */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-800">Vos clés API</h2>

            {[
              { label: 'Clé de Production', key: data.apiKey,  tag: '🔴 Production', warning: 'À stocker dans vos variables d\'environnement.' },
              { label: 'Clé de Test (sandbox)', key: data.testKey, tag: '🟢 Sandbox',    warning: 'Données fictives, quota illimité.' },
            ].map(k => (
              <div key={k.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-600">{k.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{k.tag}</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-900 text-green-400 font-mono text-xs px-3 py-2 rounded-lg overflow-x-auto">
                    {showKey ? k.key : k.key?.replace(/(?<=.{12}).(?=.{4})/g, '•')}
                  </code>
                  <CopyButton text={k.key} />
                </div>
                <p className="text-xs text-gray-400 mt-1">⚠️ {k.warning}</p>
              </div>
            ))}

            <button onClick={() => setShowKey(s => !s)}
              className="text-xs underline" style={{ color: PRIMARY }}>
              {showKey ? 'Masquer les clés' : 'Afficher les clés complètes'}
            </button>

            <div className="rounded-lg p-3 text-xs" style={{ background: PRIMARY_L }}>
              <p className="font-semibold mb-1" style={{ color: PRIMARY_D }}>Utilisation :</p>
              <code className="text-gray-700">X-API-Key: {data.apiKey?.slice(0, 18)}...</code>
            </div>
          </div>

          {/* Usage + Expiration */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-4">Usage du jour</h2>
              <UsageBar used={data.usage.today} max={data.usage.dailyLimit} />
              <p className="text-xs text-gray-400 mt-2">Rate limit : {data.usage.rateLimit} req/min</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-4">Expiration abonnement</h2>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{data.daysLeft} jours restants</span>
                <span>{data.expiresAt ? new Date(data.expiresAt).toLocaleDateString('fr-FR') : '—'}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${daysLeftPct}%`, background: daysLeftPct < 25 ? '#dc2626' : PRIMARY }} />
              </div>
              {data.daysLeft <= 7 && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-xs text-red-700 font-semibold">⚠️ Votre abonnement expire bientôt.</p>
                  <a href="/mokinelab/commercial" className="text-xs underline text-red-600">Renouveler →</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Endpoints disponibles */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">Endpoints disponibles — Plan {data.planLabel}</h2>
          <div className="space-y-2">
            {(data.endpoints || []).map(ep => {
              const [method, ...rest] = ep.trim().split(/\s+/);
              const path = rest.join(' ');
              const colors = { GET: 'bg-blue-100 text-blue-700', POST: 'bg-green-100 text-green-700' };
              return (
                <div key={ep} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded flex-shrink-0 ${colors[method] || 'bg-gray-100 text-gray-600'}`}>{method}</span>
                  <code className="text-sm font-mono text-gray-700">{path}</code>
                </div>
              );
            })}
          </div>
          {data.plan === 'starter' && (
            <div className="mt-4 p-3 rounded-lg border" style={{ background: '#fef9c3', borderColor: '#fde68a' }}>
              <p className="text-xs text-yellow-800">
                🚀 Passez au plan <strong>Pro</strong> pour débloquer le batch-analyze, les analytics et les webhooks.{' '}
                <a href="/mokinelab/commercial" className="underline">Upgrader →</a>
              </p>
            </div>
          )}
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">Quick Start</h2>
          <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs overflow-x-auto">
            <p className="text-gray-400 mb-2"># 1. Diagnostic visuel d'un animal</p>
            <p className="text-blue-300">curl -X POST https://api.mokine.cm/api/tebe/analyze-image \</p>
            <p className="text-blue-300 ml-4">-H "X-API-Key: <span className="text-yellow-300">{isTestMode ? data.testKey : data.apiKey}</span>" \</p>
            <p className="text-blue-300 ml-4">-H "Content-Type: application/json" \</p>
            <p className="text-blue-300 ml-4">{`-d '{"animalType":"cattle","imageBase64":"<BASE64>"}'`}</p>
            <p className="text-gray-400 mt-3 mb-2"># 2. Catalogue des maladies détectables</p>
            <p className="text-blue-300">curl https://api.mokine.cm/api/tebe/conditions \</p>
            <p className="text-blue-300 ml-4">-H "X-API-Key: <span className="text-yellow-300">{isTestMode ? data.testKey : data.apiKey}</span>"</p>
          </div>
          <div className="mt-3 flex gap-3">
            <a href="/mokinelab/docs" className="text-sm font-semibold hover:opacity-80 transition" style={{ color: PRIMARY }}>
              📄 Documentation complète →
            </a>
            <span className="text-gray-300">|</span>
            <a href="mailto:contact@mokine.cm" className="text-sm text-gray-500 hover:text-gray-700 transition">
              💬 Support technique
            </a>
          </div>
        </div>

        {/* Infos compte */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">Informations du compte</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {[
              ['Email', data.email],
              ['Organisation', data.organization || '—'],
              ['Plan', data.planLabel],
              ['Statut', data.status === 'active' ? '✅ Actif' : data.status],
              ['Activé le', data.activatedAt ? new Date(data.activatedAt).toLocaleDateString('fr-FR') : '—'],
              ['Expire le', data.expiresAt ? new Date(data.expiresAt).toLocaleDateString('fr-FR') : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-400 text-xs">{k}</span>
                <span className="text-gray-800 text-xs font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-xs text-gray-400 mt-8">
        <p>MokineLab API Dashboard · <a href="/mokinelab" className="hover:text-green-600 transition">MokineLab</a> · <a href="/mokinelab/docs" className="hover:text-green-600 transition">Docs</a> · contact@mokine.cm</p>
      </footer>
    </div>
  );
}
