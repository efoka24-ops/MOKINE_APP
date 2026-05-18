import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { admin } from '../../API.js';
import {
  RefreshCw, CheckCircle, XCircle, FlaskConical,
  Database, Cpu, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X,
} from 'lucide-react';

const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';
const PRIMARY_L = '#f0fdf4';
const PRIMARY_B = '#bbf7d0';

const TABS = [
  { id: 'models',        label: 'Modèles IA' },
  { id: 'contributions', label: 'Contributions' },
  { id: 'plans',         label: 'Plans API' },
  { id: 'subscriptions', label: 'Souscriptions' },
];

function useAutoRefresh(load) {
  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);
}

function Badge({ value, map }) {
  const [cls, label] = map[value] || ['bg-gray-100 text-gray-600', value || '—'];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function ProgressBar({ value, max, color = PRIMARY }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{value} / {max} images</span>
        <span className="font-semibold">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── TAB: Modèles ──────────────────────────────────────────────────────────
function ModelsTab() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    admin.getLabStats().then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }} /></div>;
  if (!stats) return <div className="text-gray-400 text-center py-8">Erreur de chargement</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Modèles IA ({stats.models?.length || 0})</h2>
        <button onClick={load} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition"><RefreshCw size={15} /></button>
      </div>
      <div className="bg-green-50 border border-green-100 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <Database size={18} className="text-[#178A3B]" />
          <span className="font-semibold text-[#136B2F]">Contributions globales au dataset Tebe</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-2xl font-bold text-[#178A3B]">{stats.contributionsTotal}</span>
          <div className="flex-1"><ProgressBar value={stats.contributionsTotal} max={1000} /></div>
        </div>
        {stats.contributionsPending > 0 && (
          <p className="text-xs text-[#178A3B] mt-2 font-medium">⏳ {stats.contributionsPending} contribution(s) en attente</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(stats.models || []).map(model => (
          <div key={model.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Cpu size={16} className="text-[#178A3B]" />
                  <span className="font-bold text-gray-900 text-sm">{model.name}</span>
                </div>
                <p className="text-xs text-gray-500">{model.description}</p>
              </div>
              <Badge value={model.status} map={{ production: ['bg-green-100 text-green-700', 'Production'], training: ['bg-yellow-100 text-yellow-700', 'Entraînement'], deprecated: ['bg-gray-100 text-gray-500', 'Déprécié'] }} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[['Version', model.version], ['Prochaine', model.nextVersion], ...(model.accuracy ? [['Précision', `${(model.accuracy * 100).toFixed(0)}%`]] : []), ['Lancement', model.estimatedLaunch || '—']].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 mb-0.5">{k}</p>
                  <p className="font-mono font-semibold text-gray-800">{v}</p>
                </div>
              ))}
            </div>
            {model.dataset && <div><p className="text-xs font-medium text-gray-600 mb-2">Progression</p><ProgressBar value={model.dataset.collected} max={model.dataset.target} /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB: Contributions ─────────────────────────────────────────────────────
function ContributionsTab() {
  const [data, setData] = useState({ contributions: [], total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    admin.getContributions().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const approve = async (id) => {
    await admin.approveContribution(id);
    setData(prev => ({ ...prev, contributions: prev.contributions.map(c => c.id === id ? { ...c, status: 'approved' } : c), pending: Math.max(0, prev.pending - 1) }));
  };
  const reject = async (id) => {
    const reason = window.prompt('Raison du rejet :');
    if (reason === null) return;
    await admin.rejectContribution(id, reason);
    setData(prev => ({ ...prev, contributions: prev.contributions.map(c => c.id === id ? { ...c, status: 'rejected' } : c), pending: Math.max(0, prev.pending - 1) }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Contributions <span className="text-gray-400 font-normal text-sm">({data.total} total, {data.pending} en attente)</span></h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
      </div>
      {data.contributions.length === 0 ? (
        <div className="text-center py-12"><FlaskConical size={32} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-400 text-sm">Aucune contribution</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['ID', 'Type animal', 'Condition', 'Image', 'Validé vét.', 'Statut', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.contributions.map((c, i) => (
                <tr key={c.id || i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{String(c.id).slice(0, 8)}</td>
                  <td className="py-3 px-4">{c.animalType || '—'}</td>
                  <td className="py-3 px-4">{c.condition || '—'}</td>
                  <td className="py-3 px-4"><Badge value={c.hasImage ? 'yes' : 'no'} map={{ yes: ['bg-blue-100 text-blue-700', 'Oui'], no: ['bg-gray-100 text-gray-500', 'Non'] }} /></td>
                  <td className="py-3 px-4"><Badge value={c.vetValidated ? 'yes' : 'no'} map={{ yes: ['bg-green-100 text-green-700', 'Oui'], no: ['bg-gray-100 text-gray-500', 'Non'] }} /></td>
                  <td className="py-3 px-4"><Badge value={c.status} map={{ pending_review: ['bg-yellow-100 text-yellow-700', 'En attente'], approved: ['bg-green-100 text-green-700', 'Approuvé'], rejected: ['bg-red-100 text-red-600', 'Rejeté'] }} /></td>
                  <td className="py-3 px-4">
                    {c.status === 'pending_review' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => approve(c.id)} className="p-1.5 rounded text-green-600 hover:bg-green-50 transition" title="Approuver"><CheckCircle size={14} /></button>
                        <button onClick={() => reject(c.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition" title="Rejeter"><XCircle size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Formulaire Plan (création / édition) ────────────────────────────────────
const EMPTY_PLAN = {
  name: '', slug: '', price: '', currency: 'XAF', periodDays: 30,
  description: '', badge: '', isActive: true, isPublic: true,
  limits: { dailyRequests: 10000, ratePerMinute: 100, sla: '99%', support: 'Email 48h', maxKeys: 1 },
  endpoints: [], features: '', sortOrder: 99,
};

function PlanForm({ plan, allEndpoints, onSave, onCancel, loading }) {
  const [form, setForm] = useState(() => plan
    ? { ...plan, features: (plan.features || []).join('\n'), endpoints: plan.endpoints || [] }
    : { ...EMPTY_PLAN }
  );

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setLimit = (k, v) => setForm(p => ({ ...p, limits: { ...p.limits, [k]: v } }));

  const toggleEndpoint = (ep) => {
    setForm(p => ({
      ...p,
      endpoints: p.endpoints.includes(ep)
        ? p.endpoints.filter(e => e !== ep)
        : [...p.endpoints, ep],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      price: Number(form.price),
      periodDays: Number(form.periodDays),
      sortOrder: Number(form.sortOrder),
      badge: form.badge || null,
      features: form.features.split('\n').map(f => f.trim()).filter(Boolean),
      limits: {
        ...form.limits,
        dailyRequests: Number(form.limits.dailyRequests),
        ratePerMinute: Number(form.limits.ratePerMinute),
        maxKeys: Number(form.limits.maxKeys),
      },
    });
  };

  const autoSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Infos de base */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nom du plan *</label>
          <input required value={form.name} onChange={e => { set('name', e.target.value); if (!plan) set('slug', autoSlug(e.target.value)); }}
            placeholder="Starter" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Slug (identifiant) *</label>
          <input required value={form.slug} onChange={e => set('slug', e.target.value)}
            placeholder="starter" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Prix (XAF) *</label>
          <input required type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)}
            placeholder="15000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Durée (jours)</label>
          <input type="number" min="1" value={form.periodDays} onChange={e => set('periodDays', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Badge (optionnel)</label>
          <input value={form.badge} onChange={e => set('badge', e.target.value)}
            placeholder="Populaire" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Ordre d'affichage</label>
          <input type="number" min="0" value={form.sortOrder} onChange={e => set('sortOrder', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
        <input value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Pour les développeurs et startups qui démarrent"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        {[['isActive', 'Actif'], ['isPublic', 'Visible publiquement']].map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <button type="button" onClick={() => set(k, !form[k])}
              className={`w-10 h-5 rounded-full transition-all flex-shrink-0 relative ${form[k] ? 'bg-[#178A3B]' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form[k] ? 'left-5' : 'left-0.5'}`} />
            </button>
            {label}
          </label>
        ))}
      </div>

      {/* Limites */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Limites techniques</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            ['dailyRequests', 'Requêtes/jour', 'number'],
            ['ratePerMinute', 'Rate limit (req/min)', 'number'],
            ['maxKeys', 'Nb. clés API', 'number'],
            ['sla', 'SLA (%)', 'text'],
            ['support', 'Support inclus', 'text'],
          ].map(([k, label, type]) => (
            <div key={k}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input type={type} value={form.limits[k]} onChange={e => setLimit(k, type === 'number' ? Number(e.target.value) : e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Endpoints */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Endpoints accessibles</p>
        <div className="grid sm:grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3">
          {allEndpoints.map(ep => {
            const key = `${ep.method} ${ep.path}`;
            const checked = form.endpoints.includes(key);
            return (
              <label key={key} className="flex items-center gap-2 cursor-pointer text-xs p-2 rounded-lg hover:bg-white transition">
                <input type="checkbox" checked={checked} onChange={() => toggleEndpoint(key)} className="rounded" />
                <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-xs ${ep.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{ep.method}</span>
                <span className="font-mono text-gray-700">{ep.path}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Fonctionnalités affichées (une par ligne)</label>
        <textarea rows={5} value={form.features} onChange={e => set('features', e.target.value)}
          placeholder={"10 000 requêtes/jour\nClé API dédiée\nSLA 99%"}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_D})` }}>
          {loading ? 'Enregistrement...' : plan ? 'Mettre à jour' : 'Créer le plan'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
          Annuler
        </button>
      </div>
    </form>
  );
}

// ─── TAB: Plans API ──────────────────────────────────────────────────────────
function PlansTab() {
  const [plans, setPlans]           = useState([]);
  const [allEndpoints, setAllEp]    = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editPlan, setEditPlan]     = useState(null); // null=list, 'new'=create, plan=edit
  const [deleteId, setDeleteId]     = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    admin.getApiPlans()
      .then(r => { setPlans(r.data.plans); setAllEp(r.data.allEndpoints || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editPlan && editPlan !== 'new') {
        await admin.updateApiPlan(editPlan.id, data);
      } else {
        await admin.createApiPlan(data);
      }
      setEditPlan(null);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    await admin.toggleApiPlan(id).catch(console.error);
    setPlans(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await admin.deleteApiPlan(deleteId).catch(console.error);
    setPlans(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
  };

  if (editPlan !== null) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-gray-900">{editPlan === 'new' ? 'Créer un plan API' : `Modifier — ${editPlan.name}`}</h2>
          <button onClick={() => setEditPlan(null)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition"><X size={18} /></button>
        </div>
        <PlanForm plan={editPlan === 'new' ? null : editPlan} allEndpoints={allEndpoints} onSave={handleSave} onCancel={() => setEditPlan(null)} loading={saving} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Confirmation suppression */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 mb-2">Supprimer ce plan ?</h3>
            <p className="text-sm text-gray-500 mb-5">Cette action est irréversible. Les souscriptions actives ne seront pas désactivées automatiquement.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white font-semibold rounded-xl text-sm">Supprimer</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Plans API ({plans.length})</h2>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={() => setEditPlan('new')}
            className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-xl transition"
            style={{ background: PRIMARY }}>
            <Plus size={15} /> Nouveau plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }} /></div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Database size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Aucun plan défini. Créez le premier plan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => (
            <div key={plan.id} className={`bg-white rounded-xl border p-5 ${plan.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-gray-900">{plan.name}</span>
                    <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{plan.slug}</code>
                    {plan.badge && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: PRIMARY_B, color: PRIMARY_D }}>{plan.badge}</span>}
                    {!plan.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Inactif</span>}
                    {!plan.isPublic && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Masqué</span>}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{plan.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="font-bold text-lg text-gray-900">{plan.price?.toLocaleString()} {plan.currency}</span>
                    <span>· {plan.periodDays}j</span>
                    <span>· {plan.limits?.dailyRequests?.toLocaleString()} req/jour</span>
                    <span>· {plan.limits?.ratePerMinute} req/min</span>
                    <span>· SLA {plan.limits?.sla}</span>
                    <span>· {plan.limits?.maxKeys} clé(s)</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(plan.endpoints || []).map(ep => (
                      <span key={ep} className="text-xs bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 font-mono">{ep}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleToggle(plan.id)} title={plan.isActive ? 'Désactiver' : 'Activer'}
                    className="text-gray-400 hover:text-gray-600 transition">
                    {plan.isActive ? <ToggleRight size={22} className="text-[#178A3B]" /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => setEditPlan(plan)} className="p-1.5 rounded text-gray-400 hover:bg-gray-100 transition" title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteId(plan.id)} className="p-1.5 rounded text-red-400 hover:bg-red-50 transition" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB: Souscriptions ──────────────────────────────────────────────────────
function SubscriptionsTab() {
  const [data, setData] = useState({ subscriptions: [], total: 0, active: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    admin.getApiSubscriptions().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const STATUS_MAP = {
    active:   ['bg-green-100 text-green-700', 'Actif'],
    pending:  ['bg-yellow-100 text-yellow-700', 'En attente'],
    failed:   ['bg-red-100 text-red-600', 'Échoué'],
    expired:  ['bg-gray-100 text-gray-500', 'Expiré'],
    canceled: ['bg-gray-100 text-gray-400', 'Annulé'],
  };

  const CAMOO_STATUS_MAP = {
    SUCCESS:           'bg-green-100 text-green-700',
    CONFIRMED:         'bg-green-50 text-green-600',
    PENDING:           'bg-yellow-100 text-yellow-700',
    IN_PROGRESS:       'bg-blue-100 text-blue-600',
    INITIALISED:       'bg-blue-50 text-blue-500',
    CREATED:           'bg-gray-100 text-gray-500',
    FAILED:            'bg-red-100 text-red-600',
    CANCELED:          'bg-gray-100 text-gray-400',
    ERRORED:           'bg-orange-100 text-orange-600',
    UNDERINVESTIGATION:'bg-purple-100 text-purple-600',
  };

  const failed = data.subscriptions.filter(s => s.status === 'failed').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">Souscriptions API</h2>
          <div className="flex gap-4 mt-1 text-xs text-gray-500">
            <span>Total: <strong>{data.total}</strong></span>
            <span className="text-green-600">Actives: <strong>{data.active}</strong></span>
            <span className="text-yellow-600">En attente: <strong>{data.pending}</strong></span>
            {failed > 0 && <span className="text-red-500">Échouées: <strong>{failed}</strong></span>}
          </div>
        </div>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }} /></div>
      ) : data.subscriptions.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><p className="text-sm">Aucune souscription pour l'instant.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Client', 'Plan', 'Montant', 'Téléphone', 'Statut', 'Statut Camoo', 'TX Camoo', 'Expiration', 'Clé API'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.subscriptions.map((s, i) => {
                const camooKey = (s.camooStatus || '').toUpperCase();
                const camooCls = CAMOO_STATUS_MAP[camooKey] || 'bg-gray-50 text-gray-400';
                return (
                <tr key={s.id || i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <p className="font-medium text-gray-800 text-xs">{s.firstName} {s.lastName}</p>
                    <p className="text-gray-400 text-xs">{s.email}</p>
                    {s.organization && <p className="text-gray-400 text-xs">{s.organization}</p>}
                  </td>
                  <td className="py-3 px-3"><span className="text-xs font-semibold capitalize">{s.planLabel || s.plan}</span></td>
                  <td className="py-3 px-3 text-xs font-bold" style={{ color: PRIMARY }}>{s.amount?.toLocaleString()} {s.currency}</td>
                  <td className="py-3 px-3 text-xs font-mono">{s.phone}</td>
                  <td className="py-3 px-3"><Badge value={s.status} map={STATUS_MAP} /></td>
                  <td className="py-3 px-3">
                    {s.camooStatus
                      ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${camooCls}`}>{s.camooStatus}</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="py-3 px-3">
                    {s.camooTransactionId
                      ? <code className="text-xs text-gray-400 font-mono">{s.camooTransactionId.slice(0, 8)}…</code>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="py-3 px-3 text-xs">{s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="py-3 px-3">
                    {s.apiKey ? (
                      <code className="text-xs text-gray-500 font-mono">{s.apiKey.slice(0, 16)}…</code>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function LabModule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'models';
  const setTab = (t) => setSearchParams(t === 'models' ? {} : { tab: t });

  const TAB_COMPONENTS = {
    models: <ModelsTab />,
    contributions: <ContributionsTab />,
    plans: <PlansTab />,
    subscriptions: <SubscriptionsTab />,
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧬 MokineLab</h1>
          <p className="text-sm text-gray-500 mt-1">Intelligence Artificielle — modèles, datasets, plans API et souscriptions</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              style={tab === t.id ? { color: PRIMARY } : {}}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {TAB_COMPONENTS[tab] || <div className="text-gray-400">Onglet inconnu</div>}
        </div>
      </div>
    </AdminLayout>
  );
}
