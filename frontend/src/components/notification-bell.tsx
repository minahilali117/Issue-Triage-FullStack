'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './auth-provider';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api';
import { Button, Skeleton } from './ui';
import type { NotificationItem } from '@/types/notification';

const formatRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export default function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const unreadCountQuery = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: fetchUnreadNotificationCount,
    enabled: isAuthenticated,
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications', { page: 1, limit: 10 }],
    queryFn: () => fetchNotifications({ page: 1, limit: 10 }),
    enabled: isAuthenticated,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: number) => markNotificationRead(notificationId),
    onSuccess: (data, notificationId) => {
      queryClient.setQueryData(['notification-unread-count'], data.unreadCount);
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (current: { data?: NotificationItem[] } | undefined) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            data: current.data?.map((notification) =>
              notification.id === notificationId
                ? { ...notification, isRead: true }
                : notification,
            ),
          };
        },
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-unread-count'], data.unreadCount);
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (current: { data?: NotificationItem[] } | undefined) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            data: current.data?.map((notification) => ({
              ...notification,
              isRead: true,
            })),
          };
        },
      );
    },
  });

  const notifications = notificationsQuery.data?.data;
  const unreadCount = unreadCountQuery.data ?? 0;

  const sortedNotifications = useMemo(
    () => [...(notifications ?? [])].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [notifications],
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id="notification-trigger"
          type="button"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0.85, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-lg shadow-rose-500/20"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          ) : null}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={12}
          align="end"
          className="z-50 w-[min(92vw,24rem)] outline-none"
        >
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between gap-3 pb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Notifications</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Recent activity for your account</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={unreadCount === 0 || markAllReadMutation.isPending}
                >
                  Mark all read
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto pr-1">
                {notificationsQuery.isLoading || unreadCountQuery.isLoading ? (
                  <div className="grid gap-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="mt-2 h-3 w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : sortedNotifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {sortedNotifications.map((notification) => (
                      <motion.button
                        layout
                        key={notification.id}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 ${
                          notification.isRead
                            ? 'border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                            : 'border-slate-300 bg-slate-50 text-slate-950 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white'
                        }`}
                        onClick={async () => {
                          if (!notification.isRead) {
                            await markReadMutation.mutateAsync(notification.id);
                          }
                          setOpen(false);
                          if (notification.issueId) {
                            router.push(`/?issueId=${notification.issueId}`);
                          }
                        }}
                      >
                        <p className="text-sm font-medium leading-5">{notification.message}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(notification.createdAt)}</p>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
