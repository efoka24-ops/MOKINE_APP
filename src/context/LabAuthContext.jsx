import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const LabAuthContext = createContext(null);

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'lab_token';
const USER_KEY  = 'lab_user';

export function LabAuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Vérifie la session au démarrage
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    axios.get(`${API_BASE}/api/lab/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { setUser(r.data.user); localStorage.setItem(USER_KEY, JSON.stringify(r.data.user)); })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setToken(null); setUser(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const register = async (formData) => {
    const r = await axios.post(`${API_BASE}/api/lab/auth/register`, formData);
    _persist(r.data.token, r.data.user);
    return r.data;
  };

  const login = async (email, password) => {
    const r = await axios.post(`${API_BASE}/api/lab/auth/login`, { email, password });
    _persist(r.data.token, r.data.user);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const _persist = (tok, usr) => {
    localStorage.setItem(TOKEN_KEY, tok);
    localStorage.setItem(USER_KEY, JSON.stringify(usr));
    setToken(tok);
    setUser(usr);
  };

  return (
    <LabAuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!user,
      register, login, logout,
    }}>
      {children}
    </LabAuthContext.Provider>
  );
}

export const useLabAuth = () => {
  const ctx = useContext(LabAuthContext);
  if (!ctx) throw new Error('useLabAuth doit être utilisé dans LabAuthProvider');
  return ctx;
};
