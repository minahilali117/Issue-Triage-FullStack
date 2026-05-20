'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthResponse, AuthUser } from '@/types/auth';

const AUTH_STORAGE_KEY = 'triage_dashboard_auth';

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  signIn: (session: AuthResponse) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredSession = (): AuthResponse | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const session = readStoredSession();
    if (session) {
      setUser(session.user);
      setAccessToken(session.accessToken);
    }
    setIsReady(true);
  }, []);

  const signIn = (session: AuthResponse) => {
    setUser(session.user);
    setAccessToken(session.accessToken);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  };

  const signOut = () => {
    setUser(null);
    setAccessToken(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isReady,
      isAuthenticated: Boolean(user && accessToken),
      signIn,
      signOut,
    }),
    [user, accessToken, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
