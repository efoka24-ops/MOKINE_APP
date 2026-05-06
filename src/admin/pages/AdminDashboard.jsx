import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminLayout from '../components/AdminLayout';
import StatBox from '../components/StatBox';
import { admin } from '../../API.js';
import { AlertCircle, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await admin.getDashboard();
        setStats(data);
        setAlerts(data.alerts || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <AdminLayout><div className="text-center py-8">Chargement...</div></AdminLayout>;

  const chartData = [
    { month: 'Jan', users: 400, revenue: 2400 },
    { month: 'Fév', users: 500, revenue: 2210 },
    { month: 'Mar', users: 620, revenue: 2290 },
    { month: 'Avr', users: 750, revenue: 2000 },
    { month: 'Mai', users: 890, revenue: 2181 },
    { month: 'Juin', users: 1050, revenue: 2500 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Titre */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-600 mt-2">Bienvenue sur le panneau d'administration Mokine</p>
        </div>

        {/* Statistiques Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatBox title="Utilisateurs Actifs" value={stats?.totalUsers || '0'} change={12} icon="👥" color="blue" />
          <StatBox
            title="Revenus Mensuels"
            value={`${stats?.monthlyRevenue || '0'} F CFA`}
            change={18}
            icon="💰"
            color="green"
          />
          <StatBox title="Animaux Suivis" value={stats?.totalAnimals || '0'} change={25} icon="🐄" color="orange" />
          <StatBox title="Consultations" value={stats?.totalConsultations || '0'} change={-5} icon="🏥" color="red" />
        </div>

        {/* Alertes Système */}
        {alerts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="text-yellow-700 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900">Alertes Système</h3>
                <ul className="mt-2 space-y-1">
                  {alerts.map((alert, idx) => (
                    <li key={idx} className="text-sm text-yellow-800">
                      • {alert}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution des Utilisateurs */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Évolution des Utilisateurs</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#178A3B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenus par Mois */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Revenus par Mois</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#F9B233" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistiques Détaillées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="font-semibold text-gray-900">Vétérinaires Actifs</h3>
            <p className="text-3xl font-bold text-[#178A3B] mt-2">{stats?.totalVeterinarians || '0'}</p>
            <p className="text-sm text-gray-500 mt-2">Professionnels en ligne</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="font-semibold text-gray-900">Taux de Satisfaction</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.satisfactionRate || '0'}%</p>
            <p className="text-sm text-gray-500 mt-2">Client satisfaction</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="font-semibold text-gray-900">En Attente</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats?.pendingItems || '0'}</p>
            <p className="text-sm text-gray-500 mt-2">Requêtes à traiter</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
