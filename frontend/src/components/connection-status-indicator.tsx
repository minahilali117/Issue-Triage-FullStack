'use client';

import { useConnectionStatus } from './realtime-provider';

const statusCopy = {
  online: {
    label: 'Connected',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200/80 dark:border-emerald-400/20',
    bg: 'bg-emerald-50/80 dark:bg-emerald-500/10',
  },
  offline: {
    label: 'Offline',
    dot: 'bg-amber-500',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200/80 dark:border-amber-400/20',
    bg: 'bg-amber-50/80 dark:bg-amber-500/10',
  },
  disconnected: {
    label: 'Disconnected',
    dot: 'bg-rose-500',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-200/80 dark:border-rose-400/20',
    bg: 'bg-rose-50/80 dark:bg-rose-500/10',
  },
  reconnecting: {
    label: 'Reconnecting',
    dot: 'bg-sky-500 animate-pulse',
    text: 'text-sky-800 dark:text-sky-300',
    border: 'border-sky-200/80 dark:border-sky-400/20',
    bg: 'bg-sky-50/80 dark:bg-sky-500/10',
  },
} as const;

export default function ConnectionStatusIndicator() {
  const { displayStatus } = useConnectionStatus();
  const styles = statusCopy[displayStatus];

  if (displayStatus === 'online') {
    return (
      <span
        className={`hidden items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:inline-flex ${styles.border} ${styles.bg} ${styles.text}`}
        aria-label="Realtime connection active"
        title="Realtime connection active"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
        Live
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles.border} ${styles.bg} ${styles.text}`}
      role="status"
      aria-live="polite"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {styles.label}
    </span>
  );
}
