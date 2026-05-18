import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { admin } from '../../API.js';
import { RefreshCw, Wheat, Users, Activity, MapPin } from 'lucide-react';

const TABS = [
  { id: 'farms',    label: 'Fermes' },
  { id: 'members',  label: 'Membres' },
  { id: 'activity', label: 'Activité' },
];

function useAutoRefresh(load) {
  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);
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

// ─── TAB: Fermes ─────────────────────────────────────────────────────────────
function FarmsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    admin.getFarms().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const cols = [
    { key: 'name', label: 'Nom', render: r => r.name || r.farmName || '—' },
    { key: 'ownerName', label: 'Propriétaire' },
    { key: 'ownerEmail', label: 'Email', render: r => r.ownerEmail || '—' },
    { key: 'location', label: 'Localisation', render: r => r.location || r.region || '—' },
    { key: 'size', label: 'Superficie', render: r => r.size ? `${r.size} ha` : '—' },
    { key: 'animalCount', label: 'Animaux', render: r => r.animalCount ?? '—' },
    { key: 'createdAt', label: 'Créée le', render: r => r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '—' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <Wheat size={16} className="text-orange-500" /> Fermes <span className="text-gray-400 font-normal text-sm">({data.length})</span>
        </h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {data.length === 0 && !loading ? (
        <div className="text-center py-16 bg-orange-50 rounded-xl border border-orange-100">
          <Wheat size={36} className="text-orange-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Aucune ferme enregistrée</p>
          <p className="text-xs text-gray-400 mt-1">Les fermes créées par les éleveurs apparaîtront ici</p>
        </div>
      ) : (
        <Table cols={cols} rows={data} empty="Aucune ferme" />
      )}
    </div>
  );
}

// ─── TAB: Membres ────────────────────────────────────────────────────────────
function MembersTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    admin.getFarmMembers().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const cols = [
    { key: 'userId', label: 'Utilisateur', render: r => r.userId || '—' },
    { key: 'farmId', label: 'Ferme', render: r => r.farmId || '—' },
    { key: 'role', label: 'Rôle', render: r => <span className="capitalize">{r.role || 'membre'}</span> },
    { key: 'joinedAt', label: 'Rejoint le', render: r => r.joinedAt ? new Date(r.joinedAt).toLocaleDateString('fr-FR') : '—' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <Users size={16} className="text-orange-500" /> Membres des fermes <span className="text-gray-400 font-normal text-sm">({data.length})</span>
        </h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <Table cols={cols} rows={data} empty="Aucun membre de ferme" />
    </div>
  );
}

// ─── TAB: Activité ───────────────────────────────────────────────────────────
function ActivityTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    admin.getFarmActivity().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <Activity size={16} className="text-orange-500" /> Journal d'activité <span className="text-gray-400 font-normal text-sm">({data.length} entrées)</span>
        </h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 bg-orange-50 rounded-xl border border-orange-100">
          <Activity size={36} className="text-orange-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Aucune activité enregistrée</p>
          <p className="text-xs text-gray-400 mt-1">Le journal d'activité terrain s'alimentera automatiquement</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((entry, i) => (
            <div key={entry.id || i} className="flex items-start gap-3 py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{entry.action || entry.description || JSON.stringify(entry)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {entry.userId || '—'} · {entry.farmId || '—'} · {entry.createdAt ? new Date(entry.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FieldModule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'farms';
  const setTab = (t) => setSearchParams(t === 'farms' ? {} : { tab: t });

  const TAB_COMPONENTS = { farms: <FarmsTab />, members: <MembersTab />, activity: <ActivityTab /> };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🌾 MokineField</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion terrain — fermes, membres, activité sur le terrain</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-500 text-lg">🔧</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Module en développement (Beta)</p>
            <p className="text-xs text-amber-700 mt-0.5">MokineField déployera bientôt des agents terrain avec GPS, interventions mobiles et synchronisation hors-ligne.</p>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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
