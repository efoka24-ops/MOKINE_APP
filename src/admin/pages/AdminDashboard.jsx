import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { io } from 'socket.io-client';
import AdminLayout from '../components/AdminLayout';
import { admin } from '../../API.js';
import {
  Users, Stethoscope, Dog, MessageSquare, Radio, AlertTriangle, TrendingUp,
  Activity, Bell, X,
} from 'lucide-react';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
const PIE_COLORS = ['#178A3B', '#0284c7', '#F9B233', '#7c3aed', '#b45309', '#dc2626'];

// ─── Mini components ─────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color = '#178A3B', sub, trend }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
      <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {trend != null && (
          <p className={`text-xs font-semibold mt-0.5 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            <TrendingUp size={11} /> {trend >= 0 ? '+' : ''}{trend} ce mois
          </p>
        )}
      </div>
    </div>
  );
}

function ModuleCard({ mod, onClick }) {
  const statusColors = { active: 'bg-emerald-100 text-emerald-700', training: 'bg-violet-100 text-violet-700', beta: 'bg-amber-100 text-amber-700' };
  const statusLabel = { active: 'Actif', training: 'En entraînement', beta: 'Beta' };
  return (
    <button onClick={onClick} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md hover:border-gray-200 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{mod.icon}</span>
          <div>
            <p className="font-bold text-gray-900 text-xs">{mod.name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColors[mod.status] || 'bg-gray-100 text-gray-600'}`}>
              {statusLabel[mod.status] || mod.status}
            </span>
          </div>
        </div>
        <span className="text-[#178A3B] opacity-0 group-hover:opacity-100 transition-opacity text-sm">→</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {Object.entries(mod.stats).slice(0, 3).map(([k, v]) => (
          <div key={k} className="text-center">
            <p className="text-base font-bold text-gray-800">{v ?? 0}</p>
            <p className="text-xs text-gray-400 capitalize leading-tight">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
          </div>
        ))}
      </div>
    </button>
  );
}

