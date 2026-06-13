import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';
const PRIMARY_L = '#f0fdf4';
const PRIMARY_B = '#bbf7d0';
const API_BASE  = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const NAV = {
  researcher: [
    { icon: '🏠', label: 'Accueil',          path: '/mokinelab/dashboard' },
    { icon: '📸', label: 'Scan Tebe IA',      path: '/mokinelab/scan' },
    { icon: '💬', label: 'Questionnaire IA',  path: '/mokinelab/questionnaire' },
    { icon: '🤝', label: 'Mes contributions', path: '/mokinelab/dashboard/contributions' },
    { icon: '📊', label: 'Modèle Tebe',       path: '/mokinelab/dashboard/model' },
    { icon: '🗂️', label: 'Catalogue',         path: '/mokinelab/dashboard/catalogue' },
  ],
  developer: [
    { icon: '🏠', label: 'Accueil',           path: '/mokinelab/dashboard' },
    { icon: '📸', label: 'Scan Tebe IA',      path: '/mokinelab/scan' },
    { icon: '🧬', label: 'Mes modèles',       path: '/mokinelab/dashboard/models' },
    { icon: '📂', label: 'Dataset',           path: '/mokinelab/dashboard/dataset' },
    { icon: '🔑', label: 'Clés API',          path: '/mokinelab/dashboard/api-keys' },
    { icon: '📈', label: 'Analytics',         path: '/mokinelab/dashboard/analytics' },
  ],
  veterinarian: [
    { icon: '🏠', label: 'Accueil',           path: '/mokinelab/dashboard' },
    { icon: '📸', label: 'Scan Tebe IA',      path: '/mokinelab/scan' },
    { icon: '💬', label: 'Questionnaire IA',  path: '/mokinelab/questionnaire' },
    { icon: '✅', label: 'À valider',          path: '/mokinelab/dashboard/validate' },
    { icon: '🤝', label: 'Mes contributions', path: '/mokinelab/dashboard/contributions' },
    { icon: '🗂️', label: 'Catalogue clinique',path: '/mokinelab/dashboard/catalogue' },
  ],
};

const ROLE_LABELS = {
  researcher:   { label: 'Chercheur',    icon: '🔬', color: 'bg-blue-100 text-blue-700' },
  developer:    { label: 'Développeur',  icon: '🔌', color: 'bg-purple-100 text-purple-700' },
  veterinarian: { label: 'Vétérinaire',  icon: '🩺', color: 'bg-green-100 text-green-700' },
};

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-all">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: color ? `${color}20` : PRIMARY_L }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-600 truncate">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function ResearcherStats({ stats }) {
  const dataset = stats?.dataset || {};
  const collected = dataset.collected || 0;
  const target    = dataset.target || 1000;
  const pct       = target ? Math.min((collected / target) * 100, 100) : 0;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Mes statistiques</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon="📸" label="Scans effectués"     value={stats?.myScans ?? 0}         sub="Diagnostics Tebe IA" />
        <StatCard icon="🤝" label="Mes contributions"   value={stats?.myContributions ?? 0}  sub="Photos soumises au dataset" />
        <StatCard icon="📊" label="Dataset Tebe"        value={`${pct.toFixed(1)}%`}         sub={`${collected} / ${target} images`} />
      </div>
      {/* Barre progression dataset */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Progression dataset Tebe v1.0</span>
          <span className="text-xs font-bold" style={{ color: PRIMARY }}>{pct.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_D})` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{collected} images collectées</span>
          <span>Objectif : {target}</span>
        </div>
      </div>
    </div>
  );
}

function DeveloperStats({ stats }) {
  const datasetAccessMap = {
    none:     { label: 'Non activé',  color: 'bg-gray-100 text-gray-600' },
    pending:  { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Approuvé',   color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejeté',     color: 'bg-red-100 text-red-700' },
  };
  const access = datasetAccessMap[stats?.datasetAccess] || datasetAccessMap.none;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Mes statistiques</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🧬" label="Modèles créés"     value={stats?.myModels ?? 0}      sub="Modèles IA personnalisés" />
        <StatCard icon="🔑" label="Clés API"          value={stats?.myApiKeys ?? 0}     sub="Clés actives" />
        <StatCard icon="📊" label="Requêtes totales"  value={stats?.totalRequests ?? 0} sub="Via vos clés API" />
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: PRIMARY_L }}>📂</div>
          <div className="min-w-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${access.color}`}>{access.label}</span>
            <p className="text-sm font-medium text-gray-600 mt-1">Accès dataset</p>
            <p className="text-xs text-gray-400">Données d'entraînement</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VeterinarianStats({ stats }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Mes statistiques</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon="📸" label="Scans effectués"       value={stats?.myScans ?? 0}         sub="Diagnostics Tebe IA" />
        <StatCard icon="✅" label="Validations effectuées" value={stats?.myValidations ?? 0}   sub="Contributions validées" />
        <StatCard icon="🤝" label="Mes contributions"     value={stats?.myContributions ?? 0}  sub="Photos soumises" />
      </div>
    </div>
  );
}

