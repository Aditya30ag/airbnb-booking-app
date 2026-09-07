'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, type SignupData } from '@/services/authApi';
import type { User } from '@/types';
import { useToast } from '@/hooks/useToast';

interface AuthModalOptions {
  initialTab?: 'login' | 'signup';
  defaultRole?: 'guest' | 'host';
  redirectUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isHost: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string) => Promise<User>;
  signup: (data: SignupData) => Promise<User>;
  becomeHost: () => Promise<User>;
  logout: () => void;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'signup';
  authModalRole: 'guest' | 'host';
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: 'login' | 'signup') => void;
  setAuthModalRole: (role: 'guest' | 'host') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast();

  // User state initializes to null so server and initial client render match identically
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');
  const [authModalRole, setAuthModalRole] = useState<'guest' | 'host'>('guest');

  // Verify and sync current user session on mount
  useEffect(() => {
    // 1. Immediately read cached user from localStorage on client mount (post-hydration)
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('user_data');
      if (storedData) {
        try {
          setUser(JSON.parse(storedData));
        } catch {
          // fallback below
        }
      } else {
        const storedId = localStorage.getItem('user_id');
        const storedRole = localStorage.getItem('user_role');
        if (storedId) {
          setUser({
            id: storedId,
            email: '',
            full_name: storedRole === 'host' ? 'Host User' : 'Guest User',
            is_host: storedRole === 'host',
            role: storedRole || 'guest',
          });
        }
      }
    }

    // 2. Verify with backend in background
    const initAuth = async () => {
      const storedId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
      if (!storedId) {
        setLoading(false);
        return;
      }

      try {
        const me = await authApi.getMe();
        setUser(me);
        localStorage.setItem('user_id', me.id);
        localStorage.setItem('user_role', me.is_host ? 'host' : 'guest');
        localStorage.setItem('user_data', JSON.stringify(me));
      } catch (err: any) {
        // Only clear credentials if backend explicitly responds that user was not found
        if (err?.message?.includes('not found') || err?.message?.includes('401')) {
          console.warn('Invalid user session in localStorage, clearing credentials');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_data');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string): Promise<User> => {
    try {
      const loggedIn = await authApi.login(email);
      localStorage.setItem('user_id', loggedIn.id);
      localStorage.setItem('user_role', loggedIn.is_host ? 'host' : 'guest');
      localStorage.setItem('user_data', JSON.stringify(loggedIn));
      setUser(loggedIn);
      addToast(`Welcome back, ${loggedIn.full_name}!`, 'success');
      setIsAuthModalOpen(false);
      return loggedIn;
    } catch (err: any) {
      addToast(err.message || 'Failed to sign in', 'error');
      throw err;
    }
  }, [addToast]);

  const signup = useCallback(async (data: SignupData): Promise<User> => {
    try {
      const newUser = await authApi.signup(data);
      localStorage.setItem('user_id', newUser.id);
      localStorage.setItem('user_role', newUser.is_host ? 'host' : 'guest');
      localStorage.setItem('user_data', JSON.stringify(newUser));
      setUser(newUser);
      addToast(`Account created! Welcome, ${newUser.full_name}.`, 'success');
      setIsAuthModalOpen(false);
      return newUser;
    } catch (err: any) {
      addToast(err.message || 'Failed to create account', 'error');
      throw err;
    }
  }, [addToast]);

  const becomeHost = useCallback(async (): Promise<User> => {
    try {
      const updated = await authApi.becomeHost();
      localStorage.setItem('user_role', 'host');
      localStorage.setItem('user_data', JSON.stringify(updated));
      setUser(updated);
      addToast('Hosting mode activated! Welcome to your Host Dashboard.', 'success');
      return updated;
    } catch (err: any) {
      addToast(err.message || 'Failed to activate hosting mode', 'error');
      throw err;
    }
  }, [addToast]);

  const logout = useCallback(() => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_data');
    setUser(null);
    addToast('You have been signed out.', 'info');
  }, [addToast]);

  const openAuthModal = useCallback((options?: AuthModalOptions) => {
    if (options?.initialTab) setAuthModalTab(options.initialTab);
    if (options?.defaultRole) setAuthModalRole(options.defaultRole);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const isHost = Boolean(user?.is_host || user?.role === 'host');
  const isAuthenticated = Boolean(user && user.id);

  return (
    <AuthContext.Provider
      value={{
        user,
        isHost,
        isAuthenticated,
        loading,
        login,
        signup,
        becomeHost,
        logout,
        isAuthModalOpen,
        authModalTab,
        authModalRole,
        openAuthModal,
        closeAuthModal,
        setAuthModalTab,
        setAuthModalRole,
      }}
    >
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