// ─── Live notification toast ──────────────────────────────────────────────────
function NotifToast({ notif, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80 flex gap-3 animate-slide-up">
      <div className="w-8 h-8 rounded-lg bg-[#178A3B]/10 flex items-center justify-center flex-shrink-0">
        <Bell size={16} className="text-[#178A3B]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900">{notif.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug truncate">{notif.message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={14} /></button>
    </div>
  );
}

// ─── Custom tooltip for recharts ──────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.value > 9999 ? `${p.value.toLocaleString()} F` : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [dashData, setDashData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([admin.getDashboard(), admin.getAnalytics()])
      .then(([d, a]) => { setDashData(d.data); setAnalytics(a.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAll();
    window.addEventListener('focus', loadAll);
    return () => window.removeEventListener('focus', loadAll);
  }, [loadAll]);

  // Admin socket: listen for any new_notification (fire-and-forget monitoring)
  useEffect(() => {
    const adminUser = (() => { try { return JSON.parse(localStorage.getItem('mokine_user') || '{}'); } catch { return {}; } })();
    if (!adminUser.id) return;
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;
    socket.emit('join_user', adminUser.id);
    socket.on('admin_action_ack', (data) => {
      setToast({ title: 'Action effectuée', message: data.message || 'Action admin enregistrée', id: Date.now() });
    });
    return () => socket.disconnect();
  }, []);

  const kpis = dashData?.kpis || {};
  const modules = dashData?.modules || [];
  const alerts = dashData?.pendingSanitaryAlerts || [];
  const consultations = dashData?.recentConsultations || [];
  const totals = analytics?.totals || {};
  const charts = analytics?.charts || {};
  const distributions = analytics?.distributions || {};

  const MODULE_PATHS = { veto: '/admin/veto', box: '/admin/box', market: '/admin/market', lab: '/admin/lab' };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
            <p className="text-sm text-gray-500 mt-1">Toutes les applications Mokine — données en temps réel</p>
          </div>
          <button onClick={loadAll}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <Activity size={13} /> Actualiser
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#178A3B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <KpiCard label="Utilisateurs" value={kpis.totalUsers} icon={Users} color="#178A3B" trend={totals.newUsersThisMonth} />
              <KpiCard label="Vétérinaires" value={kpis.totalVets} icon={Stethoscope} color="#0284c7" />
              <KpiCard label="Animaux" value={kpis.totalAnimals} icon={Dog} color="#d97706" />
              <KpiCard label="Consultations actives" value={kpis.activeConsultations} icon={MessageSquare} color="#7c3aed" trend={totals.newConsultationsThisMonth} />
              <KpiCard label="Appareils IoT" value={kpis.totalDevices} icon={Radio} color="#0284c7" sub={`${kpis.onlineDevices || 0} en ligne`} />
              <KpiCard label="Alertes critiques" value={kpis.criticalAlerts} icon={AlertTriangle} color="#dc2626" />
            </div>

            {/* Revenue highlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-[#178A3B] to-[#0f5e29] rounded-xl p-5 text-white">
                <p className="text-xs font-semibold opacity-80 uppercase tracking-wider mb-1">Revenus totaux</p>
                <p className="text-3xl font-bold">{(kpis.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-xs opacity-70 mt-0.5">F CFA — paiements complétés</p>
                {totals.revenueThisMonth > 0 && <p className="text-xs font-semibold mt-2 bg-white/20 px-2 py-0.5 rounded-full w-fit">+{totals.revenueThisMonth.toLocaleString()} F ce mois</p>}
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Commandes en attente</p>
                <p className="text-3xl font-bold text-amber-600">{kpis.pendingOrders || 0}</p>
                <p className="text-xs text-gray-400 mt-1">MokineMarket</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fermes enregistrées</p>
                <p className="text-3xl font-bold text-orange-600">{kpis.totalFarms || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Gestion des fermes</p>
              </div>
            </div>

            {/* Real Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users over time */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Inscriptions — 6 derniers mois</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={charts.usersChart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="count" name="Utilisateurs" stroke="#178A3B" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Consultations over time */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Consultations — 6 derniers mois</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={charts.consultationsChart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Consultations" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue over time */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Revenus (F CFA) — 6 derniers mois</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={charts.revenueChart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v > 999 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" name="Revenus" fill="#F9B233" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Animals over time */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Animaux enregistrés — 6 derniers mois</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={charts.animalsChart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="count" name="Animaux" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distributions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Répartition utilisateurs</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={distributions.roleDistribution || []} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {(distributions.roleDistribution || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Statut consultations</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={distributions.consultationStatus || []} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {(distributions.consultationStatus || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Types d'animaux</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={distributions.animalDistribution || []} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {(distributions.animalDistribution || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Modules overview */}
            <div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Applications</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {modules.map(mod => <ModuleCard key={mod.id} mod={mod} onClick={() => navigate(MODULE_PATHS[mod.id] || '/admin/dashboard')} />)}
              </div>
            </div>

            {/* Bottom: alerts + recent consultations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                    <AlertTriangle size={15} className="text-red-500" /> Alertes sanitaires non vérifiées
                  </h3>
                  <button onClick={() => navigate('/admin/veto?tab=sanitary')} className="text-xs text-[#178A3B] hover:underline">Voir tout</button>
                </div>
                <div className="px-5 py-2 divide-y divide-gray-50">
                  {alerts.length === 0
                    ? <p className="text-sm text-gray-400 py-4 text-center">Aucune alerte en attente</p>
                    : alerts.map(a => (
                        <div key={a.id} className="flex items-start gap-3 py-3">
                          <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-800 leading-snug">{a.description}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{a.city} · {a.animalType}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${a.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{a.severity}</span>
                        </div>
                      ))
                  }
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                    <Activity size={15} className="text-[#178A3B]" /> Consultations récentes
                  </h3>
                  <button onClick={() => navigate('/admin/veto?tab=consultations')} className="text-xs text-[#178A3B] hover:underline">Voir tout</button>
                </div>
                <div className="px-5 py-2 divide-y divide-gray-50">
                  {consultations.length === 0
                    ? <p className="text-sm text-gray-400 py-4 text-center">Aucune consultation récente</p>
                    : consultations.map(c => (
                        <div key={c.id} className="flex items-center justify-between py-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{c.subject || c.animalName}</p>
                            <p className="text-xs text-gray-400">{c.farmerName} → {c.veterinarianName}</p>
                          </div>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'}`}>
                            {c.status}
                          </span>
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {toast && <NotifToast key={toast.id} notif={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
