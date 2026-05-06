import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = (state) => {
    setSidebarOpen(state !== undefined ? state : !sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => toggleSidebar(!sidebarOpen)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <Menu />
            </button>

            <h2 className="text-gray-800 font-semibold">Panneau Administrateur Mokine</h2>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold">Admin User</p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
              <img
                src="https://via.placeholder.com/40"
                alt="Avatar"
                className="w-10 h-10 rounded-full bg-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
