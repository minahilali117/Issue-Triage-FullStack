"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Bell,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ListFilter,
  Menu,
  Settings2,
  UserRound,
  X,
} from 'lucide-react';
import { fetchRecentActivity } from '@/lib/api';
import type { ActivityLog } from '@/types/issue';
import NotificationBell from './notification-bell';
import ConnectionStatusIndicator from './connection-status-indicator';
import SectionEmptyState from './section-empty-state';
import { Skeleton } from './ui';

type AppShellProps = {
  children: ReactNode;
};

type NavAction = {
  label: string;
  description: string;
  icon: React.ReactNode;
  active?: boolean;
  href?: string;
  onSelect: () => void;
};

const updateQueryString = (
  pathname: string,
  searchParams: URLSearchParams,
  patch: Record<string, string | null | undefined>,
) => {
  const params = new URLSearchParams(searchParams.toString());

  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null || value === '') {
      params.delete(key);
      return;
    }
    params.set(key, value);
  });

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
};

const SIDEBAR_COLLAPSED_KEY = 'triage_sidebar_collapsed';
const SIDEBAR_COLLAPSED_EVENT = 'triage-sidebar-collapsed-change';

const readSidebarCollapsed = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
};

const sidebarCollapsedListeners = new Set<() => void>();

const notifySidebarCollapsedListeners = () => {
  sidebarCollapsedListeners.forEach((listener) => listener());
};

const setSidebarCollapsedPreference = (value: boolean) => {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
  } catch {
    // Ignore storage failures.
  }

  window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_EVENT));
  notifySidebarCollapsedListeners();
};

const subscribeSidebarCollapsed = (listener: () => void) => {
  sidebarCollapsedListeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_COLLAPSED_KEY) {
      listener();
    }
  };

  const handleCustomEvent = () => {
    listener();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(SIDEBAR_COLLAPSED_EVENT, handleCustomEvent);

  return () => {
    sidebarCollapsedListeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(SIDEBAR_COLLAPSED_EVENT, handleCustomEvent);
  };
};

