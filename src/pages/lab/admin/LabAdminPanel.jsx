import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLabAuth } from '../../../context/LabAuthContext';

const PRIMARY = '#178A3B';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TABS = [
  { id: 'stats',     label: 'Statistiques',       icon: '📈' },
  { id: 'members',   label: 'Membres',             icon: '👥' },
  { id: 'requests',  label: 'Demandes dataset',    icon: '📂' },
  { id: 'contribs',  label: 'Contributions',       icon: '🤝' },
  { id: 'jobs',      label: "Jobs d'entraînement", icon: '⚙️' },
  { id: 'catalog',   label: 'Catalogue IA',        icon: '🧠' },
];

const ROLE_LABELS = {
  researcher:   { label: 'Chercheur',    color: 'bg-blue-100 text-blue-700' },
  developer:    { label: 'Développeur',  color: 'bg-purple-100 text-purple-700' },
  veterinarian: { label: 'Vétérinaire',  color: 'bg-green-100 text-green-700' },
  lab_admin:    { label: 'Admin Lab',    color: 'bg-red-100 text-red-700' },
};

const STATUS_BADGE = {
  pending:   'bg-yellow-100 text-yellow-700',
  validated: 'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  approved:  'bg-green-100 text-green-700',
  running:   'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
  failed:    'bg-red-100 text-red-700',
};

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('lab_token')}` };
}

function api() {
  return axios.create({ baseURL: API_BASE, headers: authHeaders() });
}

// ── Tab: Statistiques ─────────────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api().get('/api/lab/admin/stats')
      .then(r => setStats(r.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!stats) return <p className="text-red-500 text-sm">Impossible de charger les stats.</p>;

  const cards = [
    { label: 'Membres total',       value: stats.totalMembers,        icon: '👥', color: 'bg-blue-50 text-blue-700' },
    { label: 'Contributions',       value: stats.totalContributions,  icon: '🤝', color: 'bg-green-50 text-green-700' },
    { label: 'Modèles',             value: stats.totalModels,         icon: '🧬', color: 'bg-purple-50 text-purple-700' },
    { label: 'Scans IA',            value: stats.totalScans,          icon: '📸', color: 'bg-orange-50 text-orange-700' },
    { label: "Jobs d'entraînement", value: stats.totalJobs,           icon: '⚙️', color: 'bg-gray-50 text-gray-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-2xl p-4 ${c.color} border border-opacity-20`}>
            <div className="text-2xl mb-1">{c.icon}</div>
            <p className="text-2xl font-bold">{c.value ?? 0}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Membres par rôle */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Membres par rôle</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(stats.membersByRole || {}).map(([role, count]) => {
            const info = ROLE_LABELS[role] || { label: role, color: 'bg-gray-100 text-gray-600' };
            return (
              <div key={role} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${info.color}`}>{info.label}</span>
                <span className="font-bold text-gray-800">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contributions par statut */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Contributions par statut</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(stats.contributionsByStatus || {}).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>
                {status}
              </span>
              <span className="font-bold text-gray-800">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Membres ──────────────────────────────────────────────────────────────
function MembersTab() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(null);

  const fetchMembers = () => {
    setLoading(true);
    api().get('/api/lab/admin/members')
      .then(r => setMembers(r.data.members || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleBlock = async (id) => {
    setBlocking(id);
    try {
      const r = await api().patch(`/api/lab/admin/members/${id}/block`);
      setMembers(prev => prev.map(m => m.id === id ? { ...m, blocked: r.data.blocked } : m));
    } catch {}
    setBlocking(null);
  };

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Nom</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Rôle</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Inscription</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Statut</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map(m => {
              const roleInfo = ROLE_LABELS[m.role] || { label: m.role, color: 'bg-gray-100 text-gray-600' };
              return (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-5 py-3 text-gray-500">{m.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-3">
                    {m.blocked ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Bloqué</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Actif</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {m.role !== 'lab_admin' && (
                      <button
                        onClick={() => handleBlock(m.id)}
                        disabled={blocking === m.id}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-60 ${
                          m.blocked
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}>
                        {blocking === m.id ? '…' : m.blocked ? 'Débloquer' : 'Bloquer'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {members.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">Aucun membre.</div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Demandes dataset ─────────────────────────────────────────────────────
function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notes, setNotes]       = useState({});
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    api().get('/api/lab/admin/dataset-requests')
      .then(r => setRequests(r.data.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleProcess = async (id, action) => {
    setProcessing(id + action);
    try {
      const r = await api().patch(`/api/lab/admin/dataset-requests/${id}`, { action, note: notes[id] || '' });
      setRequests(prev => prev.map(req => req.id === id ? r.data.request : req));
    } catch {}
    setProcessing(null);
  };

  if (loading) return <Spinner />;
  if (requests.length === 0) return <EmptyState icon="📂" text="Aucune demande dataset." />;

  return (
    <div className="space-y-4">
      {requests.map(req => (
        <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{req.requesterName || req.devId}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Soumis le {new Date(req.createdAt).toLocaleDateString('fr-FR')}
              </p>
              {req.reason && <p className="text-xs text-gray-600 mt-1 italic">"{req.reason}"</p>}
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${STATUS_BADGE[req.status] || 'bg-gray-100 text-gray-600'}`}>
              {req.status}
            </span>
          </div>
          {req.status === 'pending' && (
            <div className="mt-4 space-y-2">
              <textarea
                value={notes[req.id] || ''}
                onChange={e => setNotes(n => ({ ...n, [req.id]: e.target.value }))}
                placeholder="Note optionnelle…" rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-200"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleProcess(req.id, 'approved')}
                  disabled={!!processing}
                  className="px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-60"
                  style={{ background: PRIMARY }}>
                  {processing === req.id + 'approved' ? '…' : '✅ Approuver'}
                </button>
                <button
                  onClick={() => handleProcess(req.id, 'rejected')}
                  disabled={!!processing}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-60">
                  {processing === req.id + 'rejected' ? '…' : '❌ Rejeter'}
                </button>
              </div>
            </div>
          )}
          {req.adminNote && (
            <p className="mt-2 text-xs text-gray-500 italic">Note admin: {req.adminNote}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab: Contributions admin ──────────────────────────────────────────────────
function ContribsTab() {
  const [contribs, setContribs] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notes, setNotes]       = useState({});
  const [processing, setProcessing] = useState(null);

  const fetchContribs = () => {
    api().get('/api/lab/admin/contributions')
      .then(r => setContribs(r.data.contributions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContribs(); }, []);

  const handleAction = async (id, action) => {
    setProcessing(id + action);
    try {
      await api().patch(`/api/lab/contributions/${id}/validate`, { action, note: notes[id] || '' });
      fetchContribs();
    } catch {}
    setProcessing(null);
  };

  if (loading) return <Spinner />;
  if (contribs.length === 0) return <EmptyState icon="🤝" text="Aucune contribution." />;

  const pending    = contribs.filter(c => c.status === 'pending');
  const validated  = contribs.filter(c => c.status === 'validated');
  const rejected   = contribs.filter(c => c.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',     value: contribs.length, cls: 'bg-gray-50 text-gray-700' },
          { label: 'En attente', value: pending.length, cls: 'bg-yellow-50 text-yellow-700' },
          { label: 'Validées',   value: validated.length, cls: 'bg-green-50 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.cls} border border-opacity-10`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {contribs.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start gap-4">
              {c.photo ? (
                <img src={c.photo} alt="" className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border border-gray-200" />
              ) : (
                <div className="w-16 h-16 rounded-xl flex-shrink-0 bg-gray-100 flex items-center justify-center text-2xl">
                  🐾
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{c.pathology}</span>
                  <span className="text-xs text-gray-400">{c.species}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-600'}`}>
                    {c.status}
                  </span>
                  <span className="text-xs text-gray-400">Valeur ×{c.trainingValue}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Par {c.contributorName} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>
                {c.notes && <p className="text-xs text-gray-400 italic mt-1">"{c.notes}"</p>}
                {c.status === 'pending' && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={notes[c.id] || ''}
                      onChange={e => setNotes(n => ({ ...n, [c.id]: e.target.value }))}
                      placeholder="Note optionnelle…" rows={1}
                      className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-200"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(c.id, 'validated')} disabled={!!processing}
                        className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-60"
                        style={{ background: PRIMARY }}>
                        {processing === c.id + 'validated' ? '…' : '✅ Valider'}
                      </button>
                      <button onClick={() => handleAction(c.id, 'rejected')} disabled={!!processing}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-60">
                        {processing === c.id + 'rejected' ? '…' : '❌ Rejeter'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Jobs d'entraînement ──────────────────────────────────────────────────
function JobsTab() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api().get('/api/lab/admin/jobs')
      .then(r => setJobs(r.data.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (jobs.length === 0) return <EmptyState icon="⚙️" text="Aucun job d'entraînement." />;

  return (
    <div className="space-y-3">
      {jobs.map(job => (
        <div key={job.id} className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{job.modelName || job.name || job.id}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(job.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${STATUS_BADGE[job.status] || 'bg-gray-100 text-gray-600'}`}>
              {job.status || 'unknown'}
            </span>
          </div>
          {typeof job.progress === 'number' && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progression</span>
                <span>{job.progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${job.progress}%`, background: PRIMARY }} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab: Catalogue IA ─────────────────────────────────────────────────────────
const CATEGORY_META = {
  detection:      { label: 'Détection',       color: 'bg-blue-100 text-blue-700',    icon: '🎯' },
  classification: { label: 'Classification',   color: 'bg-green-100 text-green-700',  icon: '🏷️' },
  segmentation:   { label: 'Segmentation',     color: 'bg-purple-100 text-purple-700',icon: '✂️' },
  'zero-shot':    { label: 'Zero-Shot',         color: 'bg-orange-100 text-orange-700',icon: '🧪' },
};

const DIFFICULTY_COLORS = {
  beginner:     'text-green-600',
  intermediate: 'text-yellow-600',
  advanced:     'text-orange-600',
  expert:       'text-red-600',
};

function MetricMini({ label, value }) {
  if (value == null) return null;
  const pct = Math.min(value * 100, 100);
  const color = pct >= 90 ? '#178A3B' : pct >= 75 ? '#eab308' : '#f97316';
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-400">{label}</span>
        <span className="font-bold text-xs" style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function CatalogTab() {
  const [models, setModels]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [deleting, setDeleting]   = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [filter, setFilter]       = useState('');

  useEffect(() => {
    api().get('/api/lab/catalog')
      .then(r => setModels(r.data.models || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce modèle du catalogue ?')) return;
    setDeleting(id);
    try {
      await api().delete(`/api/lab/catalog/${id}`);
      setModels(ms => ms.filter(m => m.id !== id));
      setActionMsg('Modèle supprimé.');
      setTimeout(() => setActionMsg(''), 3000);
    } catch { setActionMsg('Erreur lors de la suppression.'); }
    finally { setDeleting(''); }
  };

  const handleTogglePublic = async (model) => {
    try {
      await api().patch(`/api/lab/catalog/${model.id}`, { isPublic: !model.isPublic });
      setModels(ms => ms.map(m => m.id === model.id ? { ...m, isPublic: !m.isPublic } : m));
    } catch { /* silent */ }
  };

  const filtered = filter
    ? models.filter(m =>
        m.name.toLowerCase().includes(filter.toLowerCase()) ||
        m.category.toLowerCase().includes(filter.toLowerCase()) ||
        m.targetSpecies?.some(s => s.toLowerCase().includes(filter.toLowerCase()))
      )
    : models;

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      {actionMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{actionMsg}</div>
      )}

      {/* Summary + actions */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex flex-wrap gap-2 flex-1">
          {Object.entries(
            models.reduce((acc, m) => { acc[m.category] = (acc[m.category] || 0) + 1; return acc; }, {})
          ).map(([cat, count]) => (
            <span key={cat} className={`text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_META[cat]?.color || 'bg-gray-100 text-gray-600'}`}>
              {CATEGORY_META[cat]?.icon} {count} {CATEGORY_META[cat]?.label || cat}
            </span>
          ))}
          <span className="text-xs text-gray-400">{models.length} modèles au total</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="🔍 Filtrer..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-green-400 w-36"
          />
          <a
            href="/mokinelab/dashboard/catalog"
            target="_blank"
            rel="noreferrer"
            className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition"
          >
            Vue publique ↗
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Modèle</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Catégorie</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Métriques clés</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Infos</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(model => {
              const m = model.metrics || {};
              const cat = CATEGORY_META[model.category] || CATEGORY_META.classification;
              const diffColor = DIFFICULTY_COLORS[model.difficultyLevel] || 'text-gray-500';
              return (
                <tr key={model.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800 text-xs">{model.shortName || model.name}</div>
                    <div className="text-xs text-gray-400 truncate max-w-32">{model.architecture}</div>
                    {model.animalHumanDiscrimination && (
                      <span className="text-xs text-red-500">👤 Anti-humain</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>
                      {cat.icon} {cat.label}
                    </span>
                    <div className={`text-xs mt-1 font-medium ${diffColor}`}>
                      {model.difficultyLevel}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell w-36">
                    <div className="space-y-1">
                      <MetricMini label="F1" value={m.f1} />
                      <MetricMini label="Acc" value={m.accuracy ?? m.precision} />
                      {m.successRateOnBenchmark && (
                        <div className="text-xs">
                          <span className="text-green-600 font-bold">{(m.successRateOnBenchmark * 100).toFixed(1)}%</span>
                          <span className="text-gray-400"> succès · </span>
                          <span className="text-red-500 font-bold">{(m.failureRate * 100).toFixed(1)}%</span>
                          <span className="text-gray-400"> échec</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-xs space-y-0.5 text-gray-500">
                      <div><span className="text-gray-400">Latence:</span> {m.inferenceMs != null ? `${m.inferenceMs}ms` : '—'}</div>
                      <div><span className="text-gray-400">Poids:</span> {m.modelSizeMB != null ? `${m.modelSizeMB}MB` : '—'}</div>
                      <div><span className="text-gray-400">Licence:</span> {model.license}</div>
                      <div><span className="text-gray-400">⭐</span> {model.communityRating || '—'} · {model.communityForks || 0} forks</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleTogglePublic(model)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold transition ${
                        model.isPublic
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {model.isPublic ? '● Publié' : '○ Masqué'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setSelected(selected?.id === model.id ? null : model)}
                        className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
                      >
                        {selected?.id === model.id ? 'Fermer' : 'Voir tout'}
                      </button>
                      <button
                        onClick={() => handleDelete(model.id)}
                        disabled={!!deleting}
                        className="text-xs px-2.5 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                      >
                        {deleting === model.id ? '...' : 'Suppr.'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Panneau détail */}
      {selected && (
        <div className="bg-white rounded-2xl border border-green-200 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-900">{selected.name}</h3>
              <p className="text-sm text-gray-500">{selected.architecture} · v{selected.version} · {selected.license}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700">✕</button>
          </div>
          <p className="text-sm text-gray-600">{selected.description}</p>

          {/* Métriques complètes */}
          {selected.metrics && (
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-3">Toutes les métriques</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Précision',    selected.metrics.precision],
                  ['Rappel',       selected.metrics.recall],
                  ['F1-Score',     selected.metrics.f1],
                  ['Accuracy',     selected.metrics.accuracy],
                  ['AUC-ROC',      selected.metrics.auc],
                  ['mAP@50',       selected.metrics.mAP50],
                  ['Succès bench', selected.metrics.successRateOnBenchmark],
                  ['Taux échec',   selected.metrics.failureRate],
                  ['Faux +',       selected.metrics.falsePositiveRate],
                  ['Faux -',       selected.metrics.falseNegativeRate],
                ].filter(([, v]) => v != null).map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-sm font-extrabold text-gray-800">{(value * 100).toFixed(1)}%</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publication + Dataset */}
          <div className="grid sm:grid-cols-2 gap-4">
            {selected.paper && (
              <div className="bg-blue-50 rounded-xl p-4 text-xs space-y-1">
                <p className="font-bold text-blue-800 text-sm">{selected.paper.title}</p>
                <p className="text-blue-600">{selected.paper.authors?.join(', ')}</p>
                <p className="text-blue-500">{selected.paper.venue} · {selected.paper.year}</p>
                {selected.paper.doi && <p className="font-mono text-blue-400 break-all">{selected.paper.doi}</p>}
                {selected.paper.citationCount && <p className="text-blue-400">{selected.paper.citationCount.toLocaleString('fr-FR')} citations</p>}
              </div>
            )}
            {selected.dataset && (
              <div className="bg-gray-50 rounded-xl p-4 text-xs space-y-1">
                <p className="font-bold text-gray-700 text-sm">Dataset</p>
                <p>{selected.dataset.name}</p>
                <p className="text-gray-500">{selected.dataset.images?.toLocaleString('fr-FR')} images · {selected.dataset.classes} classes</p>
                <p className="font-mono text-gray-400">{selected.dataset.source}</p>
              </div>
            )}
          </div>

          {selected.useCases?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-2">Cas d'usage</p>
              <ul className="space-y-1">
                {selected.useCases.map((u, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span style={{ color: PRIMARY }}>✓</span>{u}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selected.checkpointUrl && (
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-1">Checkpoint officiel</p>
              <p className="text-xs font-mono text-gray-500 break-all bg-gray-50 rounded p-2">
                {selected.checkpointUrl}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function LabAdminPanel() {
  const { user } = useLabAuth();
  const [activeTab, setActiveTab] = useState('stats');

  const TAB_CONTENT = {
    stats:    <StatsTab />,
    members:  <MembersTab />,
    requests: <RequestsTab />,
    contribs: <ContribsTab />,
    jobs:     <JobsTab />,
    catalog:  <CatalogTab />,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-20">
        <Link to="/mokinelab/dashboard"
          className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
          &larr; Dashboard
        </Link>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-semibold text-gray-800">🛡️ Panel Admin MokineLab</span>
        <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
          {user?.name?.split(' ')[0]} · Admin
        </span>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        {/* Onglets */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              style={activeTab === tab.id ? { background: PRIMARY } : {}}>
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu de l'onglet actif */}
        {TAB_CONTENT[activeTab]}
      </div>
    </div>
  );
}
