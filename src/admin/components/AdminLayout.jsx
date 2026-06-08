import React, { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useNavigate, useLocation } from 'react-router-dom';

const MODULE_TITLES = {
  '/admin/dashboard': 'Dashboard Global',
  '/admin/veto':      'MokineVeto — Santé Animale',
  '/admin/box':       'MokineBox — Objets Connectés',
  '/admin/market':    'MokineMarket — Marketplace',
  '/admin/lab':       'MokineLab — Intelligence Artificielle',
  '/admin/system':    'Système & Configuration',
};

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = MODULE_TITLES[location.pathname] || 'Administration';

  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem('mokine_user') || '{}'); } catch { return {}; }
  })();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-semibold text-gray-700 hidden sm:block">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#178A3B] flex items-center justify-center text-white text-sm font-bold">
                {(adminUser.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-right">
                <p className="text-xs font-semibold text-gray-800">{adminUser.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
