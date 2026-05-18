import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  BellIcon,
  Cog6ToothIcon,
  Bars3Icon,
  CheckCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { notifications as notifAPI } from "../API";

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const PAGE_TITLES = {
  '/dashboard': 'Tableau de bord',
  '/vet/dashboard': 'Tableau de bord',
  '/vendor/dashboard': 'Tableau de bord',
  '/rendezvous': 'Rendez-vous',
  '/marketplace': 'Marketplace',
  '/consultation': 'Consultation',
  '/ia': 'Prédiagnostic IA',
  '/notifications': 'Notifications',
  '/parametres': 'Paramètres',
};

const TYPE_ICONS = { consultation: '💬', appointment: '📅', alert: '⚠️', payment: '💳', info: 'ℹ️' };

export default function Header({ toggleSidebar }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [notifList, setNotifList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const notifRef = useRef(null);
  const settingsRef = useRef(null);
  const socketRef = useRef(null);

  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const title = PAGE_TITLES[pathname] || '';

  // Load notifications from API
  const loadNotifs = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        notifAPI.getAll(),
        notifAPI.getUnreadCount(),
      ]);
      setNotifList((listRes.data || []).slice(0, 10));
      setUnreadCount(countRes.data?.unreadCount ?? 0);
    } catch { /* silently fail */ }
  };

  useEffect(() => {
    if (!user) return;
    loadNotifs();

    // Real-time socket
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;
    socket.emit('join_user', user.id);
    socket.on('new_notification', (notif) => {
      setNotifList(prev => [notif, ...prev].slice(0, 10));
      setUnreadCount(prev => prev + 1);
    });
    return () => socket.disconnect();
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notifAPI.markAsRead(id);
      setNotifList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* */ }
  };

  const handleDelete = async (id) => {
    try {
      await notifAPI.delete(id);
      const wasUnread = notifList.find(n => n.id === id && !n.read);
      setNotifList(prev => prev.filter(n => n.id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* */ }
  };

  const handleMarkAll = async () => {
    try {
      await notifAPI.markAllAsRead();
      setNotifList(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* */ }
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="w-full h-16 bg-white shadow-sm flex items-center justify-between px-6 z-30">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-600 hover:text-gray-900">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm hidden sm:block">{today}</span>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(v => !v); setSettingsOpen(false); }}
            className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Notifications</span>
                <button onClick={handleMarkAll} className="text-xs text-green-600 hover:underline">Tout marquer lu</button>
              </div>
              {notifList.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">Aucune notification</p>
              ) : (
                <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifList.map(n => (
                    <li key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition ${!n.read ? 'bg-green-50' : ''}`}>
                      <span className="text-lg mt-0.5">{TYPE_ICONS[n.type] || 'ℹ️'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!n.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                          {n.title || n.message}
                        </p>
                        {n.title && <p className="text-xs text-gray-500 truncate">{n.message}</p>}
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {!n.read && (
                          <button onClick={() => handleMarkRead(n.id)} title="Marquer lu" className="text-green-500 hover:text-green-700">
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(n.id)} title="Supprimer" className="text-gray-300 hover:text-red-400">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-gray-100 px-4 py-2">
                <Link to="/notifications" onClick={() => setNotifOpen(false)} className="text-sm text-green-600 hover:underline">
                  Voir toutes les notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => { setSettingsOpen(v => !v); setNotifOpen(false); }}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </button>
          {settingsOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
              <Link to="/parametres" onClick={() => setSettingsOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                👤 Mon profil
              </Link>
              <Link to="/parametres?tab=privacy" onClick={() => setSettingsOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                🔒 Confidentialité
              </Link>
              <Link to="/parametres?tab=help" onClick={() => setSettingsOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                ❓ Aide
              </Link>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  🚪 Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <Link to="/parametres" className="hidden sm:block">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border-2 border-green-200" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm border-2 border-green-200">
              {initials}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
