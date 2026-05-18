import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { admin } from '../../API.js';
import { RefreshCw, Wifi, WifiOff, Battery, Thermometer, Activity, AlertTriangle, Trash2 } from 'lucide-react';

const TABS = [
  { id: 'devices',  label: 'Appareils IoT' },
  { id: 'alerts',   label: 'Alertes IoT' },
  { id: 'readings', label: 'Données Capteurs' },
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

function StatsBar({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total', value: stats.total ?? 0, icon: Activity, color: 'text-gray-600 bg-gray-100' },
        { label: 'En ligne', value: stats.online ?? 0, icon: Wifi, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Hors ligne', value: stats.offline ?? 0, icon: WifiOff, color: 'text-red-500 bg-red-50' },
        { label: 'Batterie moy.', value: stats.avgBattery != null ? `${stats.avgBattery}%` : '—', icon: Battery, color: 'text-blue-600 bg-blue-50' },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-lg p-4 border border-gray-100 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={16} />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TAB: Appareils ─────────────────────────────────────────────────────────
function DevicesTab() {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([admin.getIotDevices(), admin.getBoxStats()])
      .then(([devRes, statsRes]) => {
        setDevices(devRes.data);
        setStats(statsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet appareil ?')) return;
    await admin.deleteIotDevice(id);
    setDevices(prev => prev.filter(d => d.id !== id));
  };

  const cols = [
    { key: 'rfidTag', label: 'RFID / ID', render: r => <span className="font-mono text-xs">{r.rfidTag || r.id}</span> },
    { key: 'model', label: 'Modèle', render: r => r.model || '—' },
    { key: 'animalName', label: 'Animal', render: r => r.animalName || '—' },
    { key: 'type', label: 'Type', render: r => r.type || '—' },
    { key: 'batteryLevel', label: 'Batterie', render: r => r.batteryLevel != null ? (
      <div className="flex items-center gap-1.5">
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${r.batteryLevel > 50 ? 'bg-green-500' : r.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${r.batteryLevel}%` }} />
        </div>
        <span className="text-xs text-gray-600">{r.batteryLevel}%</span>
      </div>
    ) : '—' },
    { key: 'firmwareVersion', label: 'Firmware', render: r => r.firmwareVersion || '—' },
    { key: 'isOnline', label: 'État', render: r => <Badge value={r.isOnline ? 'online' : 'offline'} map={{ online: ['bg-green-100 text-green-700', '● En ligne'], offline: ['bg-gray-100 text-gray-500', '○ Hors ligne'] }} /> },
    { key: 'lastSeen', label: 'Vu le', render: r => r.lastSeen ? new Date(r.lastSeen).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—' },
    { key: 'actions', label: '', render: r => (
      <button onClick={() => remove(r.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition"><Trash2 size={14} /></button>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Appareils IoT <span className="text-gray-400 font-normal text-sm">({devices.length})</span></h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <StatsBar stats={stats} />
      <Table cols={cols} rows={devices} empty="Aucun appareil IoT enregistré" />
    </div>
  );
}

// ─── TAB: Alertes IoT ───────────────────────────────────────────────────────
function IotAlertsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    admin.getIotAlerts().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const cols = [
    { key: 'id', label: 'ID', render: r => <span className="font-mono text-xs">{String(r.id).slice(0, 8)}</span> },
    { key: 'deviceId', label: 'Appareil', render: r => r.deviceId || '—' },
    { key: 'animalId', label: 'Animal', render: r => r.animalId || '—' },
    { key: 'type', label: 'Type', render: r => r.type || '—' },
    { key: 'message', label: 'Message', render: r => <span className="text-xs">{r.message || '—'}</span> },
    { key: 'severity', label: 'Sévérité', render: r => <Badge value={r.severity} map={{ critical: ['bg-red-100 text-red-700', 'Critique'], high: ['bg-orange-100 text-orange-700', 'Élevé'], medium: ['bg-yellow-100 text-yellow-700', 'Moyen'] }} /> },
    { key: 'createdAt', label: 'Date', render: r => r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2"><AlertTriangle size={16} className="text-orange-500" /> Alertes IoT <span className="text-gray-400 font-normal text-sm">({data.length})</span></h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <Table cols={cols} rows={data} empty="Aucune alerte IoT" />
    </div>
  );
}

// ─── TAB: Données capteurs ──────────────────────────────────────────────────
function ReadingsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    admin.getSensorReadings().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);
  useAutoRefresh(load);

  const cols = [
    { key: 'deviceId', label: 'Appareil', render: r => r.deviceId || '—' },
    { key: 'animalId', label: 'Animal', render: r => r.animalId || '—' },
    { key: 'type', label: 'Type', render: r => (
      <span className="flex items-center gap-1.5">
        {r.type === 'temperature' ? <Thermometer size={13} className="text-red-400" /> : <Activity size={13} className="text-blue-400" />}
        {r.type}
      </span>
    )},
    { key: 'value', label: 'Valeur', render: r => `${r.value} ${r.unit || ''}` },
    { key: 'normal', label: 'État', render: r => <Badge value={r.normal === false || r.alert ? 'anomaly' : 'normal'} map={{ normal: ['bg-green-100 text-green-700', 'Normal'], anomaly: ['bg-red-100 text-red-600', 'Anomalie'] }} /> },
    { key: 'timestamp', label: 'Horodatage', render: r => r.timestamp ? new Date(r.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Données Capteurs <span className="text-gray-400 font-normal text-sm">({data.length} relevés)</span></h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <Table cols={cols} rows={data} empty="Aucune donnée capteur" />
    </div>
  );
}

export default function BoxModule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'devices';
  const setTab = (t) => setSearchParams(t === 'devices' ? {} : { tab: t });

  const TAB_COMPONENTS = { devices: <DevicesTab />, alerts: <IotAlertsTab />, readings: <ReadingsTab /> };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📡 MokineBox</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion des objets connectés — colliers IoT, capteurs, alertes</p>
        </div>

        <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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
