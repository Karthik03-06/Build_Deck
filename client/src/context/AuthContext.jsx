import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await api.get('/auth/me');
      if (res.data.authenticated) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGithub() {
    try {
      const res = await api.get('/auth/github');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Failed to get GitHub auth URL:', err);
    }
  }

  async function demoLogin() {
    try {
      const res = await api.post('/auth/demo-login');
      if (res.data.success) {
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      console.error('Demo login failed:', err);
      throw err;
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, loginWithGithub, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
