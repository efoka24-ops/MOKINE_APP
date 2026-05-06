import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BarChart3, Users, CreditCard, Pill, Settings, LogOut } from 'lucide-react';

export default function AdminSidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <BarChart3 size={20} /> },
    { path: '/admin/users', label: 'Utilisateurs', icon: <Users size={20} /> },
    { path: '/admin/veterinarians', label: 'Vétérinaires', icon: <Pill size={20} /> },
    { path: '/admin/payments', label: 'Paiements', icon: <CreditCard size={20} /> },
    { path: '/admin/products', label: 'Produits', icon: <Pill size={20} /> },
    { path: '/admin/settings', label: 'Paramètres', icon: <Settings size={20} /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-[#178A3B] text-white transform transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static`}
      >
        <div className="p-6 border-b border-green-700">
          <h1 className="text-2xl font-bold">Mokine Admin</h1>
          <p className="text-sm text-green-100">Panneau d'administration</p>
        </div>

        <nav className="pt-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => toggleSidebar(false)}
              className={`flex items-center gap-3 px-6 py-3 transition ${
                isActive(item.path)
                  ? 'bg-green-700 border-l-4 border-white'
                  : 'hover:bg-green-600'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 pt-6 border-t border-green-700">
          <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-green-600 rounded transition">
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => toggleSidebar(false)}
        />
      )}
    </>
  );
}
