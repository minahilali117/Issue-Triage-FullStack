'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './auth-provider';
import { appToast } from '@/lib/toast';
import { apiBaseUrl } from '@/lib/api';
import type {
  NotificationCreatedPayload,
  NotificationItem,
  NotificationUpdatedPayload,
} from '@/types/notification';

export type SocketConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
export type NetworkStatus = 'online' | 'offline';
export type ConnectionDisplayStatus =
  | 'online'
  | 'offline'
  | 'disconnected'
  | 'reconnecting';

type ConnectionContextValue = {
  socketStatus: SocketConnectionStatus;
  networkStatus: NetworkStatus;
  displayStatus: ConnectionDisplayStatus;
};

const ConnectionContext = createContext<ConnectionContextValue | undefined>(
  undefined,
);

type NotificationListCache = {
  data: NotificationItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

const updateNotificationListCache = (
  current: NotificationListCache | undefined,
  updater: (items: NotificationItem[]) => NotificationItem[],
): NotificationListCache | undefined => {
  if (!current) {
    return current;
  }

  return {
    ...current,
    data: updater(current.data),
  };
};

export function useConnectionStatus() {
  const context = useContext(ConnectionContext);

  if (!context) {
    throw new Error('useConnectionStatus must be used within RealtimeProvider');
  }

  return context;
}

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isReady } = useAuth();
  const queryClient = useQueryClient();
  const [socketStatus, setSocketStatus] = useState<SocketConnectionStatus>('disconnected');
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const hadSocketConnectionRef = useRef(false);
  const hadNetworkConnectionRef = useRef(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncNetworkStatus = () => {
      const isOnline = navigator.onLine;
      setNetworkStatus(isOnline ? 'online' : 'offline');

      if (!isOnline && hadNetworkConnectionRef.current) {
        appToast.networkOffline();
      }

      if (isOnline && !hadNetworkConnectionRef.current) {
        appToast.networkOnline();
      }

      hadNetworkConnectionRef.current = isOnline;
    };

    syncNetworkStatus();
    window.addEventListener('online', syncNetworkStatus);
    window.addEventListener('offline', syncNetworkStatus);

    return () => {
      window.removeEventListener('online', syncNetworkStatus);
      window.removeEventListener('offline', syncNetworkStatus);
    };
  }, []);

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      setSocketStatus('disconnected');
      return;
    }

    let socket: Socket | null = null;

    socket = io(apiBaseUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
    });

    socket.on('connect', () => {
      const isReconnect = hadSocketConnectionRef.current;
      hadSocketConnectionRef.current = true;
      setSocketStatus('connected');
      if (isReconnect) {
        appToast.realtimeRestored();
      }
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
      if (hadSocketConnectionRef.current) {
        appToast.realtimeDisconnected();
      }
    });

    socket.io.on('reconnect_attempt', () => {
      setSocketStatus('reconnecting');
    });

    socket.io.on('reconnect_failed', () => {
      setSocketStatus('disconnected');
    });

    socket.on('issue.updated', (payload: { actorId?: number | null }) => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
      void queryClient.invalidateQueries({ queryKey: ['issue-summary'] });
      if (payload.actorId !== user?.id) {
        appToast.realtimeIssueUpdated();
      }
    });

    socket.on('issue.assigned', (payload: { actorId?: number | null }) => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
      void queryClient.invalidateQueries({ queryKey: ['issue-summary'] });
      if (payload.actorId !== user?.id) {
        appToast.realtimeIssueAssigned();
      }
    });

    socket.on('comment.added', (payload: { issueId?: number; actorId?: number | null }) => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
      if (payload.issueId) {
        void queryClient.invalidateQueries({ queryKey: ['issue', payload.issueId] });
        void queryClient.invalidateQueries({ queryKey: ['comments', payload.issueId] });
      }
      if (payload.actorId !== user?.id) {
        appToast.realtimeCommentAdded();
      }
    });

    socket.on('notification.created', (payload: NotificationCreatedPayload) => {
      queryClient.setQueryData(['notification-unread-count'], payload.unreadCount);
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (current: NotificationListCache | undefined) => {
          if (!current) {
            return current;
          }

          const nextData = [payload.notification, ...current.data].slice(0, current.meta.limit);
          return {
            ...current,
            data: nextData,
            meta: {
              ...current.meta,
              total: current.meta.total + 1,
              totalPages: Math.max(1, Math.ceil((current.meta.total + 1) / current.meta.limit)),
            },
          };
        },
      );
      appToast.notificationReceived(payload.notification);
    });

    socket.on('notification.updated', (payload: NotificationUpdatedPayload) => {
      queryClient.setQueryData(['notification-unread-count'], payload.unreadCount);
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (current: NotificationListCache | undefined) =>
          updateNotificationListCache(current, (items) =>
            items.map((notification) =>
              payload.markAll || notification.id === payload.notificationId
                ? { ...notification, isRead: true }
                : notification,
            ),
          ),
      );
    });

    return () => {
      socket?.disconnect();
      setSocketStatus('disconnected');
    };
  }, [isAuthenticated, isReady, queryClient, user?.id]);

  const displayStatus = useMemo<ConnectionDisplayStatus>(() => {
    if (networkStatus === 'offline') {
      return 'offline';
    }

    if (socketStatus === 'reconnecting') {
      return 'reconnecting';
    }

    if (socketStatus === 'connected') {
      return 'online';
    }

    return 'disconnected';
  }, [networkStatus, socketStatus]);

  const value = useMemo(
    () => ({
      socketStatus,
      networkStatus,
      displayStatus,
    }),
    [displayStatus, networkStatus, socketStatus],
  );

  return (
    <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>
  );
}
