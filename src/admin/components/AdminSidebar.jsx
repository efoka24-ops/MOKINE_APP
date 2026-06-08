import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Stethoscope, Users, Dog, MessageSquare, FileText, Calendar,
  AlertTriangle, Radio, Package, ShoppingCart, Building2, ClipboardCheck,
  FlaskConical, Activity, Settings, CreditCard, Bell,
  ChevronDown, ChevronRight, LogOut, X, Menu,
} from 'lucide-react';

const MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard Global',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    color: 'text-white',
  },
  {
    id: 'veto',
    label: 'MokineVeto',
    icon: Stethoscope,
    color: 'text-emerald-300',
    badge: '🏥',
    children: [
      { label: 'Vétérinaires', icon: Stethoscope, path: '/admin/veto' },
      { label: 'Éleveurs', icon: Users, path: '/admin/veto?tab=farmers' },
      { label: 'Animaux', icon: Dog, path: '/admin/veto?tab=animals' },
      { label: 'Consultations', icon: MessageSquare, path: '/admin/veto?tab=consultations' },
      { label: 'Ordonnances', icon: FileText, path: '/admin/veto?tab=prescriptions' },
      { label: 'Rendez-vous', icon: Calendar, path: '/admin/veto?tab=appointments' },
      { label: 'Alertes Sanitaires', icon: AlertTriangle, path: '/admin/veto?tab=sanitary' },
    ],
  },
  {
    id: 'box',
    label: 'MokineBox',
    icon: Radio,
    color: 'text-sky-300',
    badge: '📡',
    children: [
      { label: 'Appareils IoT', icon: Radio, path: '/admin/box' },
      { label: 'Alertes IoT', icon: AlertTriangle, path: '/admin/box?tab=alerts' },
      { label: 'Données Capteurs', icon: Activity, path: '/admin/box?tab=readings' },
    ],
  },
  {
    id: 'market',
    label: 'MokineMarket',
    icon: ShoppingCart,
    color: 'text-amber-300',
    badge: '🛒',
    children: [
      { label: 'Produits', icon: Package, path: '/admin/market' },
      { label: 'Commandes', icon: ShoppingCart, path: '/admin/market?tab=orders' },
      { label: 'Fournisseurs', icon: Building2, path: '/admin/market?tab=vendors' },
      { label: 'KYC', icon: ClipboardCheck, path: '/admin/market?tab=kyc' },
    ],
  },
  {
    id: 'lab',
    label: 'MokineLab',
    icon: FlaskConical,
    color: 'text-violet-300',
    badge: '🧬',
    children: [
      { label: 'Modèles IA', icon: FlaskConical, path: '/admin/lab' },
      { label: 'Contributions', icon: FileText, path: '/admin/lab?tab=contributions' },
    ],
  },
  {
    id: 'system',
    label: 'Système',
    icon: Settings,
    color: 'text-gray-300',
    badge: '⚙️',
    children: [
      { label: 'Utilisateurs', icon: Users, path: '/admin/system' },
      { label: 'Paiements', icon: CreditCard, path: '/admin/system?tab=payments' },
      { label: 'Notifications', icon: Bell, path: '/admin/system?tab=notifications' },
      { label: 'Paramètres', icon: Settings, path: '/admin/system?tab=settings' },
    ],
  },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState({ veto: true, system: false, box: false, market: false, lab: false });

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const isChildActive = (path) => {
    const [pname, qs] = path.split('?');
    if (location.pathname !== pname) return false;
    if (!qs) return !location.search || location.search === '?';
    return location.search === `?${qs}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('mokine_token');
    localStorage.removeItem('mokine_user');
    navigate('/login');
  };

  return (
    <>
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-[#0f1f14] text-white flex flex-col
        transform transition-transform duration-300 z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐄</span>
              <span className="text-lg font-bold tracking-tight">Mokine Admin</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Back Office Unifié</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {MODULES.map((mod) => {
            const Icon = mod.icon;

            if (!mod.children) {
              return (
                <NavLink
                  key={mod.id}
                  to={mod.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#178A3B] text-white'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon size={17} />
                  <span>{mod.label}</span>
                </NavLink>
              );
            }

            return (
              <div key={mod.id}>
                <button
                  onClick={() => toggle(mod.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className={mod.color} />
                    <span className={mod.color}>{mod.badge} {mod.label}</span>
                  </div>
                  {expanded[mod.id]
                    ? <ChevronDown size={14} className="text-gray-500" />
                    : <ChevronRight size={14} className="text-gray-500" />
                  }
                </button>

                {expanded[mod.id] && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                    {mod.children.map((child) => {
                      const ChildIcon = child.icon;
                      const active = isChildActive(child.path);
                      return (
                        <button
                          key={child.path}
                          onClick={() => { navigate(child.path); onClose?.(); }}
                          className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-colors text-left ${
                            active
                              ? 'bg-[#178A3B]/80 text-white font-medium'
                              : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'
                          }`}
                        >
                          <ChildIcon size={14} />
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
