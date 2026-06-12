import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

const PRIMARY   = '#178A3B';
const PRIMARY_D = '#136B2F';
const PRIMARY_L = '#f0fdf4';
const PRIMARY_B = '#bbf7d0';

// ── Sidebar links par rôle ────────────────────────────────────────────────────
const NAV = {
  researcher: [
    { icon: '🏠', label: 'Accueil',          path: '/mokinelab/dashboard' },
    { icon: '📸', label: 'Scan Tebe IA',      path: '/mokinelab' },
    { icon: '🤝', label: 'Mes contributions', path: '/mokinelab/dashboard/contributions' },
    { icon: '📊', label: 'Modèle Tebe',       path: '/mokinelab/dashboard/model' },
    { icon: '🗂️', label: 'Catalogue',         path: '/mokinelab/dashboard/catalogue' },
    { icon: '📋', label: 'Mes scans',         path: '/mokinelab/dashboard/scans' },
  ],
  developer: [
    { icon: '🏠', label: 'Accueil',           path: '/mokinelab/dashboard' },
    { icon: '🧬', label: 'Mes modèles',       path: '/mokinelab/dashboard/models' },
    { icon: '➕', label: 'Créer un modèle',   path: '/mokinelab/dashboard/models/new' },
    { icon: '📂', label: 'Dataset',           path: '/mokinelab/dashboard/dataset' },
    { icon: '🔑', label: 'Clés API',          path: '/mokinelab/dashboard/api-keys' },
    { icon: '📈', label: 'Analytics',         path: '/mokinelab/dashboard/analytics' },
    { icon: '📸', label: 'Scan Tebe IA',      path: '/mokinelab' },
  ],
  veterinarian: [
    { icon: '🏠', label: 'Accueil',           path: '/mokinelab/dashboard' },
    { icon: '📸', label: 'Scan Tebe IA',      path: '/mokinelab' },
    { icon: '✅', label: 'À valider',          path: '/mokinelab/dashboard/validate' },
    { icon: '🤝', label: 'Mes contributions', path: '/mokinelab/dashboard/contributions' },
    { icon: '🗂️', label: 'Catalogue clinique',path: '/mokinelab/dashboard/catalogue' },
    { icon: '📋', label: 'Mes scans',         path: '/mokinelab/dashboard/scans' },
  ],
  lab_admin: [
    { icon: '🏠', label: 'Accueil',           path: '/mokinelab/dashboard' },
    { icon: '👥', label: 'Membres',           path: '/mokinelab/dashboard/members' },
    { icon: '📂', label: 'Demandes dataset',  path: '/mokinelab/dashboard/dataset-requests' },
    { icon: '⚙️', label: 'Jobs entraînement', path: '/mokinelab/dashboard/jobs' },
    { icon: '🧬', label: 'Modèles',           path: '/mokinelab/dashboard/models' },
    { icon: '📊', label: 'Dataset global',    path: '/mokinelab/dashboard/dataset' },
    { icon: '📈', label: 'Statistiques',      path: '/mokinelab/dashboard/stats' },
  ],
};

const ROLE_LABELS = {
  researcher:   { label: 'Chercheur',    icon: '🔬', color: 'bg-blue-100 text-blue-700' },
  developer:    { label: 'Développeur',  icon: '🔌', color: 'bg-purple-100 text-purple-700' },
  veterinarian: { label: 'Vétérinaire',  icon: '🩺', color: 'bg-green-100 text-green-700' },
  lab_admin:    { label: 'Admin Lab',    icon: '🛡️', color: 'bg-red-100 text-red-700' },
};

