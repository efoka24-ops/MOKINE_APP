import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { notifications as notifAPI } from '../API';
import { TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const TYPE_CONFIG = {
  consultation: { icon: '💬', color: 'bg-blue-50 border-blue-300', badge: 'bg-blue-100 text-blue-700' },
  appointment: { icon: '📅', color: 'bg-purple-50 border-purple-300', badge: 'bg-purple-100 text-purple-700' },
  alert: { icon: '⚠️', color: 'bg-red-50 border-red-300', badge: 'bg-red-100 text-red-700' },
  payment: { icon: '💳', color: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-100 text-yellow-700' },
  info: { icon: 'ℹ️', color: 'bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-600' },
};

function getConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.info;
}

export default function Notification() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread
  const socketRef = useRef(null);

  // Load from API
  const load = async () => {
    try {
      const res = await notifAPI.getAll();
      setList(res.data || []);
    } catch { /* */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (!user) return;
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;
    socket.emit('join_user', user.id);
    socket.on('new_notification', (notif) => {
      setList(prev => [notif, ...prev]);
    });
    return () => socket.disconnect();
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await notifAPI.markAsRead(id);
      setList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { /* */ }
  };

  const handleMarkAll = async () => {
    try {
      await notifAPI.markAllAsRead();
      setList(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* */ }
  };

  const handleDelete = async (id) => {
    try {
      await notifAPI.delete(id);
      setList(prev => prev.filter(n => n.id !== id));
    } catch { /* */ }
  };

  const displayed = filter === 'unread' ? list.filter(n => !n.read) : list;
  const unreadCount = list.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔔 Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md transition font-medium ${filter === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-sm rounded-md transition font-medium ${filter === 'unread' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Non lues {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5">{unreadCount}</span>}
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Tout marquer lu
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">Chargement...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔕</div>
          <p className="text-gray-500">{filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {displayed.map(n => {
            const cfg = getConfig(n.type);
            return (
              <li
                key={n.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition ${cfg.color} ${!n.read ? 'shadow-sm' : 'opacity-80'}`}
              >
                <span className="text-2xl mt-0.5">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold text-gray-800 ${!n.read ? '' : 'font-normal'}`}>
                      {n.title || n.message}
                    </p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Non lue" />
                    )}
                  </div>
                  {n.title && <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : ''}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      title="Marquer comme lu"
                      className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 transition"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    title="Supprimer"
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

