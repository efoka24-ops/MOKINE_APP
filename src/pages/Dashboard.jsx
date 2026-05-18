import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { animals as animalsAPI, consultations as consultationsAPI } from '../API';

const STATUS_COLORS = {
  healthy: 'bg-green-100 text-green-700',
  sick: 'bg-red-100 text-red-700',
  treatment: 'bg-yellow-100 text-yellow-700',
  pregnant: 'bg-blue-100 text-blue-700',
  observation: 'bg-orange-100 text-orange-700',
};
const STATUS_LABELS = {
  healthy: 'Sain', sick: 'Malade', treatment: 'Traitement',
  pregnant: 'Gestante', observation: 'Observation',
};
const ANIMAL_ICONS = {
  cattle: '🐄', goat: '🐐', sheep: '🐑', pig: '🐷',
  chicken: '🐔', horse: '🐎', fish: '🐟',
};
const ANIMAL_LABELS = {
  cattle: 'Bovins', goat: 'Caprins', sheep: 'Ovins',
  pig: 'Porcins', chicken: 'Volailles', horse: 'Équins', fish: 'Pisciculture',
};
const ALERT_SEVERITY = {
  high:   'bg-red-50 border-red-200 text-red-700',
  medium: 'bg-orange-50 border-orange-200 text-orange-700',
  low:    'bg-yellow-50 border-yellow-200 text-yellow-700',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [animals, setAnimals]             = useState([]);
  const [alerts, setAlerts]               = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [treatments, setTreatments]       = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    if (user?.role === 'veterinarian' || user?.role === 'vendor') return;
    const fetchAll = async () => {
      try {
        const [animRes, alertRes, consRes] = await Promise.all([
          animalsAPI.getAll().catch(() => ({ data: [] })),
          animalsAPI.getAlerts().catch(() => ({ data: [] })),
          consultationsAPI.getAll().catch(() => ({ data: [] })),
        ]);
        setAnimals(animRes.data || []);
        setAlerts(alertRes.data || []);
        setConsultations(consRes.data || []);

        // Load treatments for all animals
        const allTreatRes = await animalsAPI.getAllTreatments().catch(() => ({ data: [] }));
        setTreatments(allTreatRes.data || []);
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (user?.role === 'veterinarian') return <Navigate to="/vet/dashboard" replace />;
  if (user?.role === 'vendor')       return <Navigate to="/vendor/dashboard" replace />;

  // ── derived stats ────────────────────────────────────────────────────────
  const sickCount       = animals.filter(a => a.status === 'sick').length;
  const treatmentCount  = animals.filter(a => a.status === 'treatment').length;
  const unreadAlerts    = alerts.filter(a => !a.isRead).length;
  const activeConsults  = consultations.filter(c => c.status === 'active' || c.status === 'pending').length;

  // Animals by category
  const byCategory = animals.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + (a.quantity || 1);
    return acc;
  }, {});

  // Treatments in progress
  const activeTreatments = treatments.filter(t => t.status === 'active');
  const upcomingTreatments = treatments.filter(t => {
    if (!t.nextDueDate) return false;
    const due = new Date(t.nextDueDate);
    const now = new Date();
    return due > now && due <= new Date(now.getTime() + 7 * 86400000);
  });

  // Critical alerts (severity=high, unread)
  const criticalAlerts = alerts.filter(a => !a.isRead && a.severity === 'high');
  const moderateAlerts = alerts.filter(a => !a.isRead && a.severity !== 'high');

  return (
    <div className="space-y-5">

      {/* ── Welcome banner ───────────────────────────────────────────────── */}
      {user && (
        <div className="bg-gradient-to-r from-[#178A3B] to-[#147932] rounded-xl p-5 text-white">
          <h2 className="text-xl font-bold">Bonjour, {user.name} 👋</h2>
          <p className="text-green-100 text-sm mt-0.5">
            {user.role === 'farmer'
              ? `Tableau de bord éleveur${user.farmName ? ` — ${user.farmName}` : ''}`
              : user.role === 'veterinarian'
              ? `Espace vétérinaire — ${user.specialization || 'Médecine générale'}`
              : `Espace fournisseur${user.businessName ? ` — ${user.businessName}` : ''}`}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {criticalAlerts.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-red-500 bg-opacity-80 text-white text-xs px-3 py-1 rounded-full">
                🚨 {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? 's' : ''} critique{criticalAlerts.length > 1 ? 's' : ''}
              </span>
            )}
            {upcomingTreatments.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-yellow-500 bg-opacity-80 text-white text-xs px-3 py-1 rounded-full">
                ⏰ {upcomingTreatments.length} rappel{upcomingTreatments.length > 1 ? 's' : ''} cette semaine
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Stats cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Animaux suivis"  value={animals.length || '—'} icon="🐮" color="bg-orange-100" />
        <StatCard title="Cas urgents"     value={sickCount || '—'}     icon="⚠️" color="bg-red-100" />
        <StatCard title="En traitement"   value={treatmentCount || '—'} icon="💊" color="bg-yellow-100" />
        <StatCard title="Consultations"   value={activeConsults || '—'} icon="💬" color="bg-purple-100" />
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && animals.length === 0 && user?.role === 'farmer' && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center border-2 border-dashed border-green-200">
          <div className="text-5xl mb-3">🐄</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Bienvenue sur MokineVeto !</h3>
          <p className="text-sm text-gray-500 mb-4">Commencez par ajouter votre premier animal pour visualiser votre cheptel.</p>
          <Link to="/animals/add"
            className="inline-block px-5 py-2.5 bg-[#178A3B] text-white font-medium rounded-lg hover:bg-[#136B2F] transition-colors text-sm">
            + Ajouter un animal
          </Link>
        </div>
      )}

      {/* ── Alertes critiques ─────────────────────────────────────────────── */}
      {criticalAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-red-700 text-base mb-3 flex items-center gap-2">
            🚨 Alertes critiques
          </h3>
          <div className="space-y-2">
            {criticalAlerts.map(al => (
              <div key={al.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <span className="text-lg">🚨</span>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-red-800">{al.message}</p>
                  <p className="text-red-500 text-xs mt-0.5">{new Date(al.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {moderateAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-orange-700 text-base mb-3">⚠️ Alertes modérées</h3>
          <div className="space-y-2">
            {moderateAlerts.slice(0, 3).map(al => (
              <div key={al.id} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <span className="text-lg">⚠️</span>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-orange-800">{al.message}</p>
                  <p className="text-orange-400 text-xs mt-0.5">{new Date(al.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cheptel par catégorie ─────────────────────────────────────────── */}
      {animals.length > 0 && Object.keys(byCategory).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 text-base mb-3">Vue synthétique du cheptel</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
            {Object.entries(byCategory).map(([type, count]) => (
              <div key={type} className="flex flex-col items-center p-3 bg-green-50 rounded-xl">
                <span className="text-2xl">{ANIMAL_ICONS[type] || '🐾'}</span>
                <span className="text-lg font-bold text-[#178A3B] mt-1">{count}</span>
                <span className="text-xs text-gray-500">{ANIMAL_LABELS[type] || type}</span>
              </div>
            ))}
          </div>

          {/* Animal cards */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">{animals.length} animal{animals.length > 1 ? 'aux' : ''} enregistré{animals.length > 1 ? 's' : ''}</span>
            <Link to="/animals/add" className="text-xs bg-[#178A3B] text-white px-3 py-1.5 rounded-lg hover:bg-[#136B2F]">
              + Ajouter
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {animals.slice(0, 6).map(animal => (
              <div key={animal.id} onClick={() => navigate(`/animals/${animal.id}`)}
                className="border border-gray-100 rounded-xl p-3 hover:border-[#178A3B] hover:shadow-md cursor-pointer transition-all flex items-center gap-3">
                <span className="text-2xl">{ANIMAL_ICONS[animal.type] || '🐾'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm truncate">{animal.name}</div>
                  <div className="text-xs text-gray-500">{animal.breed || ANIMAL_LABELS[animal.type] || animal.type}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[animal.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[animal.status] || animal.status}
                </span>
              </div>
            ))}
            {animals.length > 6 && (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center justify-center text-gray-400 text-sm hover:border-[#178A3B] hover:text-[#178A3B] cursor-pointer transition-colors"
                onClick={() => navigate('/animals/add')}>
                +{animals.length - 6} autres
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Traitements en cours ──────────────────────────────────────────── */}
      {(activeTreatments.length > 0 || upcomingTreatments.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 text-base mb-3">💊 Traitements & Rappels</h3>
          {activeTreatments.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">En cours</p>
              <div className="space-y-2">
                {activeTreatments.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <span className="text-lg">💊</span>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-gray-800">{t.productName}</p>
                      <p className="text-xs text-gray-500">{t.animalName || 'Animal'} · {t.dosage || ''}</p>
                    </div>
                    <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Actif</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {upcomingTreatments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Rappels cette semaine</p>
              <div className="space-y-2">
                {upcomingTreatments.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-lg">⏰</span>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-gray-800">{t.productName}</p>
                      <p className="text-xs text-gray-500">
                        {t.animalName || 'Animal'} · Prévu le {new Date(t.nextDueDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Actions rapides (éleveurs seulement) ─────────────────────────── */}
      {user?.role !== 'veterinarian' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 text-base mb-3">Actions rapides</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <QuickAction to="/animals/add" icon="🐄" label="Ajouter un animal" color="bg-green-50 hover:bg-green-100" />
            <QuickAction to="/consultation"  icon="💬" label="Contacter un vét." color="bg-purple-50 hover:bg-purple-100" />
            <QuickAction to="/tebe"          icon="🧠" label="Diagnostic IA"    color="bg-blue-50 hover:bg-blue-100" />
            <QuickAction to="/alertes-sanitaires" icon="🚨" label="Déclarer alerte" color="bg-red-50 hover:bg-red-100" />
            <QuickAction to="/marketplace"   icon="🛒" label="Marketplace"      color="bg-orange-50 hover:bg-orange-100" />
            <QuickAction to="/farm-management" icon="🏡" label="Ma ferme"        color="bg-teal-50 hover:bg-teal-100" />
          </div>
        </div>
      )}

      {/* ── Consultations récentes ────────────────────────────────────────── */}
      {consultations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800 text-base">Consultations récentes</h3>
            <Link to="/consultation" className="text-xs text-[#178A3B] hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-2">
            {consultations.slice(0, 3).map(c => (
              <div key={c.id} onClick={() => navigate('/consultation')}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#178A3B] cursor-pointer transition-all">
                <span className="text-xl">💬</span>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-gray-800">{c.animalName || 'Animal'}</p>
                  <p className="text-xs text-gray-500 truncate">{c.subject}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  c.status === 'active' ? 'bg-green-100 text-green-700' :
                  c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {c.status === 'active' ? 'Active' : c.status === 'pending' ? 'En attente' : 'Fermée'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`${color} rounded-xl p-4`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-600 mt-0.5">{title}</div>
    </div>
  );
}

function QuickAction({ to, icon, label, color }) {
  return (
    <Link to={to} className={`${color} rounded-xl p-4 flex flex-col items-center gap-2 text-center border border-transparent hover:border-gray-200 transition-all`}>
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </Link>
  );
}