function WelcomeCards({ role }) {
  const cards = {
    researcher: [
      { icon: '📸', title: 'Scan Tebe IA',   desc: 'Diagnostic photo IA avec historique sauvegardé.',          action: 'Lancer le scan',       path: '/mokinelab/scan',          color: PRIMARY },
      { icon: '💬', title: 'Questionnaire',  desc: 'Pré-diagnostic par symptômes, résultat instantané.',       action: 'Démarrer',             path: '/mokinelab/questionnaire', color: '#0891b2' },
      { icon: '🤝', title: 'Contribuer',     desc: 'Soumettez vos photos annotées au dataset Tebe.',           action: 'Contribuer',           path: '/mokinelab#contribuer',    color: '#7c3aed' },
    ],
    developer: [
      { icon: '📸', title: 'Scan Tebe IA',   desc: 'Testez l\'API Tebe depuis votre espace membre.',            action: 'Tester le scan',       path: '/mokinelab/scan',                  color: PRIMARY },
      { icon: '🧬', title: 'Mes modèles',    desc: 'Créez et entraînez vos modèles IA vétérinaires.',          action: 'Gérer les modèles',    path: '/mokinelab/dashboard/models',      color: '#7c3aed' },
      { icon: '🔑', title: 'Clés API',       desc: 'Accédez et gérez vos clés d\'accès API Tebe.',             action: 'Mes clés',             path: '/mokinelab/dashboard/api-keys',    color: '#ea580c' },
    ],
    veterinarian: [
      { icon: '📸', title: 'Scan Tebe IA',   desc: 'Diagnostic photo avec accès aux détails cliniques avancés.', action: 'Lancer le scan',    path: '/mokinelab/scan',          color: PRIMARY },
      { icon: '💬', title: 'Questionnaire',  desc: 'Pré-diagnostic symptômes avec résultat sauvegardé.',       action: 'Démarrer',             path: '/mokinelab/questionnaire', color: '#0891b2' },
      { icon: '✅', title: 'À valider',      desc: 'Votre validation vaut x2 en valeur d\'entraînement.',       action: 'Voir les contributions', path: '/mokinelab/dashboard/validate', color: '#7c3aed' },
    ],
  };

  const list = cards[role] || cards.researcher;

  return (
    <div className="grid sm:grid-cols-3 gap-4 mb-6">
      {list.map(c => (
        <div key={c.title} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
          <div className="text-3xl mb-3">{c.icon}</div>
          <h3 className="font-semibold text-gray-800 mb-1">{c.title}</h3>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">{c.desc}</p>
          <Link to={c.path}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white inline-block transition-all"
            style={{ background: c.color }}>
            {c.action} →
          </Link>
        </div>
      ))}
    </div>
  );
}

