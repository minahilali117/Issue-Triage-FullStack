'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthResponse, AuthUser } from '@/types/auth';
import { fetchCurrentUser } from '@/lib/api';

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
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedSession = readStoredSession();
    if (storedSession) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession(storedSession);
      void fetchCurrentUser()
        .then((user) => {
          const syncedSession = { ...storedSession, user };
          setSession(syncedSession);
          window.localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify(syncedSession),
          );
        })
        .catch(() => {
          setSession(null);
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        });
    }
    setIsReady(true);
  }, []);

  const signIn = (session: AuthResponse) => {
    setSession(session);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  };

  const signOut = () => {
    setSession(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isReady,
      isAuthenticated: Boolean(session?.user && session?.accessToken),
      signIn,
      signOut,
    }),
    [isReady, session],
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
