import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { payments, publicApi } from '../API.js';

const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';
const PRIMARY_L = '#f0fdf4';
const PRIMARY_B = '#bbf7d0';

// Default plan config — used as fallback if /api/plans is unreachable
const DEFAULT_PLAN_CONFIG = {
  starter: {
    id: 'starter', label: 'Starter', price: 15000, currency: 'XAF', period: '/mois',
    badge: 'Populaire',
    limits: { requests: '10 000 req/jour', rate: '100 req/min', sla: '99%', support: 'Email 48h', keys: '1 clé' },
    features: ['10 000 requêtes/jour', 'Clé API dédiée', '6 endpoints + historique', 'SLA 99%', 'Support email'],
    endpoints: ['GET /tebe/stats', 'GET /tebe/conditions', 'POST /tebe/analyze-image', 'POST /tebe/analyze-video', 'POST /tebe/contribute', 'GET /tebe/history'],
  },
  pro: {
    id: 'pro', label: 'Pro', price: 45000, currency: 'XAF', period: '/mois',
    badge: null,
    limits: { requests: '100 000 req/jour', rate: '500 req/min', sla: '99,5%', support: 'Email 24h', keys: '3 clés' },
    features: ['100 000 requêtes/jour', '3 clés API (dev/test/prod)', 'Analyse batch 50 images', 'Webhooks temps réel', 'SLA 99,5%'],
    endpoints: ['Tous les endpoints Starter', 'POST /tebe/batch-analyze', 'GET /tebe/analytics', 'POST /tebe/webhook/register'],
  },
};

// Convert a DB plan object to the format expected by the UI
function dbPlanToUi(p) {
  const lim = p.limits || {};
  return {
    id: p.slug,
    label: p.name,
    price: p.price,
    currency: p.currency || 'XAF',
    period: '/mois',
    badge: p.badge || null,
    limits: {
      requests: lim.dailyRequests != null ? `${lim.dailyRequests.toLocaleString()} req/jour` : '',
      rate: lim.ratePerMinute != null ? `${lim.ratePerMinute} req/min` : '',
      sla: lim.sla || '',
      support: lim.support || '',
      keys: lim.maxKeys != null ? `${lim.maxKeys} clé${lim.maxKeys > 1 ? 's' : ''}` : '',
    },
    features: Array.isArray(p.features) ? p.features : [],
    endpoints: Array.isArray(p.endpoints) ? p.endpoints : [],
  };
}

const COMMERCIAL_ENDPOINTS = [
  { method: 'GET',  path: '/tebe/stats',          desc: 'Statistiques dataset & modèles',          starter: true,  pro: true },
  { method: 'GET',  path: '/tebe/conditions',      desc: 'Catalogue 7 maladies + noms locaux',      starter: true,  pro: true },
  { method: 'POST', path: '/tebe/analyze-image',   desc: 'Diagnostic visuel par photo (base64)',     starter: true,  pro: true },
  { method: 'POST', path: '/tebe/analyze-video',   desc: 'Diagnostic par séquence vidéo',           starter: true,  pro: true },
  { method: 'POST', path: '/tebe/contribute',      desc: 'Contribuer au dataset',                   starter: true,  pro: true },
  { method: 'GET',  path: '/tebe/history',         desc: 'Historique diagnostics de votre clé API', starter: true,  pro: true },
  { method: 'POST', path: '/tebe/batch-analyze',   desc: 'Analyse groupée 2–50 images',             starter: false, pro: true },
  { method: 'GET',  path: '/tebe/analytics',       desc: 'Métriques d\'usage de votre clé',        starter: false, pro: true },
  { method: 'POST', path: '/tebe/webhook/register',desc: 'Enregistrer un webhook push',             starter: false, pro: true },
];

