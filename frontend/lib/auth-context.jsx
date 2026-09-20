'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { apiGet } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mp_token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiGet('/auth/me', { auth: true })
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('mp_token');
        localStorage.removeItem('mp_user');
      })
      .finally(() => setLoading(false));
  }, []);

  function login(token, newUser) {
    localStorage.setItem('mp_token', token);
    localStorage.setItem('mp_user', JSON.stringify(newUser));
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('mp_token');
    localStorage.removeItem('mp_user');
    setUser(null);
  }

  const hasRole = (role) => user?.roles?.includes(role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}