function RecentScans({ scans }) {
  if (!scans?.length) return null;

  const severityColor = {
    critical: 'text-red-600', severe: 'text-orange-600', high: 'text-orange-600',
    moderate: 'text-yellow-600', medium: 'text-yellow-600',
    low: 'text-blue-600', healthy: 'text-green-600', none: 'text-green-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Scans récents</h3>
        <Link to="/mokinelab/scan" className="text-xs font-semibold" style={{ color: PRIMARY }}>
          Nouveau scan →
        </Link>
      </div>
      <div className="space-y-3">
        {scans.slice(0, 5).map(s => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <span className="text-xl">🐾</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {s.result?.diagnosis?.condition || 'Diagnostic IA'}
              </p>
              <p className="text-xs text-gray-500">
                {s.animalType} · {new Date(s.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            {s.result?.diagnosis?.severity && (
              <span className={`text-xs font-semibold flex-shrink-0 ${severityColor[s.result.diagnosis.severity] || 'text-gray-500'}`}>
                {Math.round((s.result.diagnosis.confidence || 0) * 100)}% confiance
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LabDashboard() {
  const { user, token, logout } = useLabAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats]             = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading]         = useState(true);

  const roleInfo = ROLE_LABELS[user?.role] || ROLE_LABELS.researcher;
  const navLinks = NAV[user?.role] || NAV.researcher;
  const currentPath = window.location.pathname;

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_BASE}/api/tebe/stats`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/api/lab/scans`, { headers }).then(r => r.json()).catch(() => ({ scans: [] })),
    ]).then(([tebeStats, scansData]) => {
      const scans = scansData.scans || [];
      setRecentScans(scans);

      const base = {
        myScans: scans.length,
        dataset: tebeStats?.dataset || {},
      };

      if (user?.role === 'researcher') {
        setStats({ ...base, myContributions: tebeStats?.myContributions || 0 });
      } else if (user?.role === 'developer') {
        setStats({
          ...base,
          myModels: tebeStats?.myModels || 0,
          myApiKeys: tebeStats?.myApiKeys || 0,
          totalRequests: tebeStats?.totalRequests || 0,
          datasetAccess: user?.datasetAccess || 'none',
        });
      } else if (user?.role === 'veterinarian') {
        setStats({
          ...base,
          myValidations: tebeStats?.myValidations || 0,
          myContributions: tebeStats?.myContributions || 0,
        });
      }
    }).finally(() => setLoading(false));
  }, [token, user?.role, user?.datasetAccess]);

  const handleLogout = () => { logout(); navigate('/mokinelab'); };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 shadow-sm flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: PRIMARY }}>M</div>
          <span className="font-bold text-gray-800">
            Mokine<span style={{ color: PRIMARY }}>Lab</span>
          </span>
        </div>

        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: PRIMARY }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleInfo.color}`}>
                {roleInfo.icon} {roleInfo.label}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentPath === link.path
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
              style={currentPath === link.path ? { background: PRIMARY } : {}}>
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all">
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Contenu principal ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              ☰
            </button>
            <h1 className="font-semibold text-gray-800">Mon espace MokineLab</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/mokinelab"
              className="hidden sm:flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-green-200 font-medium transition-all hover:bg-green-50"
              style={{ color: PRIMARY }}>
              🧬 MokineLab
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900">
              Bienvenue, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {roleInfo.icon} Espace {roleInfo.label} — MokineLab · Laboratoire IA vétérinaire Mokine
            </p>
          </div>

          {user?.role === 'developer' && user?.datasetAccess === 'none' && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">📂</span>
              <div>
                <p className="font-semibold text-orange-800 text-sm">Accès dataset non activé</p>
                <p className="text-orange-700 text-xs mt-0.5">
                  Pour entraîner vos modèles, faites une demande d'accès au dataset Mokine.
                </p>
                <Link to="/mokinelab/dashboard/dataset"
                  className="mt-2 inline-block text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all"
                  style={{ background: '#ea580c' }}>
                  Faire une demande d'accès →
                </Link>
              </div>
            </div>
          )}

          {user?.role === 'developer' && user?.datasetAccess === 'pending' && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">⏳</span>
              <div>
                <p className="font-semibold text-yellow-800 text-sm">Demande d'accès dataset en attente</p>
                <p className="text-yellow-700 text-xs mt-0.5">
                  Votre demande est en cours d'examen. Vous serez notifié par email dès validation.
                </p>
              </div>
            </div>
          )}

          <WelcomeCards role={user?.role} />

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {recentScans.length > 0 && <RecentScans scans={recentScans} />}

              <div className="mb-6">
                {user?.role === 'researcher'   && <ResearcherStats   stats={stats} />}
                {user?.role === 'developer'    && <DeveloperStats    stats={stats} />}
                {user?.role === 'veterinarian' && <VeterinarianStats stats={stats} />}
              </div>
            </>
          )}
        </main>

        <footer className="py-4 px-6 text-center text-xs text-gray-400 border-t border-gray-100">
          © {new Date().getFullYear()} MokineLab · Laboratoire IA vétérinaire Mokine · infos@trugroup.cm
        </footer>
      </div>
    </div>
  );
}
