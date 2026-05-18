import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { admin, sanitaryAlerts as sanitaryAlertsApi } from '../../API.js';
import {
  Search, RefreshCw, CheckCircle, XCircle, Trash2, Lock, Unlock,
  Pencil, Eye, X, Plus, AlertTriangle, MessageSquare, FileText,
  Stethoscope, Users, Dog, Calendar, MapPin, Phone, Mail,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
═══════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'vets',          label: '🩺 Vétérinaires' },
  { id: 'farmers',       label: '👨‍🌾 Éleveurs' },
  { id: 'animals',       label: '🐄 Animaux' },
  { id: 'consultations', label: '💬 Consultations' },
  { id: 'prescriptions', label: '📋 Ordonnances' },
  { id: 'appointments',  label: '📅 Rendez-vous' },
  { id: 'sanitary',      label: '⚠️ Alertes Sanitaires' },
];

const STATUS_CONSULT   = { active: ['bg-green-100 text-green-700', 'Active'], closed: ['bg-gray-100 text-gray-500', 'Fermée'], pending: ['bg-yellow-100 text-yellow-700', 'En attente'] };
const STATUS_APPT      = { scheduled: ['bg-blue-100 text-blue-700', 'Planifié'], completed: ['bg-green-100 text-green-700', 'Terminé'], cancelled: ['bg-red-100 text-red-600', 'Annulé'] };
const SEVERITY_MAP     = { critical: ['bg-red-100 text-red-700', '🔴 Critique'], high: ['bg-orange-100 text-orange-700', '🟠 Élevé'], medium: ['bg-yellow-100 text-yellow-700', '🟡 Moyen'], low: ['bg-gray-100 text-gray-500', '⚪ Faible'] };
const ANIMAL_STATUS    = { healthy: ['bg-green-100 text-green-700', '✅ Sain'], sick: ['bg-red-100 text-red-600', '🤒 Malade'], deceased: ['bg-gray-200 text-gray-600', '💀 Décédé'], treating: ['bg-yellow-100 text-yellow-700', '💊 Traitement'] };
const PRIORITY_MAP     = { high: ['bg-red-100 text-red-600', 'Haute'], medium: ['bg-yellow-100 text-yellow-700', 'Moyenne'], low: ['bg-gray-100 text-gray-500', 'Faible'] };

