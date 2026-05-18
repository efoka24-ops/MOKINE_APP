/**
 * OfflineContext — Mode hors ligne avec queue de synchronisation
 * Stocke les actions en attente dans localStorage et les rejoue au retour en ligne
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const OfflineContext = createContext(null);
const QUEUE_KEY = 'mokine_offline_queue';
const CACHE_KEY = 'mokine_offline_cache';

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [queue, setQueue] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      // Validate: must be an array of plain objects (no DOM elements)
      if (!Array.isArray(stored)) { localStorage.removeItem(QUEUE_KEY); return []; }
      return stored;
    } catch { localStorage.removeItem(QUEUE_KEY); return []; }
  });

  const saveQueue = (q) => {
    setQueue(q);
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch {
      // Circular structure or non-serializable item — reset queue to empty
      localStorage.removeItem(QUEUE_KEY);
      setQueue([]);
    }
  };

  // Cache data for offline reading
  const cacheData = useCallback((key, data) => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      cache[key] = { data, cachedAt: new Date().toISOString() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {}
  }, []);

  const getCachedData = useCallback((key) => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      return cache[key]?.data || null;
    } catch { return null; }
  }, []);

  // Queue an action to replay when back online
  const enqueue = useCallback((action) => {
    const item = { id: Date.now(), ...action, queuedAt: new Date().toISOString() };
    const newQueue = [...queue, item];
    saveQueue(newQueue);
    return item.id;
  }, [queue]);

  // Replay queued actions
  const syncQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0 || syncing) return;
    setSyncing(true);
    const remaining = [];
    for (const item of queue) {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        let body;
        try { body = item.body ? JSON.stringify(item.body) : undefined; } catch { continue; }
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}${item.url}`, {
          method: item.method || 'POST',
          headers,
          body
        });
        if (!res.ok && res.status >= 500) remaining.push(item); // keep on server error
      } catch {
        remaining.push(item); // keep if network fails
      }
    }
    saveQueue(remaining);
    setSyncing(false);
  }, [isOnline, queue, syncing]);

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  useEffect(() => {
    if (isOnline && queue.length > 0) {
      const timer = setTimeout(syncQueue, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, queue.length]);

  return (
    <OfflineContext.Provider value={{ isOnline, syncing, pendingCount: queue.length, enqueue, cacheData, getCachedData, syncQueue }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be within OfflineProvider');
  return ctx;
};

export default OfflineProvider;
