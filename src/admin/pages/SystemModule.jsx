import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { admin } from '../../API.js';
import { Search, RefreshCw, Plus, Pencil, Trash2, Lock, Unlock, Send, Save, Database, RotateCcw, BarChart3, AlertTriangle } from 'lucide-react';

const TABS = [
  { id: 'users',         label: 'Utilisateurs' },
  { id: 'payments',      label: 'Paiements' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'settings',      label: 'Paramètres' },
  { id: 'database',      label: 'Base de données' },
];

const ROLES = { farmer: ['bg-green-100 text-green-700', 'Éleveur'], veterinarian: ['bg-blue-100 text-blue-700', 'Vétérinaire'], vendor: ['bg-amber-100 text-amber-700', 'Fournisseur'], admin: ['bg-red-100 text-red-600', 'Admin'] };

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

function Table({ cols, rows, empty = 'Aucune donnée' }) {
  if (rows.length === 0) return <div className="text-center py-12 text-gray-400 text-sm">{empty}</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {cols.map(c => <th key={c.key} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              {cols.map(c => (
                <td key={c.key} className="py-3 px-4 text-gray-700">
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TAB: Utilisateurs ──────────────────────────────────────────────────────
function UserModal({ user, onClose, onSave }) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState({ name: '', email: '', role: 'farmer', phone: '', ...(user || {}) });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let r;
      if (isEdit) r = await admin.updateSystemUser(form.id, form);
      else r = await admin.createSystemUser(form);
      onSave(r.data);
      onClose();
    } catch { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{isEdit ? 'Modifier utilisateur' : 'Créer utilisateur'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {[['name', 'Nom *', 'text'], ['email', 'Email *', 'email'], ['phone', 'Téléphone', 'tel']].map(([k, label, type]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} required={label.includes('*')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]/30" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Rôle *</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]/30">
              <option value="farmer">Éleveur</option>
              <option value="veterinarian">Vétérinaire</option>
              <option value="vendor">Fournisseur</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-[#178A3B] text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
              {saving ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsersTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState('');

  const filtered = q ? data.filter(u => [u.name, u.email, u.role, u.phone].some(f => String(f || '').toLowerCase().includes(q.toLowerCase()))) : data;

  const load = useCallback(() => {
    setLoading(true);
    admin.getSystemUsers().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const toggleBlock = async (id, blocked) => {
    await admin.toggleSystemUserBlock(id);
    setData(prev => prev.map(u => u.id === id ? { ...u, blocked: !blocked } : u));
  };
  const remove = async (id) => {
    if (!window.confirm('Supprimer définitivement cet utilisateur ?')) return;
    await admin.deleteSystemUser(id);
    setData(prev => prev.filter(u => u.id !== id));
  };
  const handleSave = (saved) => {
    setData(prev => {
      const idx = prev.findIndex(u => u.id === saved.id);
      return idx >= 0 ? prev.map((u, i) => i === idx ? saved : u) : [saved, ...prev];
    });
  };

  const cols = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Tél.', render: r => r.phone || '—' },
    { key: 'role', label: 'Rôle', render: r => <Badge value={r.role} map={ROLES} /> },
    { key: 'isVerified', label: 'Vérifié', render: r => <Badge value={r.isVerified ? 'yes' : 'no'} map={{ yes: ['bg-green-100 text-green-700', 'Oui'], no: ['bg-gray-100 text-gray-500', 'Non'] }} /> },
    { key: 'blocked', label: 'Statut', render: r => <Badge value={r.blocked ? 'blocked' : 'active'} map={{ active: ['bg-green-100 text-green-700', 'Actif'], blocked: ['bg-red-100 text-red-600', 'Suspendu'] }} /> },
    { key: 'createdAt', label: 'Inscrit', render: r => r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '—' },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1.5">
        <button onClick={() => setModal(r)} className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition"><Pencil size={13} /></button>
        <button onClick={() => toggleBlock(r.id, r.blocked)} className={`p-1.5 rounded transition ${r.blocked ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}>
          {r.blocked ? <Unlock size={13} /> : <Lock size={13} />}
        </button>
        {r.role !== 'admin' && (
          <button onClick={() => remove(r.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition"><Trash2 size={13} /></button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Utilisateurs <span className="text-gray-400 font-normal text-sm">({filtered.length})</span></h2>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setModal({})} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#178A3B] text-white rounded-lg hover:bg-green-700 transition font-medium">
            <Plus size={13} /> Créer
          </button>
        </div>
      </div>
      <div className="mb-4 relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher par nom, email, rôle..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#178A3B]/30" />
      </div>
      <Table cols={cols} rows={filtered} empty="Aucun utilisateur" />
      {modal !== null && <UserModal user={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}

// ─── TAB: Paiements ─────────────────────────────────────────────────────────
function PaymentsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    admin.getSystemPayments().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const refund = async (id) => {
    const reason = window.prompt('Raison du remboursement :');
    if (reason === null) return;
    await admin.systemProcessRefund({ paymentId: id, reason });
    setData(prev => prev.map(p => p.id === id ? { ...p, status: 'refunded' } : p));
  };

  const STATUS = {
    completed: ['bg-green-100 text-green-700', 'Complété'],
    pending:   ['bg-yellow-100 text-yellow-700', 'En attente'],
    failed:    ['bg-red-100 text-red-600', 'Échoué'],
    refunded:  ['bg-purple-100 text-purple-700', 'Remboursé'],
  };

  const total = data.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);

  const cols = [
    { key: 'id', label: 'ID', render: r => <span className="font-mono text-xs">{String(r.id || r.transactionId || '').slice(0, 12)}</span> },
    { key: 'userEmail', label: 'Utilisateur', render: r => r.userEmail || r.userId || '—' },
    { key: 'amount', label: 'Montant', render: r => r.amount ? `${(r.amount).toLocaleString()} F` : '—' },
    { key: 'paymentMethod', label: 'Méthode', render: r => r.paymentMethod || '—' },
    { key: 'status', label: 'Statut', render: r => <Badge value={r.status} map={STATUS} /> },
    { key: 'date', label: 'Date', render: r => (r.date || r.createdAt) ? new Date(r.date || r.createdAt).toLocaleDateString('fr-FR') : '—' },
    { key: 'actions', label: '', render: r => r.status === 'completed' ? (
      <button onClick={() => refund(r.id)} className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition font-medium">Rembourser</button>
    ) : null },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Paiements <span className="text-gray-400 font-normal text-sm">({data.length})</span></h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      {total > 0 && (
        <div className="mb-4 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          <span className="text-sm text-green-700">Revenus totaux complétés : <strong>{total.toLocaleString()} F CFA</strong></span>
        </div>
      )}
      <Table cols={cols} rows={data} empty="Aucun paiement enregistré" />
    </div>
  );
}

// ─── TAB: Notifications ─────────────────────────────────────────────────────
function NotificationsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcast, setBroadcast] = useState({ title: '', message: '', type: 'info', targetRole: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    admin.getSystemNotifications().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    setSent(null);
    try {
      const r = await admin.broadcastNotification(broadcast);
      setSent(r.data);
      setBroadcast({ title: '', message: '', type: 'info', targetRole: '' });
      load();
    } catch { } finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      {/* Broadcast form */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Send size={16} className="text-blue-500" /> Envoyer une notification groupée</h3>
        <form onSubmit={send} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Titre *</label>
            <input value={broadcast.title} onChange={e => setBroadcast(p => ({ ...p, title: e.target.value }))} required placeholder="Ex: Maintenance planifiée"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cible</label>
            <select value={broadcast.targetRole} onChange={e => setBroadcast(p => ({ ...p, targetRole: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 bg-white">
              <option value="">Tous les utilisateurs</option>
              <option value="farmer">Éleveurs seulement</option>
              <option value="veterinarian">Vétérinaires seulement</option>
              <option value="vendor">Fournisseurs seulement</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Message *</label>
            <textarea value={broadcast.message} onChange={e => setBroadcast(p => ({ ...p, message: e.target.value }))} required rows={2} placeholder="Contenu de la notification..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 bg-white" />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={sending} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
              <Send size={14} /> {sending ? 'Envoi...' : 'Envoyer'}
            </button>
            {sent && <span className="text-xs text-green-700 font-medium">✓ Envoyée à {sent.count} utilisateur(s)</span>}
          </div>
        </form>
      </div>

      {/* Recent notifications list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">Notifications récentes <span className="text-gray-400 font-normal text-sm">({data.length})</span></h3>
          <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Utilisateur', 'Titre', 'Type', 'Lu', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0
                ? <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Aucune notification</td></tr>
                : data.slice(0, 50).map((n, i) => (
                    <tr key={n.id || i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-xs font-mono">{String(n.userId || '').slice(0, 8)}</td>
                      <td className="py-3 px-4 max-w-xs"><p className="truncate">{n.title}</p><p className="text-xs text-gray-400 truncate">{n.message}</p></td>
                      <td className="py-3 px-4"><Badge value={n.type} map={{ info: ['bg-blue-100 text-blue-700', 'Info'], warning: ['bg-yellow-100 text-yellow-700', 'Alerte'], error: ['bg-red-100 text-red-600', 'Erreur'], success: ['bg-green-100 text-green-700', 'Succès'] }} /></td>
                      <td className="py-3 px-4"><Badge value={n.read ? 'yes' : 'no'} map={{ yes: ['bg-gray-100 text-gray-500', 'Oui'], no: ['bg-blue-50 text-blue-600', 'Non'] }} /></td>
                      <td className="py-3 px-4 text-xs text-gray-500">{n.createdAt ? new Date(n.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: Paramètres ────────────────────────────────────────────────────────
function SettingsTab() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    admin.getSystemSettings().then(r => setForm(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await admin.updateSystemSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  if (loading || !form) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-gray-300 border-t-gray-700 rounded-full animate-spin" /></div>;

  const fields = [
    { key: 'siteName', label: "Nom de l'application", type: 'text' },
    { key: 'supportEmail', label: 'Email support', type: 'email' },
    { key: 'supportPhone', label: 'Téléphone support', type: 'tel' },
    { key: 'commissionRate', label: 'Taux commission (%)', type: 'number' },
    { key: 'maxUploadSizeMB', label: 'Taille max upload (Mo)', type: 'number' },
    { key: 'tebeDatasetTarget', label: 'Cible dataset Tebe (images)', type: 'number' },
  ];

  const boolFields = [
    { key: 'maintenanceMode', label: 'Mode maintenance' },
    { key: 'requireEmailVerification', label: 'Vérification email obligatoire' },
  ];

  return (
    <form onSubmit={submit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
            <input type={type} value={form[key] ?? ''} onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]/30" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {boolFields.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" checked={!!form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="sr-only" />
              <div className={`w-10 h-5 rounded-full transition-colors ${form[key] ? 'bg-[#178A3B]' : 'bg-gray-200'}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-[#178A3B] text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
          <Save size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        {saved && <span className="text-xs text-green-700 font-medium">✓ Paramètres sauvegardés</span>}
      </div>
    </form>
  );
}

function KpiCard({ title, value, tone = 'default' }) {
  const tones = {
    default: 'bg-gray-50 border-gray-100 text-gray-700',
    success: 'bg-green-50 border-green-100 text-green-700',
    warning: 'bg-amber-50 border-amber-100 text-amber-700',
    danger: 'bg-red-50 border-red-100 text-red-700',
  };
  return (
    <div className={`border rounded-xl p-4 ${tones[tone] || tones.default}`}>
      <p className="text-xs uppercase tracking-wide opacity-70">{title}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function DatabaseTab() {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [backupsRes, analyticsRes] = await Promise.all([
        admin.getDatabaseBackups(),
        admin.getDatabaseAnalytics(),
      ]);
      setSnapshots(backupsRes.data.snapshots || []);
      setHistory(backupsRes.data.history || []);
      setAnalytics(analyticsRes.data || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useAutoRefresh(load);

  const doReset = async () => {
    if (!window.confirm('Confirmer la réinitialisation complète de la base vers les seeds ?')) return;
    setProcessing(true);
    try {
      await admin.resetDatabase({ reason: reason || 'Reset manuel depuis le backoffice' });
      setReason('');
      await load();
    } catch (error) {
      alert(error?.response?.data?.error || 'Échec de la réinitialisation');
    } finally {
      setProcessing(false);
    }
  };

  const doRestore = async (snapshotId) => {
    if (!window.confirm(`Restaurer la base à partir du snapshot ${snapshotId} ?`)) return;
    setProcessing(true);
    try {
      await admin.restoreDatabase(snapshotId, { reason: 'Restauration demandée depuis le backoffice' });
      await load();
    } catch (error) {
      alert(error?.response?.data?.error || 'Échec de la restauration');
    } finally {
      setProcessing(false);
    }
  };

  const currentKpis = analytics?.currentKpis || {};
  const summary = analytics?.summary || {};
  const averageImpactEntries = Object.entries(analytics?.averageImpact || {}).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-100 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Database size={16} className="text-red-600" />
          Réinitialiser la base de données
        </h3>
        <p className="text-sm text-red-700 mb-4">Cette action remet toutes les collections sur l’état seed et crée automatiquement un snapshot de sauvegarde.</p>
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Raison du reset (audit)"
            className="w-full md:flex-1 border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30"
          />
          <button
            onClick={doReset}
            disabled={processing || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {processing ? 'Traitement...' : 'Reset base'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KpiCard title="Événements" value={summary.totalEvents ?? 0} />
        <KpiCard title="Resets" value={summary.totalResets ?? 0} tone="warning" />
        <KpiCard title="Restores" value={summary.totalRestores ?? 0} tone="success" />
        <KpiCard title="Revenus" value={`${Number(currentKpis.revenue || 0).toLocaleString()} F`} tone="default" />
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><BarChart3 size={16} className="text-gray-500" /> KPI courants</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Utilisateurs</p><p className="font-semibold">{currentKpis.users ?? 0}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Éleveurs</p><p className="font-semibold">{currentKpis.farmers ?? 0}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Vétérinaires</p><p className="font-semibold">{currentKpis.veterinarians ?? 0}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Animaux</p><p className="font-semibold">{currentKpis.animals ?? 0}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Consultations</p><p className="font-semibold">{currentKpis.consultations ?? 0}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Ordonnances</p><p className="font-semibold">{currentKpis.prescriptions ?? 0}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Rendez-vous</p><p className="font-semibold">{currentKpis.appointments ?? 0}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Consultations actives</p><p className="font-semibold">{currentKpis.activeConsultations ?? 0}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Commandes</p><p className="font-semibold">{currentKpis.orders ?? 0}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Objets IoT</p><p className="font-semibold">{currentKpis.iotDevices ?? 0}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Alertes sanitaires</p><p className="font-semibold">{currentKpis.sanitaryAlerts ?? 0}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Revenus</p><p className="font-semibold">{Number(currentKpis.revenue || 0).toLocaleString()} F</p></div>
        </div>

        {averageImpactEntries.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Impact moyen par événement</p>
            <div className="flex flex-wrap gap-2">
              {averageImpactEntries.map(([k, v]) => (
                <span key={k} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{k}: {v}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Snapshots disponibles</h3>
            <button onClick={load} disabled={loading || processing} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          {snapshots.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Aucun snapshot disponible</p>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-auto pr-1">
              {snapshots.map((s) => (
                <div key={s.snapshotId} className="border border-gray-100 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-gray-600 break-all">{s.snapshotId}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(s.createdAt).toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-gray-500">{s.reason || 'Sans raison'}</p>
                  </div>
                  <button
                    onClick={() => doRestore(s.snapshotId)}
                    disabled={processing}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
                  >
                    <RotateCcw size={12} /> Restaurer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="font-bold text-gray-900 mb-3">Historique reset/restore</h3>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Aucun événement enregistré</p>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-auto pr-1">
              {history.map((h) => (
                <div key={h.id} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    <AlertTriangle size={13} className={h.action === 'reset' ? 'text-red-500' : 'text-blue-500'} />
                    {h.action === 'reset' ? 'Reset' : 'Restore'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(h.createdAt).toLocaleString('fr-FR')}</p>
                  <p className="text-xs text-gray-600 mt-1">{h.reason || 'Sans raison'}</p>
                  {h.backupSnapshotId && <p className="text-xs text-gray-500 mt-1">Backup: <span className="font-mono">{h.backupSnapshotId}</span></p>}
                  {h.restoredFromSnapshotId && <p className="text-xs text-gray-500 mt-1">Depuis: <span className="font-mono">{h.restoredFromSnapshotId}</span></p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SystemModule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'users';
  const setTab = (t) => setSearchParams(t === 'users' ? {} : { tab: t });

  const TAB_COMPONENTS = { users: <UsersTab />, payments: <PaymentsTab />, notifications: <NotificationsTab />, settings: <SettingsTab />, database: <DatabaseTab /> };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Système</h1>
          <p className="text-sm text-gray-500 mt-1">Configuration globale — utilisateurs, paiements, notifications, paramètres</p>
        </div>
        <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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