function Badge({ value, map }) {
  const [cls, label] = (map && map[value]) || ['bg-gray-100 text-gray-600', value || '—'];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${cls}`}>{label}</span>;
}

function StatBar({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {items.map(({ label, value, color = 'bg-gray-50 text-gray-700' }) => (
        <div key={label} className={`${color} rounded-lg px-4 py-2.5 flex items-center justify-between`}>
          <span className="text-xs font-medium opacity-80">{label}</span>
          <span className="text-xl font-bold">{value ?? 0}</span>
        </div>
      ))}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <div className="relative mb-4">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#178A3B]/30" />
    </div>
  );
}

function Table({ cols, rows, empty = 'Aucune donnée' }) {
  if (!rows.length) return <div className="text-center py-12 text-gray-400 text-sm">{empty}</div>;
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
              {cols.map(c => <td key={c.key} className="py-3 px-4 text-gray-700">{c.render ? c.render(row) : (row[c.key] ?? '—')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeader({ title, count, onRefresh, loading, actions }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold text-gray-900">{title} <span className="text-gray-400 font-normal text-sm">({count})</span></h2>
      <div className="flex items-center gap-2">
        {actions}
        <button onClick={onRefresh} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}

/* Drawer générique */
function Drawer({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className={`${width} w-full bg-white shadow-2xl flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/* Modal générique */
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function useFilter(items, fields) {
  const [q, setQ] = useState('');
  const filtered = q ? items.filter(i => fields.some(f => String(i[f] || '').toLowerCase().includes(q.toLowerCase()))) : items;
  return [filtered, q, setQ];
}

function useAutoRefresh(load) {
  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: VÉTÉRINAIRES
═══════════════════════════════════════════════════════════════════════════ */
function VetsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, q, setQ] = useFilter(data, ['name', 'email', 'specialization', 'city', 'licenseNumber']);
  const [selected, setSelected] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    admin.getVets().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const toggle = async (id, blocked) => {
    await admin.toggleVetStatus(id);
    setData(prev => prev.map(v => v.id === id ? { ...v, blocked: !blocked } : v));
  };

  const saveEdit = async (vet) => {
    const r = await admin.updateVet(vet.id, vet);
    setData(prev => prev.map(v => v.id === vet.id ? r.data : v));
    setEditModal(null);
  };

  const display = filterStatus === 'all' ? filtered
    : filterStatus === 'blocked' ? filtered.filter(v => v.blocked)
    : filterStatus === 'available' ? filtered.filter(v => v.isAvailable && !v.blocked)
    : filtered.filter(v => !v.blocked);

  const stats = [
    { label: 'Total', value: data.length, color: 'bg-blue-50 text-blue-700' },
    { label: 'Actifs', value: data.filter(v => !v.blocked).length, color: 'bg-green-50 text-green-700' },
    { label: 'Suspendus', value: data.filter(v => v.blocked).length, color: 'bg-red-50 text-red-600' },
    { label: 'Disponibles', value: data.filter(v => v.isAvailable && !v.blocked).length, color: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div>
      <SectionHeader title="Vétérinaires" count={display.length} onRefresh={load} loading={loading} />
      <StatBar items={stats} />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Nom, email, spécialisation, ville..." />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-xs">
          {[['all','Tous'],['active','Actifs'],['blocked','Suspendus'],['available','Disponibles']].map(([v,l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 rounded-md font-medium transition ${filterStatus === v ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>{l}</button>
          ))}
        </div>
      </div>

      <Table
        cols={[
          { key: 'name', label: 'Nom', render: r => (
            <div>
              <p className="font-medium text-gray-900">{r.name}</p>
              <p className="text-xs text-gray-400">{r.email}</p>
            </div>
          )},
          { key: 'specialization', label: 'Spécialisation', render: r => r.specialization || 'Généraliste' },
          { key: 'licenseNumber', label: 'Licence', render: r => <span className="font-mono text-xs">{r.licenseNumber || '—'}</span> },
          { key: 'city', label: 'Ville', render: r => r.city || '—' },
          { key: 'isAvailable', label: 'Dispo', render: r => <Badge value={r.isAvailable ? 'yes' : 'no'} map={{ yes: ['bg-green-100 text-green-700', '✓ Oui'], no: ['bg-gray-100 text-gray-500', '✗ Non'] }} /> },
          { key: 'blocked', label: 'Statut', render: r => <Badge value={r.blocked ? 'blocked' : 'active'} map={{ active: ['bg-green-100 text-green-700', 'Actif'], blocked: ['bg-red-100 text-red-600', 'Suspendu'] }} /> },
          { key: 'actions', label: '', render: r => (
            <div className="flex gap-1.5">
              <button onClick={() => setSelected(r)} className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition" title="Voir profil"><Eye size={14} /></button>
              <button onClick={() => setEditModal({ ...r })} className="p-1.5 rounded text-amber-500 hover:bg-amber-50 transition" title="Modifier"><Pencil size={14} /></button>
              <button onClick={() => toggle(r.id, r.blocked)} className={`p-1.5 rounded transition ${r.blocked ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`} title={r.blocked ? 'Réactiver' : 'Suspendre'}>
                {r.blocked ? <Unlock size={14} /> : <Lock size={14} />}
              </button>
            </div>
          )},
        ]}
        rows={display}
        empty="Aucun vétérinaire trouvé"
      />

      {/* Profil drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Profil vétérinaire">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#178A3B]/10 flex items-center justify-center text-2xl font-bold text-[#178A3B]">
                {selected.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{selected.name}</p>
                <p className="text-sm text-gray-500">{selected.specialization || 'Médecin Vétérinaire Généraliste'}</p>
                <Badge value={selected.blocked ? 'blocked' : 'active'} map={{ active: ['bg-green-100 text-green-700', 'Actif'], blocked: ['bg-red-100 text-red-600', 'Suspendu'] }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Email', selected.email, Mail],
                ['Téléphone', selected.phone || '—', Phone],
                ['Ville', selected.city || '—', MapPin],
                ['N° Licence', selected.licenseNumber || '—', FileText],
                ['Zone', selected.zone || '—', MapPin],
                ['Disponible', selected.isAvailable ? 'Oui' : 'Non', CheckCircle],
              ].map(([label, value, Icon]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1"><Icon size={12} className="text-gray-400" /><span className="text-xs text-gray-500">{label}</span></div>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              ))}
            </div>
            {selected.languages?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Langues</p>
                <div className="flex flex-wrap gap-1">{selected.languages.map(l => <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{l}</span>)}</div>
              </div>
            )}
            {selected.availableDays?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Jours disponibles · {selected.availableFrom || '08:00'} — {selected.availableTo || '18:00'}</p>
                <div className="flex flex-wrap gap-1">{selected.availableDays.map(d => <span key={d} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{d}</span>)}</div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => { toggle(selected.id, selected.blocked); setSelected(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${selected.blocked ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                {selected.blocked ? 'Réactiver le compte' : 'Suspendre le compte'}
              </button>
              <button onClick={() => { setEditModal({ ...selected }); setSelected(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition">
                Modifier
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Edit modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Modifier le vétérinaire">
        {editModal && <VetEditForm vet={editModal} onSave={saveEdit} onCancel={() => setEditModal(null)} />}
      </Modal>
    </div>
  );
}

function VetEditForm({ vet, onSave, onCancel }) {
  const [form, setForm] = useState({ ...vet });
  const [saving, setSaving] = useState(false);
  const f = (k) => ({ value: form[k] || '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });
  const submit = async (e) => { e.preventDefault(); setSaving(true); try { await onSave(form); } finally { setSaving(false); } };
  return (
    <form onSubmit={submit} className="space-y-3">
      {[['name','Nom'], ['specialization','Spécialisation'], ['licenseNumber','N° Licence'], ['city','Ville'], ['zone','Zone'], ['phone','Téléphone']].map(([k, label]) => (
        <div key={k}>
          <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
          <input {...f(k)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#178A3B]/30" />
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <input type="checkbox" id="isAvailable" checked={!!form.isAvailable} onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))} className="rounded" />
        <label htmlFor="isAvailable" className="text-sm text-gray-700">Disponible pour consultations</label>
      </div>
      <div className="flex gap-3 pt-3">
        <button type="button" onClick={onCancel} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annuler</button>
        <button type="submit" disabled={saving} className="flex-1 py-2 bg-[#178A3B] text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: ÉLEVEURS
═══════════════════════════════════════════════════════════════════════════ */
function FarmersTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, q, setQ] = useFilter(data, ['name', 'email', 'farmName', 'phone', 'domicile']);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    admin.getFarmers().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const toggleBlock = async (id, blocked) => {
    await admin.toggleSystemUserBlock(id);
    setData(prev => prev.map(f => f.id === id ? { ...f, blocked: !blocked } : f));
  };

  const display = filterStatus === 'all' ? filtered
    : filterStatus === 'blocked' ? filtered.filter(f => f.blocked)
    : filtered.filter(f => !f.blocked);

  const stats = [
    { label: 'Total', value: data.length, color: 'bg-blue-50 text-blue-700' },
    { label: 'Actifs', value: data.filter(f => !f.blocked).length, color: 'bg-green-50 text-green-700' },
    { label: 'Suspendus', value: data.filter(f => f.blocked).length, color: 'bg-red-50 text-red-600' },
    { label: 'Vérifiés', value: data.filter(f => f.isVerified).length, color: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div>
      <SectionHeader title="Éleveurs" count={display.length} onRefresh={load} loading={loading} />
      <StatBar items={stats} />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Nom, email, ferme, domicile..." />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-xs">
          {[['all','Tous'],['active','Actifs'],['blocked','Suspendus']].map(([v,l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 rounded-md font-medium transition ${filterStatus === v ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>{l}</button>
          ))}
        </div>
      </div>

      <Table
        cols={[
          { key: 'name', label: 'Nom', render: r => (
            <div><p className="font-medium text-gray-900">{r.name}</p><p className="text-xs text-gray-400">{r.email}</p></div>
          )},
          { key: 'phone', label: 'Téléphone', render: r => r.phone || '—' },
          { key: 'farmName', label: 'Ferme', render: r => r.farmName || '—' },
          { key: 'domicile', label: 'Localisation', render: r => r.domicile || r.city || '—' },
          { key: 'isVerified', label: 'Vérifié', render: r => <Badge value={r.isVerified ? 'yes' : 'no'} map={{ yes: ['bg-green-100 text-green-700', '✓ Oui'], no: ['bg-gray-100 text-gray-500', '✗ Non'] }} /> },
          { key: 'blocked', label: 'Statut', render: r => <Badge value={r.blocked ? 'blocked' : 'active'} map={{ active: ['bg-green-100 text-green-700', 'Actif'], blocked: ['bg-red-100 text-red-600', 'Suspendu'] }} /> },
          { key: 'createdAt', label: 'Inscrit', render: r => r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '—' },
          { key: 'actions', label: '', render: r => (
            <div className="flex gap-1.5">
              <button onClick={() => setSelected(r)} className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition" title="Détails"><Eye size={14} /></button>
              <button onClick={() => toggleBlock(r.id, r.blocked)} className={`p-1.5 rounded transition ${r.blocked ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`} title={r.blocked ? 'Réactiver' : 'Suspendre'}>
                {r.blocked ? <Unlock size={14} /> : <Lock size={14} />}
              </button>
            </div>
          )},
        ]}
        rows={display}
        empty="Aucun éleveur trouvé"
      />

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Profil éleveur">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-2xl font-bold text-amber-700">
                {selected.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{selected.name}</p>
                <p className="text-sm text-gray-500">{selected.farmName || 'Éleveur indépendant'}</p>
                <Badge value={selected.blocked ? 'blocked' : 'active'} map={{ active: ['bg-green-100 text-green-700', 'Actif'], blocked: ['bg-red-100 text-red-600', 'Suspendu'] }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Email', selected.email], ['Téléphone', selected.phone || '—'], ['Domicile', selected.domicile || '—'], ['Ferme', selected.farmName || '—'], ['Genre', selected.gender || '—'], ['Rôle ferme', selected.farmRole || '—']].map(([l, v]) => (
                <div key={l} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{l}</p>
                  <p className="text-sm font-medium text-gray-800 break-all">{v}</p>
                </div>
              ))}
            </div>
            {selected.farmCategories?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Catégories d'élevage</p>
                <div className="flex flex-wrap gap-1">{selected.farmCategories.map(c => <span key={c} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{c}</span>)}</div>
              </div>
            )}
            <button onClick={() => { toggleBlock(selected.id, selected.blocked); setSelected(null); }}
              className={`w-full py-2 rounded-lg text-sm font-medium transition ${selected.blocked ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-500 text-white hover:bg-red-600'}`}>
              {selected.blocked ? 'Réactiver le compte' : 'Suspendre le compte'}
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: ANIMAUX
═══════════════════════════════════════════════════════════════════════════ */
function AnimalsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, q, setQ] = useFilter(data, ['name', 'type', 'breed', 'ownerName']);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    admin.getAnimals().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet animal définitivement ?')) return;
    await admin.deleteAnimal(id);
    setData(prev => prev.filter(a => a.id !== id));
  };

  const updateStatus = async (id, status) => {
    await admin.updateAnimal(id, { status });
    setData(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const types = ['all', ...new Set(data.map(a => a.type).filter(Boolean))];
  const display = filtered
    .filter(a => filterType === 'all' || a.type === filterType)
    .filter(a => filterStatus === 'all' || a.status === filterStatus);

  const stats = [
    { label: 'Total', value: data.length, color: 'bg-blue-50 text-blue-700' },
    { label: 'Sains', value: data.filter(a => a.status === 'healthy').length, color: 'bg-green-50 text-green-700' },
    { label: 'Malades', value: data.filter(a => a.status === 'sick').length, color: 'bg-red-50 text-red-600' },
    { label: 'En traitement', value: data.filter(a => a.status === 'treating').length, color: 'bg-yellow-50 text-yellow-700' },
  ];

  return (
    <div>
      <SectionHeader title="Animaux" count={display.length} onRefresh={load} loading={loading} />
      <StatBar items={stats} />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Nom, type, race, propriétaire..." />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-xs flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition ${filterType === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>{t === 'all' ? 'Tous types' : t}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-xs">
          {[['all','Tous états'],['healthy','Sain'],['sick','Malade'],['treating','Traitement'],['deceased','Décédé']].map(([v,l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 rounded-md font-medium transition ${filterStatus === v ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>{l}</button>
          ))}
        </div>
      </div>

      <Table
        cols={[
          { key: 'name', label: 'Animal', render: r => (
            <div><p className="font-medium text-gray-900">{r.name}</p><p className="text-xs text-gray-400 capitalize">{r.type} — {r.breed || '—'}</p></div>
          )},
          { key: 'ownerName', label: 'Propriétaire' },
          { key: 'weight', label: 'Poids', render: r => r.weight ? `${r.weight} kg` : '—' },
          { key: 'birthDate', label: 'Naissance', render: r => r.birthDate ? new Date(r.birthDate).toLocaleDateString('fr-FR') : '—' },
          { key: 'collarId', label: 'Collier IoT', render: r => r.collarId ? <span className="font-mono text-xs">{r.collarId}</span> : <span className="text-gray-300">—</span> },
          { key: 'status', label: 'État', render: r => (
            <select value={r.status || 'healthy'} onChange={e => updateStatus(r.id, e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#178A3B]/30">
              {['healthy','sick','treating','deceased'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )},
          { key: 'actions', label: '', render: r => (
            <div className="flex gap-1.5">
              <button onClick={() => setSelected(r)} className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition" title="Détails"><Eye size={14} /></button>
              <button onClick={() => remove(r.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition" title="Supprimer"><Trash2 size={14} /></button>
            </div>
          )},
        ]}
        rows={display}
        empty="Aucun animal trouvé"
      />

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Dossier animal">
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
              {[['Nom', selected.name], ['Type', selected.type], ['Race', selected.breed || '—'], ['Poids', selected.weight ? `${selected.weight} kg` : '—'], ['Naissance', selected.birthDate ? new Date(selected.birthDate).toLocaleDateString('fr-FR') : '—'], ['Propriétaire', selected.ownerName || '—']].map(([l, v]) => (
                <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="text-sm font-semibold text-gray-800">{v}</p></div>
              ))}
            </div>
            {selected.vaccinations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Vaccinations</p>
                <div className="space-y-1">{selected.vaccinations.map((v, i) => <div key={i} className="flex items-center gap-2 text-sm"><CheckCircle size={13} className="text-green-500" />{v}</div>)}</div>
              </div>
            )}
            {selected.collarId && (
              <div className="bg-sky-50 border border-sky-100 rounded-lg p-3">
                <p className="text-xs text-sky-600 font-semibold">Collier IoT</p>
                <p className="font-mono text-sm text-sky-800 mt-0.5">{selected.collarId}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: CONSULTATIONS
═══════════════════════════════════════════════════════════════════════════ */
function ConsultationsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, q, setQ] = useFilter(data, ['farmerName', 'veterinarianName', 'subject', 'animalName']);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    admin.getConsultations().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const close = async (id) => {
    await admin.closeConsultation(id);
    setData(prev => prev.map(c => c.id === id ? { ...c, status: 'closed' } : c));
  };

  const display = filtered
    .filter(c => filterStatus === 'all' || c.status === filterStatus)
    .filter(c => filterPriority === 'all' || c.priority === filterPriority);

  const stats = [
    { label: 'Total', value: data.length, color: 'bg-blue-50 text-blue-700' },
    { label: 'Actives', value: data.filter(c => c.status === 'active').length, color: 'bg-green-50 text-green-700' },
    { label: 'En attente', value: data.filter(c => c.status === 'pending').length, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Fermées', value: data.filter(c => c.status === 'closed').length, color: 'bg-gray-50 text-gray-600' },
  ];

  return (
    <div>
      <SectionHeader title="Consultations" count={display.length} onRefresh={load} loading={loading} />
      <StatBar items={stats} />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Éleveur, vétérinaire, animal, sujet..." />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-xs">
          {[['all','Tous'],['active','Actives'],['pending','En attente'],['closed','Fermées']].map(([v,l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 rounded-md font-medium transition ${filterStatus === v ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-xs">
          {[['all','Toutes priorités'],['high','Haute'],['medium','Moyenne'],['low','Faible']].map(([v,l]) => (
            <button key={v} onClick={() => setFilterPriority(v)}
              className={`px-3 py-1.5 rounded-md font-medium transition ${filterPriority === v ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>{l}</button>
          ))}
        </div>
      </div>

      <Table
        cols={[
          { key: 'subject', label: 'Sujet / Animal', render: r => (
            <div><p className="font-medium text-gray-900 max-w-xs truncate">{r.subject || r.animalName}</p>
            <p className="text-xs text-gray-400">{r.animalName || ''}</p></div>
          )},
          { key: 'farmerName', label: 'Éleveur' },
          { key: 'veterinarianName', label: 'Vétérinaire' },
          { key: 'messages', label: 'Messages', render: r => (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MessageSquare size={12} />{Array.isArray(r.messages) ? r.messages.length : 0}
            </span>
          )},
          { key: 'priority', label: 'Priorité', render: r => <Badge value={r.priority} map={PRIORITY_MAP} /> },
          { key: 'status', label: 'Statut', render: r => <Badge value={r.status} map={STATUS_CONSULT} /> },
          { key: 'createdAt', label: 'Date', render: r => r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '—' },
          { key: 'actions', label: '', render: r => (
            <div className="flex gap-1.5">
              <button onClick={() => setSelected(r)} className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition" title="Voir messages"><MessageSquare size={14} /></button>
              {r.status === 'active' && <button onClick={() => close(r.id)} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition">Fermer</button>}
            </div>
          )},
        ]}
        rows={display}
        empty="Aucune consultation trouvée"
      />

      {/* Messages drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={`Consultation — ${selected?.subject || selected?.animalName || ''}`} width="max-w-xl">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['Éleveur', selected.farmerName], ['Vétérinaire', selected.veterinarianName], ['Animal', selected.animalName || '—'], ['Priorité', selected.priority || '—']].map(([l, v]) => (
                <div key={l} className="bg-gray-50 rounded-lg p-2.5"><p className="text-xs text-gray-400 mb-0.5">{l}</p><p className="text-sm font-semibold text-gray-800">{v}</p></div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Fil de messages ({Array.isArray(selected.messages) ? selected.messages.length : 0})</p>
              <div className="flex gap-2">
                <Badge value={selected.priority} map={PRIORITY_MAP} />
                <Badge value={selected.status} map={STATUS_CONSULT} />
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Array.isArray(selected.messages) && selected.messages.length > 0 ? selected.messages.map((m, i) => (
                <div key={m.id || i} className={`flex gap-3 ${m.senderId === selected.veterinarianId ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.senderId === selected.veterinarianId ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {(m.senderName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex-1 ${m.senderId === selected.veterinarianId ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`rounded-xl px-3 py-2 max-w-sm text-sm ${m.senderId === selected.veterinarianId ? 'bg-blue-50 text-blue-900 rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                      {m.content}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{m.senderName} · {m.timestamp ? new Date(m.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : ''}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-400 text-center py-6">Aucun message</p>}
            </div>
            {selected.status === 'active' && (
              <button onClick={() => { close(selected.id); setSelected(null); }}
                className="w-full py-2 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 transition">
                Fermer cette consultation
              </button>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: ORDONNANCES
═══════════════════════════════════════════════════════════════════════════ */
function PrescriptionsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, q, setQ] = useFilter(data, ['farmerName', 'vetName', 'veterinarianName', 'animalName', 'diagnosis']);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    admin.getPrescriptions().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  return (
    <div>
      <SectionHeader title="Ordonnances" count={filtered.length} onRefresh={load} loading={loading} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {[['Total', data.length, 'bg-blue-50 text-blue-700'], ['Ce mois', data.filter(p => { const d = new Date(p.createdAt || 0); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length, 'bg-green-50 text-green-700'], ['Avec médicaments', data.filter(p => Array.isArray(p.medications) && p.medications.length > 0).length, 'bg-purple-50 text-purple-700']].map(([l, v, c]) => (
          <div key={l} className={`${c} rounded-lg px-4 py-2.5 flex items-center justify-between`}><span className="text-xs font-medium opacity-80">{l}</span><span className="text-xl font-bold">{v}</span></div>
        ))}
      </div>

      <SearchBar value={q} onChange={setQ} placeholder="Éleveur, vétérinaire, animal, diagnostic..." />

      <Table
        cols={[
          { key: 'id', label: 'Réf.', render: r => <span className="font-mono text-xs text-gray-500">{String(r.id || '').slice(0, 8).toUpperCase()}</span> },
          { key: 'vetName', label: 'Vétérinaire', render: r => r.vetName || r.veterinarianName || '—' },
          { key: 'farmerName', label: 'Éleveur', render: r => r.farmerName || '—' },
          { key: 'animalName', label: 'Animal', render: r => r.animalName || '—' },
          { key: 'diagnosis', label: 'Diagnostic', render: r => <span className="max-w-xs truncate block text-xs">{r.diagnosis || '—'}</span> },
          { key: 'medications', label: 'Médicaments', render: r => Array.isArray(r.medications) ? (
            <span className="text-xs">{r.medications.length} médicament{r.medications.length > 1 ? 's' : ''}</span>
          ) : '—' },
          { key: 'createdAt', label: 'Date', render: r => r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '—' },
          { key: 'actions', label: '', render: r => (
            <button onClick={() => setSelected(r)} className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition" title="Voir détails"><Eye size={14} /></button>
          )},
        ]}
        rows={filtered}
        empty="Aucune ordonnance"
      />

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={`Ordonnance — ${selected?.id?.slice(0, 8).toUpperCase() || ''}`}>
        {selected && (
          <div className="space-y-4">
            <div className="border border-[#178A3B]/30 rounded-xl p-4 bg-[#178A3B]/5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-[#178A3B]">🏥 MokineVeto — Ordonnance Médicale</p>
                <p className="text-xs text-gray-500">{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('fr-FR') : ''}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[['Vétérinaire', selected.vetName || selected.veterinarianName || '—'], ['Éleveur', selected.farmerName || '—'], ['Animal', selected.animalName || '—'], ['Diagnostic', selected.diagnosis || '—']].map(([l, v]) => (
                  <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="font-semibold text-gray-800">{v}</p></div>
                ))}
              </div>
            </div>

            {Array.isArray(selected.medications) && selected.medications.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">Médicaments prescrits</p>
                <div className="space-y-2">
                  {selected.medications.map((m, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">{i + 1}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{m.name || m}</p>
                        {m.dosage && <p className="text-xs text-gray-500 mt-0.5">Dosage : {m.dosage}</p>}
                        {m.frequency && <p className="text-xs text-gray-500">Fréquence : {m.frequency}</p>}
                        {m.duration && <p className="text-xs text-gray-500">Durée : {m.duration}</p>}
                        {m.instructions && <p className="text-xs text-gray-600 mt-1 italic">"{m.instructions}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.notes && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-yellow-800 mb-1">Notes du vétérinaire</p>
                <p className="text-sm text-yellow-900">{selected.notes}</p>
              </div>
            )}

            {selected.followUpDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={15} className="text-gray-400" />
                <span className="text-gray-600">Suivi prévu le <strong>{new Date(selected.followUpDate).toLocaleDateString('fr-FR')}</strong></span>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: RENDEZ-VOUS
═══════════════════════════════════════════════════════════════════════════ */
function AppointmentsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    admin.getAppointments().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const updateStatus = async (id, status) => {
    await admin.updateAppointmentStatus(id, status);
    setData(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const filtered = data
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .filter(a => !q || [a.veterinarianName, a.reason, a.animalName].some(f => String(f || '').toLowerCase().includes(q.toLowerCase())));

  const stats = [
    { label: 'Total', value: data.length, color: 'bg-blue-50 text-blue-700' },
    { label: 'Planifiés', value: data.filter(a => a.status === 'scheduled').length, color: 'bg-sky-50 text-sky-700' },
    { label: 'Terminés', value: data.filter(a => a.status === 'completed').length, color: 'bg-green-50 text-green-700' },
    { label: 'Annulés', value: data.filter(a => a.status === 'cancelled').length, color: 'bg-red-50 text-red-600' },
  ];

  // Group upcoming by date
  const upcoming = data.filter(a => a.status === 'scheduled' && new Date(a.dateTime) > new Date())
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
    .slice(0, 5);

  return (
    <div>
      <SectionHeader title="Rendez-vous" count={filtered.length} onRefresh={load} loading={loading} />
      <StatBar items={stats} />

      {/* Upcoming appointments highlight */}
      {upcoming.length > 0 && (
        <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 mb-3">📅 Prochains rendez-vous</p>
          <div className="space-y-2">
            {upcoming.map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 text-sm">
                <div className="text-center bg-blue-100 rounded-lg px-2 py-1 flex-shrink-0">
                  <p className="text-xs font-bold text-blue-800">{new Date(a.dateTime).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                  <p className="text-xs text-blue-600">{new Date(a.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{a.veterinarianName || '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{a.reason || '—'}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => updateStatus(a.id, 'completed')} className="p-1.5 rounded text-green-600 hover:bg-green-50 transition" title="Marquer terminé"><CheckCircle size={14} /></button>
                  <button onClick={() => updateStatus(a.id, 'cancelled')} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition" title="Annuler"><XCircle size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={q} onChange={setQ} placeholder="Vétérinaire, motif, animal..." />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-xs">
          {[['all','Tous'],['scheduled','Planifiés'],['completed','Terminés'],['cancelled','Annulés']].map(([v,l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 rounded-md font-medium transition ${filterStatus === v ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>{l}</button>
          ))}
        </div>
      </div>

      <Table
        cols={[
          { key: 'veterinarianName', label: 'Vétérinaire', render: r => r.veterinarianName || '—' },
          { key: 'animalId', label: 'Animal', render: r => r.animalName || r.animalId || '—' },
          { key: 'dateTime', label: 'Date & Heure', render: r => r.dateTime ? new Date(r.dateTime).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : '—' },
          { key: 'reason', label: 'Motif', render: r => <span className="max-w-xs truncate block text-xs">{r.reason || '—'}</span> },
          { key: 'status', label: 'Statut', render: r => <Badge value={r.status} map={STATUS_APPT} /> },
          { key: 'actions', label: '', render: r => r.status === 'scheduled' ? (
            <div className="flex gap-1.5">
              <button onClick={() => updateStatus(r.id, 'completed')} className="p-1.5 rounded text-green-600 hover:bg-green-50 transition" title="Terminé"><CheckCircle size={14} /></button>
              <button onClick={() => updateStatus(r.id, 'cancelled')} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition" title="Annuler"><XCircle size={14} /></button>
            </div>
          ) : null },
        ]}
        rows={filtered.sort((a, b) => new Date(b.dateTime || 0) - new Date(a.dateTime || 0))}
        empty="Aucun rendez-vous"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: ALERTES SANITAIRES
═══════════════════════════════════════════════════════════════════════════ */
function SanitaryTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSev, setFilterSev] = useState('all');
  const [filterVerified, setFilterVerified] = useState('all');
  const [createModal, setCreateModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    admin.getSanitaryAlerts().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const verify = async (id) => {
    await admin.verifySanitaryAlert(id);
    setData(prev => prev.map(a => a.id === id ? { ...a, verified: true } : a));
  };
  const remove = async (id) => {
    if (!window.confirm('Supprimer cette alerte ?')) return;
    await admin.deleteSanitaryAlert(id);
    setData(prev => prev.filter(a => a.id !== id));
  };

  const display = data
    .filter(a => filterSev === 'all' || a.severity === filterSev)
    .filter(a => filterVerified === 'all' || (filterVerified === 'yes' ? a.verified : !a.verified));

  const stats = [
    { label: 'Total', value: data.length, color: 'bg-blue-50 text-blue-700' },
    { label: 'Critiques', value: data.filter(a => a.severity === 'critical').length, color: 'bg-red-50 text-red-700' },
    { label: 'Non vérifiées', value: data.filter(a => !a.verified).length, color: 'bg-orange-50 text-orange-700' },
    { label: 'Vérifiées', value: data.filter(a => a.verified).length, color: 'bg-green-50 text-green-700' },
  ];

  return (
    <div>
      <SectionHeader title="Alertes Sanitaires" count={display.length} onRefresh={load} loading={loading}
        actions={
          <button onClick={() => setCreateModal(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium">
            <Plus size={13} /> Créer alerte
          </button>
        }
      />
      <StatBar items={stats} />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-xs">
          {[['all','Toutes sévérités'],['critical','Critique'],['high','Élevé'],['medium','Moyen'],['low','Faible']].map(([v,l]) => (
            <button key={v} onClick={() => setFilterSev(v)}
              className={`px-3 py-1.5 rounded-md font-medium transition ${filterSev === v ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-xs">
          {[['all','Toutes'],['no','Non vérifiées'],['yes','Vérifiées']].map(([v,l]) => (
            <button key={v} onClick={() => setFilterVerified(v)}
              className={`px-3 py-1.5 rounded-md font-medium transition ${filterVerified === v ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {display.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">Aucune alerte sanitaire</div>
        : display.map(a => (
          <div key={a.id} className={`border rounded-xl p-4 transition ${a.severity === 'critical' ? 'border-red-200 bg-red-50' : a.severity === 'high' ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge value={a.severity} map={SEVERITY_MAP} />
                  <Badge value={a.verified ? 'yes' : 'no'} map={{ yes: ['bg-green-100 text-green-700', '✓ Vérifié'], no: ['bg-red-100 text-red-600', '✗ Non vérifié'] }} />
                  {a.type && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.type}</span>}
                </div>
                <p className="text-sm font-medium text-gray-900 leading-snug">{a.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                  {a.city && <span className="flex items-center gap-1"><MapPin size={11} />{a.city}</span>}
                  {a.animalType && <span>🐄 {a.animalType}</span>}
                  {a.affectedCount && <span>⚠️ {a.affectedCount} affecté(s)</span>}
                  {a.reportedBy && <span>Signalé par {a.reportedBy}</span>}
                  <span>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('fr-FR') : '—'}</span>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => setSelected(a)} className="p-1.5 rounded text-blue-500 hover:bg-blue-100 transition" title="Détails"><Eye size={14} /></button>
                {!a.verified && (
                  <button onClick={() => verify(a.id)} className="p-1.5 rounded text-green-600 hover:bg-green-100 transition" title="Vérifier"><CheckCircle size={14} /></button>
                )}
                <button onClick={() => remove(a.id)} className="p-1.5 rounded text-red-500 hover:bg-red-100 transition" title="Supprimer"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Détail alerte */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Détail alerte sanitaire">
        {selected && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge value={selected.severity} map={SEVERITY_MAP} />
              <Badge value={selected.verified ? 'yes' : 'no'} map={{ yes: ['bg-green-100 text-green-700', '✓ Vérifié'], no: ['bg-red-100 text-red-600', '✗ Non vérifié'] }} />
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{selected.description}</p>
            <div className="grid grid-cols-2 gap-3">
              {[['Type', selected.type || '—'], ['Animal', selected.animalType || '—'], ['Ville', selected.city || '—'], ['Affectés', selected.affectedCount ?? '—'], ['Signalé par', selected.reportedBy || '—'], ['Rôle', selected.reportedByRole || '—'], ['Rayon', selected.radius ? `${selected.radius} km` : '—'], ['Date', selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('fr-FR') : '—']].map(([l, v]) => (
                <div key={l} className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400 mb-0.5">{l}</p><p className="text-sm font-semibold text-gray-800">{v}</p></div>
              ))}
            </div>
            {selected.location && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">📍 Coordonnées GPS</p>
                <p className="font-mono text-sm text-blue-800">Lat: {selected.location.lat} · Lon: {selected.location.lon}</p>
              </div>
            )}
            {!selected.verified && (
              <button onClick={() => { verify(selected.id); setSelected(null); }}
                className="w-full py-2.5 rounded-lg bg-[#178A3B] text-white text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-2">
                <CheckCircle size={15} /> Vérifier et valider cette alerte
              </button>
            )}
          </div>
        )}
      </Drawer>

      {/* Créer alerte */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Créer une alerte sanitaire">
        <CreateAlertForm onClose={() => setCreateModal(false)} onCreated={(a) => { setData(prev => [a, ...prev]); setCreateModal(false); }} />
      </Modal>
    </div>
  );
}

function CreateAlertForm({ onClose, onCreated }) {
  const [form, setForm] = useState({ type: 'symptom', severity: 'medium', animalType: 'cattle', description: '', city: '', affectedCount: '', radius: 10, reportedBy: 'Admin Mokine', reportedByRole: 'admin' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await sanitaryAlertsApi.create({ ...form, affectedCount: Number(form.affectedCount) || 0, verified: true });
      onCreated(r.data?.alert || r.data);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
          <select value={form.type} onChange={set('type')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30">
            {['epidemic','symptom','contamination','quarantine'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Sévérité *</label>
          <select value={form.severity} onChange={set('severity')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30">
            {['critical','high','medium','low'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type d'animal *</label>
          <select value={form.animalType} onChange={set('animalType')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30">
            {['cattle','goat','sheep','pig','poultry','horse','all'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ville</label>
          <input value={form.city} onChange={set('city')} placeholder="Ex: Yaoundé" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Animaux affectés</label>
          <input type="number" value={form.affectedCount} onChange={set('affectedCount')} min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Rayon (km)</label>
          <input type="number" value={form.radius} onChange={set('radius')} min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description * <span className="text-gray-400 font-normal">(symptômes, contexte)</span></label>
        <textarea value={form.description} onChange={set('description')} required rows={3} placeholder="Décrivez l'alerte sanitaire en détail..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annuler</button>
        <button type="submit" disabled={saving} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
          {saving ? 'Création...' : 'Créer l\'alerte'}
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN MODULE
═══════════════════════════════════════════════════════════════════════════ */
export default function VetoModule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'vets';
  const setTab = (t) => setSearchParams(t === 'vets' ? {} : { tab: t });

  const TAB_COMPONENTS = {
    vets:          <VetsTab />,
    farmers:       <FarmersTab />,
    animals:       <AnimalsTab />,
    consultations: <ConsultationsTab />,
    prescriptions: <PrescriptionsTab />,
    appointments:  <AppointmentsTab />,
    sanitary:      <SanitaryTab />,
  };

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏥 MokineVeto</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion complète de la santé animale</p>
        </div>

        <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-[#178A3B] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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
