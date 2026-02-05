/**
 * Auth context
 * - Hydrates initial auth state from AsyncStorage
 * - Provides login/logout helpers to screens
 * - Listens for token expiry events from API client
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { clearAuthStorage } from '../services/api/client';
import { logoutApi } from '../services/api/auth';
import { disconnectDriverSocket } from '../services/realtime/socket';
import { authEvents } from '../services/api/authEvents';

type AuthContextValue = {
  isHydrated: boolean;
  isLoggedIn: boolean;
  markLoggedIn: () => void;
  logout: () => Promise<void>;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
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
  const [sessionExpired, setSessionExpired] = useState(false);
  const isLoggingOutRef = useRef(false);

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

  // Listen for token expiry events from API client
  useEffect(() => {
    const handleTokenExpired = async () => {
      // Prevent multiple logout calls
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      try {
        // Disconnect socket before clearing auth
        disconnectDriverSocket();
        await clearAuthStorage();
        setIsLoggedIn(false);
        setSessionExpired(true);
      } finally {
        isLoggingOutRef.current = false;
      }
    };

    authEvents.on('TOKEN_EXPIRED', handleTokenExpired);

    return () => {
      authEvents.off('TOKEN_EXPIRED', handleTokenExpired);
    };
  }, []);

  const markLoggedIn = useCallback(() => {
    setIsLoggedIn(true);
    setSessionExpired(false);
  }, []);

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const logout = useCallback(async () => {
    // Prevent multiple logout calls
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      // Backend confirms logout (token invalidation is not implemented server-side).
      await logoutApi();
    } catch {
      // Always clear local auth even if backend logout fails (offline, token expired, etc.).
    } finally {
      // Disconnect socket before clearing auth
      disconnectDriverSocket();
      await clearAuthStorage();
      setIsLoggedIn(false);
      isLoggingOutRef.current = false;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isHydrated, isLoggedIn, markLoggedIn, logout, sessionExpired, clearSessionExpired }),
    [isHydrated, isLoggedIn, markLoggedIn, logout, sessionExpired, clearSessionExpired]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