const USE_CASES = [
  { icon: '🏥', title: 'Cliniques vétérinaires', desc: 'Pré-triage des consultations via votre logiciel.' },
  { icon: '📱', title: 'Applications mobiles',   desc: 'Scan visuel intégré à votre app d\'élevage.' },
  { icon: '🏛️', title: 'Institutions publiques', desc: 'Surveillance sanitaire nationale / régionale.' },
  { icon: '🔬', title: 'Recherche & ONG',        desc: 'Accès dataset + API pour travaux académiques.' },
  { icon: '🛒', title: 'Plateformes agrotech',   desc: 'Enrichissez votre marketplace avec l\'IA vétérinaire.' },
  { icon: '🌍', title: 'Projets ruraux',          desc: 'Déploiement en zones rurales à impact social.' },
];

const STEPS_PROC = [
  { n: '1', icon: '📝', title: 'Remplissez le formulaire', desc: 'Indiquez votre projet et choisissez votre plan.' },
  { n: '2', icon: '💳', title: 'Payez via Mobile Money',   desc: 'MTN ou Orange Money — approuvez sur votre téléphone.' },
  { n: '3', icon: '🔑', title: 'Recevez votre clé API',    desc: 'Clé générée instantanément après confirmation du paiement.' },
  { n: '4', icon: '🚀', title: 'Démarrez l\'intégration',  desc: 'Tableau de bord, docs et support inclus.' },
];

