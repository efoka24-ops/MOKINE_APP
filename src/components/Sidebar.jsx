// src/components/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  CalendarIcon,
  ShoppingCartIcon,
  BriefcaseIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  SparklesIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import logo from "../assets/logo-removebg-preview.png";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = { farmer: '🐄 Éleveur', veterinarian: '🩺 Vétérinaire', vendor: '🏪 Fournisseur', admin: '⚙️ Admin' };
const ROLE_COLORS = { farmer: 'bg-green-100 text-green-700', veterinarian: 'bg-blue-100 text-blue-700', vendor: 'bg-orange-100 text-orange-700', admin: 'bg-purple-100 text-purple-700' };

const LINKS_FARMER = [
  { to: '/dashboard',         label: 'Tableau de bord',   icon: HomeIcon },
  { to: '/animals',            label: 'Mon Cheptel',        icon: ClipboardDocumentListIcon },
  { to: '/consultation',      label: 'Consultation',       icon: BriefcaseIcon },
  { to: '/tebe',              label: 'Diagnostic IA',      icon: SparklesIcon },
  { to: '/alertes-sanitaires',label: 'Alertes sanitaires', icon: ExclamationTriangleIcon },
  { to: '/marketplace',       label: 'Marketplace',        icon: ShoppingCartIcon },
  { to: '/farm-management',   label: 'Ma Ferme',           icon: BuildingOffice2Icon },
  { to: '/rendezvous',        label: 'Rendez-vous',        icon: CalendarIcon },
  { to: '/notifications',     label: 'Notifications',      icon: BellIcon },
];

const LINKS_VET = [
  { to: '/vet/dashboard', label: 'Tableau de bord', icon: HomeIcon },
  { to: '/consultation', label: 'Consultations', icon: BriefcaseIcon },
  { to: '/ordonnances', label: 'Ordonnances', icon: DocumentTextIcon },
  { to: '/rendezvous', label: 'Rendez-vous', icon: CalendarIcon },
  { to: '/notifications', label: 'Notifications', icon: BellIcon },
];

const LINKS_VENDOR = [
  { to: '/vendor/dashboard', label: 'Tableau de bord', icon: HomeIcon },
  { to: '/marketplace', label: 'Ma Boutique', icon: ShoppingCartIcon },
  { to: '/notifications', label: 'Notifications', icon: BellIcon },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || 'farmer';
  const links = role === 'veterinarian' ? LINKS_VET : role === 'vendor' ? LINKS_VENDOR : LINKS_FARMER;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md p-4 transition-transform transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0 md:flex md:flex-col md:h-screen md:sticky md:top-0`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between mb-6">
        <NavLink to="/" className="flex items-center gap-3">
          <img src={logo} alt="MokineVet" className="h-10 w-auto object-contain" />
        </NavLink>
        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm ${
                isActive
                  ? "bg-green-100 text-green-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`
            }
          >
            <l.icon className="h-5 w-5 shrink-0" />
            {l.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user card */}
      <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
        {/* Paramètres link */}
        <NavLink
          to="/parametres"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition ${
              isActive ? 'bg-gray-100 text-gray-800 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`
          }
        >
          <Cog6ToothIcon className="h-5 w-5" />
          Paramètres
        </NavLink>

        {/* User info + logout */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition">
          <NavLink to="/parametres" onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-green-200" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'Utilisateur'}</p>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600'}`}>
                {ROLE_LABELS[role] || role}
              </span>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
