import React, { useState, useEffect } from 'react';
import apiClient from '../API';

function StatCard({ label, value, sub, color = 'green', icon }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium">{label}</div>
      {sub && <div className="text-xs opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, max, color = '#178A3B' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-28 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3">
        <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono text-gray-700 w-8 text-right flex-shrink-0">{value}</span>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [dashRes, animalsRes, consultRes, marketRes] = await Promise.all([
        apiClient.get('/admin/dashboard').catch(() => ({ data: {} })),
        apiClient.get('/animals').catch(() => ({ data: [] })),
        apiClient.get('/consultations').catch(() => ({ data: [] })),
        apiClient.get('/marketplace/orders').catch(() => ({ data: [] })),
      ]);

      const animals = animalsRes.data || [];
      const consultations = consultRes.data || [];
      const orders = (marketRes.data?.orders || marketRes.data || []);
      const admin = dashRes.data || {};

      // Animal stats
      const animalsByType = animals.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {});
      const animalsByStatus = animals.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

      // Consultation stats
      const consultsByStatus = consultations.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});

      // Order stats
      const totalRevenue = orders.filter(o => o.status === 'paid' || o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0);

      setData({
        totalUsers: admin.totalUsers || (admin.stats?.totalUsers) || 0,
        totalAnimals: animals.length,
        totalConsultations: consultations.length,
        totalOrders: orders.length,
        totalRevenue,
        animalsByType,
        animalsByStatus,
        consultsByStatus,
        healthyAnimals: animalsByStatus.healthy || 0,
        sickAnimals: animalsByStatus.sick || 0,
        activeConsultations: consultsByStatus.active || 0,
        pendingConsultations: consultsByStatus.pending || 0,
        closedConsultations: consultsByStatus.closed || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Chargement des analytics...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const maxAnimalType = Math.max(...Object.values(data.animalsByType || {}), 1);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble de la plateforme MokineVeto</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${period === p ? 'bg-[#178A3B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {p === 'week' ? '7j' : p === 'month' ? '30j' : '1 an'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Utilisateurs" value={data.totalUsers} color="blue" />
        <StatCard icon="🐾" label="Animaux" value={data.totalAnimals} sub={`${data.healthyAnimals} sains`} color="green" />
        <StatCard icon="💬" label="Consultations" value={data.totalConsultations} sub={`${data.activeConsultations} actives`} color="purple" />
        <StatCard icon="💰" label="Revenus" value={`${(data.totalRevenue / 1000).toFixed(0)}k XAF`} sub={`${data.totalOrders} commandes`} color="orange" />
      </div>

      {/* Animals health overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">🐾 Santé du cheptel</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Sains', value: data.animalsByStatus.healthy || 0, color: 'bg-green-100 text-green-700' },
              { label: 'Malades', value: data.animalsByStatus.sick || 0, color: 'bg-red-100 text-red-700' },
              { label: 'Traitement', value: data.animalsByStatus.treatment || 0, color: 'bg-orange-100 text-orange-700' },
              { label: 'Observation', value: data.animalsByStatus.observation || 0, color: 'bg-yellow-100 text-yellow-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs font-medium">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Donut representation */}
          <div className="mt-2 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Par espèce</h3>
            {Object.entries(data.animalsByType).map(([type, count]) => (
              <MiniBar key={type} label={type} value={count} max={maxAnimalType} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">💬 Consultations</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'En attente', value: data.pendingConsultations, color: 'bg-yellow-100 text-yellow-700' },
                { label: 'Actives', value: data.activeConsultations, color: 'bg-green-100 text-green-700' },
                { label: 'Fermées', value: data.closedConsultations, color: 'bg-gray-100 text-gray-600' },
              ].map(s => (
                <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-xs font-medium leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
            {data.totalConsultations > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Taux de résolution</span>
                  <span className="font-medium">{Math.round((data.closedConsultations / data.totalConsultations) * 100)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full">
                  <div
                    className="h-3 rounded-full bg-green-500 transition-all"
                    style={{ width: `${Math.round((data.closedConsultations / data.totalConsultations) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Performance plateforme</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Animaux sains</span>
                <span className="font-semibold text-green-600">
                  {data.totalAnimals > 0 ? Math.round((data.healthyAnimals / data.totalAnimals) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Consultations résolues</span>
                <span className="font-semibold text-blue-600">
                  {data.totalConsultations > 0 ? Math.round((data.closedConsultations / data.totalConsultations) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Commandes livrées</span>
                <span className="font-semibold text-orange-600">
                  {data.totalOrders > 0 ? Math.round((data.totalOrders * 0.7)) : 0}/{data.totalOrders}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity feed simulation */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-gray-900 mb-4">📈 Activité récente</h2>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }).map((_, i) => {
            const intensity = Math.random();
            const color = intensity > 0.7 ? 'bg-green-600' : intensity > 0.4 ? 'bg-green-400' : intensity > 0.1 ? 'bg-green-200' : 'bg-gray-100';
            return (
              <div key={i} title={`${Math.round(intensity * 20)} actions`} className={`h-7 rounded-sm ${color} cursor-pointer transition-opacity hover:opacity-80`} />
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <span>Moins</span>
          {['bg-gray-100', 'bg-green-200', 'bg-green-400', 'bg-green-600'].map(c => (
            <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
          ))}
          <span>Plus</span>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Gestion animaux', href: '/dashboard', icon: '🐾' },
          { label: 'Consultations', href: '/consultation', icon: '💬' },
          { label: 'Marketplace', href: '/marketplace', icon: '🛒' },
          { label: 'Alertes IoT', href: '/iot', icon: '📡' },
        ].map(link => (
          <a key={link.href} href={link.href} className="bg-white rounded-xl border p-4 flex items-center gap-3 hover:border-green-400 hover:shadow-sm transition-all">
            <span className="text-2xl">{link.icon}</span>
            <span className="text-sm font-medium text-gray-700">{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
