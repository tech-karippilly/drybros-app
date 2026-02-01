/**
 * Auth context
 * - Hydrates initial auth state from AsyncStorage
 * - Provides login/logout helpers to screens
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { clearAuthStorage } from '../services/api/client';
import { logoutApi } from '../services/api/auth';

type AuthContextValue = {
  isHydrated: boolean;
  isLoggedIn: boolean;
  markLoggedIn: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!mounted) return;
        setIsLoggedIn(Boolean(token));
      } finally {
        if (mounted) setIsHydrated(true);
      }
    };
    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const markLoggedIn = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Backend confirms logout (token invalidation is not implemented server-side).
      await logoutApi();
    } catch {
      // Always clear local auth even if backend logout fails (offline, token expired, etc.).
    } finally {
      await clearAuthStorage();
      setIsLoggedIn(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isHydrated, isLoggedIn, markLoggedIn, logout }),
    [isHydrated, isLoggedIn, markLoggedIn, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

