import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../API';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mokine_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('mokine_token');
      const savedUser = localStorage.getItem('mokine_user');
      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('mokine_token');
          localStorage.removeItem('mokine_user');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await auth.login({ email, password });
    const { user: userData, token: authToken } = response.data;
    localStorage.setItem('mokine_token', authToken);
    localStorage.setItem('mokine_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const response = await auth.register(formData);
    const { user: userData, token: authToken } = response.data;
    localStorage.setItem('mokine_token', authToken);
    localStorage.setItem('mokine_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('mokine_token');
    localStorage.removeItem('mokine_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem('mokine_user', JSON.stringify(merged));
    setUser(merged);
  }, [user]);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
