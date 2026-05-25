'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthResponse, AuthUser } from '@/types/auth';
import { fetchCurrentUser, logout } from '@/lib/api';
import { appToast } from '@/lib/toast';

const AUTH_CHANNEL_NAME = 'triage_dashboard_auth';
const AUTH_EVENT_KEY = 'triage_dashboard_auth_event';
type AuthEvent = { type: 'login' | 'logout'; ts: number };

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  signIn: (session: AuthResponse) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const broadcastAuthEvent = (event: AuthEvent) => {
  if (typeof window === 'undefined') {
    return;
  }

  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    channel.postMessage(event);
    channel.close();
  }

  try {
    window.localStorage.setItem(AUTH_EVENT_KEY, JSON.stringify(event));
    window.localStorage.removeItem(AUTH_EVENT_KEY);
  } catch {
    // Ignore storage failures (private mode, quota issues).
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const clearSession = useCallback(
    (shouldBroadcast: boolean) => {
      setUser(null);
      queryClient.clear();
      if (shouldBroadcast) {
        broadcastAuthEvent({ type: 'logout', ts: Date.now() });
      }
    },
    [queryClient],
  );

  const refreshSession = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshSession();

    const handleAuthEvent = (event: AuthEvent) => {
      if (event.type === 'logout') {
        clearSession(false);
      }

      if (event.type === 'login') {
        void refreshSession();
      }
    };

    const channel =
      typeof window !== 'undefined' && 'BroadcastChannel' in window
        ? new BroadcastChannel(AUTH_CHANNEL_NAME)
        : null;

    if (channel) {
      channel.addEventListener('message', (message) => {
        const payload = message.data as AuthEvent | undefined;
        if (payload?.type) {
          handleAuthEvent(payload);
        }
      });
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_EVENT_KEY || !event.newValue) {
        return;
      }

      try {
        const payload = JSON.parse(event.newValue) as AuthEvent;
        if (payload?.type) {
          handleAuthEvent(payload);
        }
      } catch {
        // Ignore malformed events.
      }
    };

    const handleInvalid = () => {
      clearSession(true);
      appToast.authUnauthorized();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('triage-auth-invalid', handleInvalid);

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('triage-auth-invalid', handleInvalid);
    };
  }, [clearSession, queryClient, refreshSession]);

  const signIn = useCallback((session: AuthResponse) => {
    setUser(session.user);
    broadcastAuthEvent({ type: 'login', ts: Date.now() });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // The session cookie might already be cleared.
    }

    clearSession(true);
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      user,
      isAuthenticated: Boolean(user),
      signIn,
      signOut,
    }),
    [isReady, signIn, signOut, user],
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