function MethodBadge({ method }) {
  const c = { GET: 'bg-blue-100 text-blue-700', POST: 'bg-green-100 text-green-700' };
  return <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${c[method] || 'bg-gray-100 text-gray-600'}`}>{method}</span>;
}
function Check({ ok }) {
  return ok ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">—</span>;
}

// ─── Étape 1 : Formulaire ─────────────────────────────────────────────────────
function StepForm({ onNext, plansMap }) {
  const [plan, setPlan]   = useState(() => Object.keys(plansMap)[0] || 'starter');
  const [form, setForm]   = useState({ firstName: '', lastName: '', email: '', phone: '', organization: '', country: '', useCase: '', message: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ plan, ...form });
  };

  return (
    <div className="space-y-8">
      {/* Choix du plan */}
      <div>
        <h2 className="font-bold text-gray-800 text-lg mb-4">Choisissez votre plan</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.values(plansMap).map(p => (
            <button key={p.id} type="button" onClick={() => setPlan(p.id)}
              className={`text-left p-5 rounded-2xl border-2 transition-all ${plan === p.id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'}`}>
              <div className="flex items-start justify-between mb-2">
                <span className="font-bold text-gray-900">{p.label}</span>
                {p.badge && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: PRIMARY_B, color: PRIMARY_D }}>{p.badge}</span>}
              </div>
              <div className="text-2xl font-extrabold mb-3" style={{ color: PRIMARY }}>
                {p.price.toLocaleString()} {p.currency}<span className="text-sm font-normal text-gray-400">{p.period}</span>
              </div>
              <div className="space-y-1">
                {p.features.map(f => (
                  <div key={f} className="flex gap-2 text-xs text-gray-700">
                    <span style={{ color: PRIMARY }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-1 text-xs text-gray-400">
                <span>📡 {p.limits.requests}</span>
                <span>⏱ {p.limits.rate}</span>
                <span>🛡 SLA {p.limits.sla}</span>
                <span>💬 {p.limits.support}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Endpoints inclus */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Endpoints inclus — {plansMap[plan]?.label}</p>
        <div className="space-y-1.5">
          {COMMERCIAL_ENDPOINTS.filter(e => e[plan]).map(ep => (
            <div key={ep.path} className="flex items-center gap-2 text-xs">
              <MethodBadge method={ep.method} />
              <code className="font-mono text-gray-700">{ep.path}</code>
              <span className="text-gray-400 hidden sm:inline">— {ep.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="font-bold text-gray-800 text-lg">Vos coordonnées</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Prénom *</label>
            <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jean"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Nom *</label>
            <input required value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Nkomo"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Email professionnel *</label>
            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jean@org.cm"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Organisation *</label>
            <input required value={form.organization} onChange={e => set('organization', e.target.value)} placeholder="Nom de votre structure"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Pays</label>
            <select value={form.country} onChange={e => set('country', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
              <option value="">Sélectionner...</option>
              {['Cameroun','Tchad','RCA','Nigéria','Niger','Congo','Gabon','Côte d\'Ivoire','Sénégal','Mali','Autre'].map(c => <option key={c}>{c}</option>)}
            </select></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Type d'usage *</label>
            <select required value={form.useCase} onChange={e => set('useCase', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
              <option value="">Sélectionner...</option>
              <option>Application mobile d'élevage</option>
              <option>Logiciel de clinique vétérinaire</option>
              <option>Plateforme agrotech / marketplace</option>
              <option>Surveillance sanitaire</option>
              <option>Recherche académique / ONG</option>
              <option>Intégration ERP / SI agricole</option>
              <option>Autre</option>
            </select></div>
        </div>
        <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Description du projet</label>
          <textarea rows={3} value={form.message} onChange={e => set('message', e.target.value)}
            placeholder="Décrivez brièvement votre projet..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" /></div>

        <button type="submit"
          className="w-full py-3.5 text-white font-bold rounded-xl transition-all text-sm"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})` }}>
          Continuer vers le paiement →
        </button>
      </form>
    </div>
  );
}

// ─── Étape 2 : Confirmation & paiement ───────────────────────────────────────
function StepPayment({ data, onBack, onPaymentInitiated, plansMap }) {
  const [phone, setPhone] = useState(data.phone || '');
  const [operator, setOperator] = useState('mtn');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const plan = plansMap[data.plan] || Object.values(plansMap)[0];

  const handlePay = async () => {
    if (!phone || phone.length < 9) { setError('Numéro de téléphone invalide.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await payments.initiateCommercial({ ...data, phone });
      onPaymentInitiated({ subscriptionId: res.data.subscriptionId, transactionId: res.data.transactionId, phone, plan: plan.label, amount: plan.price });
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur de connexion. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 transition flex items-center gap-1">← Modifier le formulaire</button>

      {/* Résumé commande */}
      <div className="rounded-2xl border-2 p-6" style={{ borderColor: PRIMARY, background: PRIMARY_L }}>
        <p className="text-xs font-bold uppercase text-gray-500 mb-3">Récapitulatif</p>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-gray-900 text-lg">API MokineLab {plan.label}</p>
            <p className="text-sm text-gray-500">Abonnement 1 mois · {data.firstName} {data.lastName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{data.email} · {data.organization}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold" style={{ color: PRIMARY }}>{plan.price.toLocaleString()} XAF</p>
            <p className="text-xs text-gray-400">TTC · renouvelable</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-green-200 grid grid-cols-2 gap-2 text-xs">
          {plan.features.map(f => <div key={f} className="flex gap-1.5"><span style={{ color: PRIMARY }}>✓</span><span className="text-gray-700">{f}</span></div>)}
        </div>
      </div>

      {/* Choix opérateur + numéro */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-800">Payer via Mobile Money</h3>

        <div className="grid grid-cols-2 gap-3">
          {[{ id: 'mtn', label: 'MTN Mobile Money', emoji: '🟡' }, { id: 'orange', label: 'Orange Money', emoji: '🟠' }].map(op => (
            <button key={op.id} type="button" onClick={() => setOperator(op.id)}
              className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${operator === op.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
              <span className="text-xl block mb-1">{op.emoji}</span>
              {op.label}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Numéro {operator === 'mtn' ? 'MTN' : 'Orange'} *</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
            placeholder={operator === 'mtn' ? '+237 67X XXX XXX' : '+237 69X XXX XXX'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          <p className="text-xs text-gray-400 mt-1">Une demande d'autorisation sera envoyée sur ce numéro.</p>
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        <button onClick={handlePay} disabled={loading}
          className="w-full py-3.5 text-white font-bold rounded-xl transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})` }}>
          {loading
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Envoi de la demande...</>
            : `💳 Confirmer le paiement →`}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Paiement sécurisé via Camoo · HTTPS · Pas de stockage des données bancaires
        </p>
      </div>
    </div>
  );
}

// ─── Étape 3 : Attente de paiement (polling) ─────────────────────────────────
function StepWaiting({ paymentInfo, onSuccess, onFailed }) {
  const [status, setStatus] = useState('pending');
  const [dots, setDots]     = useState('');
  const [attempts, setAttempts] = useState(0);
  const intervalRef = useRef(null);
  const MAX_ATTEMPTS = 24; // 2 min

  useEffect(() => {
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(dotTimer);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalRef.current);
        setStatus('timeout');
        return;
      }
      setAttempts(a => a + 1);
      try {
        const res = await payments.verifyCommercial(paymentInfo.subscriptionId);
        const s = res.data.status;
        setStatus(s);
        if (s === 'active') {
          clearInterval(intervalRef.current);
          onSuccess(res.data);
        } else if (s === 'failed') {
          clearInterval(intervalRef.current);
          onFailed();
        }
      } catch { /* silently retry */ }
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="text-center py-12">
      {status === 'pending' || status === 'timeout' ? (
        <>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: PRIMARY_B }}>
            <span className="text-4xl">📱</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'timeout' ? 'Délai dépassé' : `Approuvez sur votre téléphone${dots}`}
          </h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            {status === 'timeout'
              ? 'Le paiement n\'a pas été confirmé à temps. Vérifiez votre téléphone et relancez si nécessaire.'
              : `Une demande de paiement de ${paymentInfo.amount?.toLocaleString()} XAF a été envoyée au ${paymentInfo.phone}. Approuvez sur votre téléphone pour activer votre clé API.`}
          </p>
          {status !== 'timeout' && (
            <div className="flex justify-center gap-1.5 mb-6">
              {[0,1,2].map(i => (
                <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: PRIMARY, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400">Vérification toutes les 5s · Expire dans {Math.max(0, MAX_ATTEMPTS - attempts) * 5}s</p>
          {status === 'timeout' && (
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2.5 text-white rounded-xl font-semibold text-sm" style={{ background: PRIMARY }}>
              Réessayer
            </button>
          )}
        </>
      ) : (
        <div className="text-red-500">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">Paiement échoué</h2>
          <p className="text-sm text-gray-500 mb-4">La transaction a été refusée ou annulée. Réessayez.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 text-white rounded-xl font-semibold text-sm" style={{ background: PRIMARY }}>
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Étape 4 : Succès — clé API ───────────────────────────────────────────────
function StepSuccess({ successData, formData, plansMap }) {
  const navigate = useNavigate();
  const [copiedKey, setCopiedKey]  = useState('');

  const copy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(''), 2000);
    });
  };

  const plan = plansMap[formData.plan] || Object.values(plansMap)[0] || {};

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Accès commercial activé !</h2>
        <p className="text-gray-500 text-sm">Plan {plan.label} · {formData.email}</p>
      </div>

      {/* Clés API */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800">Vos clés API</h3>

        {[
          { label: 'Clé de Production', key: successData.apiKey,  prefix: 'mk_live_', tag: '🔴 Production', warning: 'Ne partagez jamais cette clé. Stockez-la dans vos variables d\'environnement.' },
          { label: 'Clé de Test',       key: successData.testKey, prefix: 'mk_test_', tag: '🟢 Sandbox',    warning: 'La sandbox renvoie des données fictives — quota illimité, pas de frais.' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">{k.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{k.tag}</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-900 text-green-400 font-mono text-xs px-3 py-2 rounded-lg overflow-x-auto">
                {k.key}
              </code>
              <button onClick={() => copy(k.key, k.label)}
                className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: copiedKey === k.label ? PRIMARY_B : '#f3f4f6', color: copiedKey === k.label ? PRIMARY_D : '#374151' }}>
                {copiedKey === k.label ? '✓ Copié' : 'Copier'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">⚠️ {k.warning}</p>
          </div>
        ))}
      </div>

      {/* Usage */}
      <div className="rounded-xl p-4 border" style={{ background: PRIMARY_L, borderColor: PRIMARY_B }}>
        <p className="text-xs font-bold uppercase text-gray-500 mb-2">Comment utiliser votre clé</p>
        <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs">
          <p className="text-gray-400"># Ajoutez ce header à chaque requête</p>
          <p className="text-green-400 mt-1">X-API-Key: <span className="text-yellow-300">{successData.apiKey}</span></p>
          <p className="text-gray-400 mt-2"># Exemple curl</p>
          <p className="text-blue-300 mt-1 break-all">
            curl -X POST https://api.mokine.cm/api/tebe/analyze-image \{'\n'}
            {'  '}-H "X-API-Key: {successData.apiKey}" \{'\n'}
            {'  '}-H "Content-Type: application/json" \{'\n'}
            {'  '}-d '{`{"animalType":"cattle","imageBase64":"..."}`}'
          </p>
        </div>
      </div>

      {/* Expiration */}
      <div className="text-center text-xs text-gray-400">
        Abonnement actif jusqu'au{' '}
        <strong>{successData.expiresAt ? new Date(successData.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</strong>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => navigate('/mokinelab/dashboard', { state: { apiKey: successData.apiKey } })}
          className="flex-1 py-3 text-white font-bold rounded-xl text-sm transition-all"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})` }}>
          📊 Mon tableau de bord →
        </button>
        <button onClick={() => navigate('/mokinelab/docs')}
          className="flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all hover:bg-green-50"
          style={{ borderColor: PRIMARY, color: PRIMARY }}>
          📄 Documentation API
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Besoin d'aide ? contact@mokine.cm · Votre clé a aussi été envoyée à {formData.email}
      </p>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function CommercialApiPage() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1); // 1=form 2=payment 3=waiting 4=success
  const [formData, setFormData]       = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [plansMap, setPlansMap]       = useState(DEFAULT_PLAN_CONFIG);

  useEffect(() => {
    publicApi.getPlans()
      .then(res => {
        const apiPlans = res.data?.plans;
        if (Array.isArray(apiPlans) && apiPlans.length > 0) {
          const map = {};
          apiPlans.forEach(p => { map[p.slug] = dbPlanToUi(p); });
          setPlansMap(map);
        }
      })
      .catch(() => { /* silently fall back to DEFAULT_PLAN_CONFIG */ });
  }, []);

  const stepLabels = ['Formulaire', 'Paiement', 'Confirmation', 'Accès'];

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/mokinelab')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: PRIMARY }}>M</div>
            <span className="font-bold text-gray-800 text-lg">Mokine<span style={{ color: PRIMARY }}>Lab</span></span>
          </button>
          <div className="hidden md:flex items-center gap-5 text-sm text-gray-600">
            <a href="#plans" className="hover:text-green-600 transition">Plans</a>
            <a href="#apis" className="hover:text-green-600 transition">APIs</a>
            <a href="/mokinelab/docs" className="hover:text-green-600 transition">Documentation</a>
          </div>
          <a href="/mokinelab/docs" className="text-sm border rounded-lg px-3 py-1.5 transition hover:bg-green-50" style={{ borderColor: PRIMARY, color: PRIMARY }}>
            Docs API
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 text-center" style={{ background: `linear-gradient(135deg, ${PRIMARY_L}, #ffffff, ${PRIMARY_L})` }}>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-5" style={{ background: PRIMARY_B, color: PRIMARY_D }}>
          🔑 Usage Commercial · API Tebe IA
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          Intégrez l'IA vétérinaire<br /><span style={{ color: PRIMARY }}>dans vos applications</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-6 text-sm">
          Payez par Mobile Money, recevez votre clé API instantanément et accédez à votre tableau de bord dédié.
        </p>
        <div className="flex justify-center gap-4 flex-wrap text-sm">
          {['💳 MTN & Orange Money', '⚡ Clé API instantanée', '📊 Dashboard inclus', '🛡 SLA garanti'].map(f => (
            <span key={f} className="px-3 py-1.5 rounded-full border" style={{ borderColor: PRIMARY_B, color: PRIMARY_D, background: PRIMARY_L }}>{f}</span>
          ))}
        </div>
      </section>

      {/* Cas d'usage */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-8">Qui utilise l'API Tebe ?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map(u => (
              <div key={u.title} className="border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-green-200 transition-all">
                <div className="text-2xl mb-2">{u.icon}</div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1">{u.title}</h3>
                <p className="text-xs text-gray-500">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tableau des APIs */}
      <section id="apis" className="py-14 px-4" style={{ background: '#f9fafb' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Endpoints par plan</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: PRIMARY }}>
                  {['Endpoint', 'Description', 'Starter', 'Pro'].map(h => (
                    <th key={h} className={`py-3 px-4 text-white font-semibold text-xs ${h === 'Endpoint' || h === 'Description' ? 'text-left' : 'text-center'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMMERCIAL_ENDPOINTS.map((ep, i) => (
                  <tr key={ep.path} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-3 px-4"><div className="flex items-center gap-2"><MethodBadge method={ep.method} /><code className="text-xs font-mono text-gray-700">{ep.path}</code></div></td>
                    <td className="py-3 px-4 text-xs text-gray-500">{ep.desc}</td>
                    <td className="py-3 px-4 text-center"><Check ok={ep.starter} /></td>
                    <td className="py-3 px-4 text-center"><Check ok={ep.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Procédure */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Procédure d'accès en 4 étapes</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS_PROC.map(s => (
              <div key={s.n} className="text-center bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-sm" style={{ background: PRIMARY }}>{s.n}</div>
                <div className="text-2xl mb-2">{s.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Formulaire multi-étapes ── */}
      <section id="plans" className="py-16 px-4" style={{ background: '#f9fafb' }}>
        <div className="max-w-2xl mx-auto">

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i + 1 <= step ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
                    style={i + 1 <= step ? { background: PRIMARY } : {}}>
                    {i + 1 < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-1 ${i + 1 === step ? 'font-semibold' : 'text-gray-400'}`} style={i + 1 === step ? { color: PRIMARY } : {}}>{label}</span>
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%`, background: PRIMARY }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {step === 1 && (
              <StepForm onNext={data => { setFormData(data); setStep(2); }} plansMap={plansMap} />
            )}
            {step === 2 && formData && (
              <StepPayment
                data={formData}
                onBack={() => setStep(1)}
                onPaymentInitiated={info => { setPaymentInfo(info); setStep(3); }}
                plansMap={plansMap}
              />
            )}
            {step === 3 && paymentInfo && (
              <StepWaiting
                paymentInfo={paymentInfo}
                onSuccess={data => { setSuccessData(data); setStep(4); }}
                onFailed={() => setStep(2)}
              />
            )}
            {step === 4 && successData && formData && (
              <StepSuccess successData={successData} formData={formData} plansMap={plansMap} />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400 text-center text-sm">
        <p className="font-semibold text-white mb-1">🧬 MokineLab — Usage Commercial API</p>
        <p className="mt-2">
          <a href="/mokinelab" className="hover:text-green-400 transition">MokineLab</a>
          <span className="mx-2">·</span>
          <a href="/mokinelab/docs" className="hover:text-green-400 transition">Documentation API</a>
          <span className="mx-2">·</span>
          <a href="/" className="hover:text-white transition">Accueil</a>
          <span className="mx-2">·</span>
          <span>contact@mokine.cm</span>
        </p>
        <p className="mt-2 text-xs text-gray-600">© {new Date().getFullYear()} Mokine · Paiement sécurisé par Camoo</p>
      </footer>
    </div>
  );
}
