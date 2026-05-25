'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuth } from './auth-provider';
import { appToast } from '@/lib/toast';
import { apiBaseUrl } from '@/lib/api';
import type {
  NotificationCreatedPayload,
  NotificationItem,
  NotificationUpdatedPayload,
} from '@/types/notification';

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

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }

    const socket = io(apiBaseUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('issue.updated', () => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
      void queryClient.invalidateQueries({ queryKey: ['issue-summary'] });
      appToast.realtimeIssueUpdated();
    });

    socket.on('issue.assigned', () => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
      void queryClient.invalidateQueries({ queryKey: ['issue-summary'] });
      appToast.realtimeIssueAssigned();
    });

    socket.on('comment.added', (payload: { issueId?: number }) => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
      if (payload.issueId) {
        void queryClient.invalidateQueries({ queryKey: ['issue', payload.issueId] });
        void queryClient.invalidateQueries({ queryKey: ['comments', payload.issueId] });
      }
      appToast.realtimeCommentAdded();
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
      socket.disconnect();
    };
  }, [isAuthenticated, isReady, queryClient]);

  return children;
}