export default function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sidebarCollapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    readSidebarCollapsed,
    () => false,
  );

  const recentActivityQuery = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => fetchRecentActivity(6),
    enabled: activityOpen,
    staleTime: 30_000,
  });

  useEffect(() => {
    setSidebarCollapsedPreference(sidebarCollapsed);
  }, [sidebarCollapsed]);

  const navActions = useMemo<NavAction[]>(() => [
    {
      label: 'Dashboard',
      description: 'Reset to the overview state',
      icon: <LayoutDashboard className="h-4 w-4" />,
      active: pathname === '/',
      onSelect: () => {
        router.push('/');
        setMobileOpen(false);
      },
    },
    {
      label: 'Issues',
      description: 'Focus the current issue queue',
      icon: <ListFilter className="h-4 w-4" />,
      active: pathname === '/' && searchParams.size === 0,
      onSelect: () => {
        const target = document.getElementById('issues') ?? document.documentElement;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setMobileOpen(false);
      },
    },
    {
      label: 'My issues',
      description: 'Filter to your assigned issues',
      icon: <UserRound className="h-4 w-4" />,
      onSelect: () => {
        router.replace(updateQueryString(pathname, new URLSearchParams(searchParams.toString()), { my: 'true', unassigned: null, page: '1' }));
        setMobileOpen(false);
      },
    },
    {
      label: 'Notifications',
      description: 'Open the realtime notification tray',
      icon: <Bell className="h-4 w-4" />,
      onSelect: () => {
        document.getElementById('notification-trigger')?.click();
        setMobileOpen(false);
      },
    },
    {
      label: 'Activity',
      description: 'Open the compact activity log',
      icon: <Activity className="h-4 w-4" />,
      onSelect: () => {
        setActivityOpen(true);
        setMobileOpen(false);
      },
    },
    {
      label: 'Settings',
      description: 'Manage your account and team roles',
      icon: <Settings2 className="h-4 w-4" />,
      active: pathname.startsWith('/settings'),
      onSelect: () => {
        router.push('/settings');
        setMobileOpen(false);
      },
    },
  ], [pathname, router, searchParams]);

  const formatActivityTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));

  const describeActivity = (activity: ActivityLog) => {
    if (activity.message) {
      return activity.message;
    }

    switch (activity.type) {
      case 'ISSUE_CREATED':
        return 'created an issue';
      case 'STATUS_CHANGED':
        return `changed status to ${activity.newValue ?? 'unknown'}`;
      case 'PRIORITY_CHANGED':
        return `changed priority to ${activity.newValue ?? 'unknown'}`;
      case 'ASSIGNEE_CHANGED':
        return `changed assignee to ${activity.newValue ?? 'Unassigned'}`;
      case 'COMMENT_ADDED':
        return 'added a comment';
      case 'COMMENT_DELETED':
        return 'deleted a comment';
      default:
        return 'updated activity';
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <Dialog.Root open={activityOpen} onOpenChange={setActivityOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-60 bg-slate-950/45 backdrop-blur-[2px]" />
          <Dialog.Content asChild>
            <motion.aside
              className="fixed right-0 top-0 z-61 flex h-full w-[min(92vw,24rem)] flex-col border-l border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-slate-950"
              initial={{ x: 24 }}
              animate={{ x: 0 }}
              exit={{ x: 24 }}
              transition={{ duration: 0.18 }}
            >
              <Dialog.Title className="sr-only">Recent activity log</Dialog.Title>
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">Activity log</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">Recent activity</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Compact workspace changes</p>
                </div>
                <Dialog.Close asChild>
                  <button type="button" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Close activity log">
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="grid gap-3">
                  {recentActivityQuery.isLoading ? (
                    <div className="grid gap-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                          <Skeleton className="h-4 w-4/5" />
                          <Skeleton className="mt-2 h-3 w-1/3" />
                        </div>
                      ))}
                    </div>
                  ) : (recentActivityQuery.data?.length ?? 0) === 0 ? (
                    <SectionEmptyState
                      compact
                      title="No activity yet"
                      description="Workspace changes will appear here as issues are created and updated."
                    />
                  ) : (
                    recentActivityQuery.data?.map((activity) => (
                      <div key={activity.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-950 dark:text-white">
                                  {activity.user?.name ?? activity.user?.email ?? 'Someone'} {describeActivity(activity)}
                                </p>
                                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                  {activity.issue ? `${activity.issue.title}` : 'Workspace activity'}
                                </p>
                              </div>
                              <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                {formatActivityTime(activity.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.aside>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="mx-auto grid min-h-screen w-full max-w-400 grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 92 : 288 }}
          className="sticky top-0 hidden h-screen overflow-hidden border-r border-slate-200/80 bg-white/72 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 lg:block"
        >
          <div className="flex h-full flex-col gap-6 px-4 py-5">
            {!sidebarCollapsed ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">Issue triage</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Control center</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Fast access to issues, assignments, and live notifications.</p>
                </div>
              </div>
            ) : null}

            <nav className="grid gap-2">
              {navActions.map((item, index) => (
                <motion.button
                  key={item.label}
                  type="button"
                  onClick={item.onSelect}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                  className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition ${
                    item.active
                      ? 'border-slate-200 bg-white text-slate-950 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white'
                      : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/5'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <span className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition group-hover:border-slate-300 group-hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                    {item.icon}
                  </span>
                  {!sidebarCollapsed ? (
                    <span className="flex-1">
                      <span className="block font-medium">{item.label}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{item.description}</span>
                    </span>
                  ) : null}
                  {!sidebarCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                  ) : null}
                </motion.button>
              ))}
            </nav>

            {!sidebarCollapsed ? (
              <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                
                <p className="mt-2 leading-6">Keyboard-first navigation, realtime updates, and compact controls for triage speed.</p>
              </div>
            ) : null}
          </div>
        </motion.aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
                  <Dialog.Trigger asChild>
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 lg:hidden" aria-label="Open navigation">
                      <Menu className="h-5 w-5" />
                    </button>
                  </Dialog.Trigger>
                  <AnimatePresence>
                    {mobileOpen ? (
                      <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                          <motion.div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                        </Dialog.Overlay>
                        <Dialog.Content asChild>
                          <motion.aside
                            className="fixed inset-y-0 left-0 z-50 w-[min(88vw,20rem)] border-r border-slate-200 bg-white p-5 shadow-[20px_0_80px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-slate-950"
                            initial={{ x: -24 }}
                            animate={{ x: 0 }}
                            exit={{ x: -24 }}
                            transition={{ duration: 0.18 }}
                          >
                            <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">Issue triage</p>
                                <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">Navigation</h2>
                              </div>
                              <Dialog.Close asChild>
                                <button type="button" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Close navigation">
                                  <X className="h-4 w-4" />
                                </button>
                              </Dialog.Close>
                            </div>
                            <div className="mt-5 grid gap-2">
                              {navActions.map((item) => (
                                <button key={item.label} type="button" onClick={item.onSelect} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
                                  <span className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">{item.icon}</span>
                                  <span>
                                    <span className="block font-medium">{item.label}</span>
                                    <span className="block text-xs text-slate-500 dark:text-slate-400">{item.description}</span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </motion.aside>
                        </Dialog.Content>
                      </Dialog.Portal>
                    ) : null}
                  </AnimatePresence>
                </Dialog.Root>

                <button
                  type="button"
                  onClick={() => setSidebarCollapsedPreference(!sidebarCollapsed)}
                  className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 lg:inline-flex"
                  aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                </button>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Internal tool</p>
                  <h1 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white sm:text-xl">Issue Triage Dashboard</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ConnectionStatusIndicator />
                <NotificationBell />
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}