// ── Blocs de bienvenue par rôle ───────────────────────────────────────────────
function WelcomeCards({ role }) {
  const cards = {
    researcher: [
      { icon: '📸', title: 'Scanner un animal', desc: 'Utilisez Tebe IA pour un diagnostic photo instantané.', action: 'Lancer le scan', path: '/mokinelab#scan', color: PRIMARY },
      { icon: '🤝', title: 'Contribuer', desc: 'Soumettez vos photos annotées au dataset Tebe.', action: 'Contribuer', path: '/mokinelab#contribuer', color: '#7c3aed' },
      { icon: '📊', title: 'Modèle Tebe', desc: 'Suivez la progression du modèle Tebe v1.0.', action: 'Voir le modèle', path: '/mokinelab#modele', color: '#0891b2' },
    ],
    developer: [
      { icon: '🧬', title: 'Créer un modèle', desc: 'Définissez votre modèle IA vétérinaire personnalisé.', action: 'Créer', path: '/mokinelab/dashboard/models/new', color: '#7c3aed', soon: false },
      { icon: '📂', title: 'Accès dataset', desc: 'Demandez l\'accès aux données d\'entraînement Mokine.', action: 'Faire une demande', path: '/mokinelab/dashboard/dataset', color: '#ea580c', soon: false },
      { icon: '🔑', title: 'Clés API', desc: 'Gérez vos clés API pour intégrer Tebe dans vos apps.', action: 'Mes clés', path: '/mokinelab/dashboard/api-keys', color: PRIMARY, soon: false },
    ],
    veterinarian: [
      { icon: '✅', title: 'Valider des contributions', desc: 'Votre validation vaut 2x en valeur d\'entraînement.', action: 'Voir les contributions', path: '/mokinelab/dashboard/validate', color: PRIMARY },
      { icon: '📸', title: 'Scanner un animal', desc: 'Diagnostic photo Tebe IA avec accès aux détails cliniques.', action: 'Lancer le scan', path: '/mokinelab#scan', color: '#0891b2' },
      { icon: '🤝', title: 'Contribuer', desc: 'Soumettez vos cas cliniques annotés au dataset.', action: 'Contribuer', path: '/mokinelab#contribuer', color: '#7c3aed' },
    ],
    lab_admin: [
      { icon: '📂', title: 'Demandes dataset', desc: 'Approuvez ou rejetez les demandes d\'accès.', action: 'Gérer', path: '/mokinelab/dashboard/dataset-requests', color: '#ea580c' },
      { icon: '⚙️', title: 'Jobs d\'entraînement', desc: 'Supervisez les jobs en cours sur l\'infra Mokine.', action: 'Voir les jobs', path: '/mokinelab/dashboard/jobs', color: '#7c3aed' },
      { icon: '👥', title: 'Membres', desc: 'Gérez les chercheurs, développeurs et vétérinaires.', action: 'Gérer', path: '/mokinelab/dashboard/members', color: PRIMARY },
    ],
  };

  const list = cards[role] || cards.researcher;

  return (
    <div className="grid sm:grid-cols-3 gap-4 mb-8">
      {list.map(c => (
        <div key={c.title} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
          <div className="text-3xl mb-3">{c.icon}</div>
          <h3 className="font-semibold text-gray-800 mb-1">{c.title}</h3>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">{c.desc}</p>
          {c.soon ? (
            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-400 font-medium">Bientôt disponible</span>
          ) : (
            <Link to={c.path}
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white inline-block transition-all"
              style={{ background: c.color }}>
              {c.action} →
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function LabDashboard() {
  const { user, logout } = useLabAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const roleInfo = ROLE_LABELS[user?.role] || ROLE_LABELS.researcher;
  const navLinks = NAV[user?.role] || NAV.researcher;
  const currentPath = window.location.pathname;

  const handleLogout = () => { logout(); navigate('/mokinelab'); };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 shadow-sm flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: PRIMARY }}>M</div>
          <span className="font-bold text-gray-800">
            Mokine<span style={{ color: PRIMARY }}>Lab</span>
          </span>
        </div>

        {/* Profil */}
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

        {/* Navigation */}
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

        {/* Déconnexion */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all">
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Contenu principal ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
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

        {/* Page body */}
        <main className="flex-1 p-6">
          {/* Bienvenue */}
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900">
              Bienvenue, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {roleInfo.icon} Espace {roleInfo.label} — MokineLab · Laboratoire IA vétérinaire Mokine
            </p>
          </div>

          {/* Alerte accès dataset (développeur en attente) */}
          {user?.role === 'developer' && user?.datasetAccess === 'none' && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">📂</span>
              <div>
                <p className="font-semibold text-orange-800 text-sm">Accès dataset non activé</p>
                <p className="text-orange-700 text-xs mt-0.5">
                  Pour entraîner vos modèles, faites une demande d'accès au dataset Mokine. L'admin validera votre demande sous 48h.
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
                  Votre demande est en cours d'examen par l'équipe Mokine. Vous serez notifié par email dès validation.
                </p>
              </div>
            </div>
          )}

          {/* Cartes d'actions rapides */}
          <WelcomeCards role={user?.role} />

          {/* Stats rapides */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Activité récente</h3>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-4xl mb-3">🚀</div>
              <p className="text-gray-500 text-sm font-medium">Votre espace est prêt</p>
              <p className="text-gray-400 text-xs mt-1">
                Commencez par explorer les fonctionnalités de MokineLab ci-dessus.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 text-center text-xs text-gray-400 border-t border-gray-100">
          © {new Date().getFullYear()} MokineLab · Laboratoire IA vétérinaire Mokine · infos@trugroup.cm
        </footer>
      </div>
    </div>
  );
}
