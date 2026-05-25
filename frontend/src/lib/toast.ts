import { toast } from 'sonner';
import type { Issue, IssueInput } from '@/types/issue';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

type ToastOptions = {
  dedupeKey?: string;
  duration?: number;
};

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 2500,
  error: 3500,
  warning: 3000,
  info: 2200,
};

const recentToastKeys = new Map<string, number>();
const DEDUPE_WINDOW_MS = 1500;

const canEmit = (dedupeKey: string) => {
  if (typeof window === 'undefined') {
    return true;
  }

  const now = Date.now();
  const lastSeen = recentToastKeys.get(dedupeKey) ?? 0;
  if (now - lastSeen < DEDUPE_WINDOW_MS) {
    return false;
  }

  recentToastKeys.set(dedupeKey, now);
  window.setTimeout(() => {
    if (recentToastKeys.get(dedupeKey) === now) {
      recentToastKeys.delete(dedupeKey);
    }
  }, DEDUPE_WINDOW_MS);

  return true;
};

const emit = (
  variant: ToastVariant,
  message: string,
  options?: ToastOptions,
) => {
  const dedupeKey = options?.dedupeKey;
  if (dedupeKey && !canEmit(dedupeKey)) {
    return;
  }

  toast[variant](message, {
    id: dedupeKey,
    duration: options?.duration ?? DEFAULT_DURATIONS[variant],
  });
};

const humanize = (value: string) =>
  value.replaceAll('_', ' ').toLowerCase().replace(/^./, (char) => char.toUpperCase());

export const appToast = {
  success: (message: string, options?: ToastOptions) => emit('success', message, options),
  error: (message: string, options?: ToastOptions) => emit('error', message, options),
  warning: (message: string, options?: ToastOptions) => emit('warning', message, options),
  info: (message: string, options?: ToastOptions) => emit('info', message, options),
  authLoginSuccess: () => emit('success', 'Signed in successfully.'),
  authSignupSuccess: () => emit('success', 'Account created successfully.'),
  authLogoutSuccess: () => emit('info', 'Logged out successfully.'),
  authLoginFailure: (message: string) => emit('error', message),
  authSignupFailure: (message: string) => emit('error', message),
  authUnauthorized: () =>
    emit('warning', 'Your session expired. Please sign in again.', {
      dedupeKey: 'auth:unauthorized',
    }),
  issueCreated: () => emit('success', 'Issue created.'),
  issueDeleted: () => emit('success', 'Issue deleted.'),
  issueUpdated: (message = 'Issue updated.') => emit('success', message),
  issueStatusChanged: (status: string) =>
    emit('info', `Status changed to ${humanize(status)}.`),
  issuePriorityChanged: (priority: string) =>
    emit('warning', `Priority changed to ${humanize(priority)}.`),
  issueAssignmentUpdated: () => emit('info', 'Assignment updated.'),
  commentAdded: () => emit('success', 'Comment added.'),
  commentUpdated: () => emit('success', 'Comment updated.'),
  commentDeleted: () => emit('success', 'Comment deleted.'),
  attachmentUploaded: () => emit('success', 'Attachment uploaded.'),
  attachmentUploadFailed: (message: string) => emit('error', message),
  attachmentDeleted: () => emit('success', 'Attachment deleted.'),
  attachmentDownloadFailed: (message: string) => emit('error', message),
  realtimeIssueUpdated: () =>
    emit('info', 'Issue updated in realtime.', { dedupeKey: 'realtime:issue-updated' }),
  realtimeIssueAssigned: () =>
    emit('info', 'Issue assignment changed.', { dedupeKey: 'realtime:issue-assigned' }),
  realtimeCommentAdded: () =>
    emit('info', 'New comment added.', { dedupeKey: 'realtime:comment-added' }),
};

export const describeIssueSaveToast = (
  currentIssue: Pick<Issue, 'status' | 'priority' | 'assigneeId'> | null,
  payload: IssueInput,
) => {
  if (!currentIssue) {
    return { variant: 'success' as const, message: 'Issue created.' };
  }

  const messages: string[] = [];
  let variant: ToastVariant = 'success';

  if (payload.status !== undefined && payload.status !== currentIssue.status) {
    messages.push(`Status changed to ${humanize(payload.status)}.`);
    variant = 'info';
  }

  if (payload.priority !== undefined && payload.priority !== currentIssue.priority) {
    messages.push(`Priority changed to ${humanize(payload.priority)}.`);
    variant = 'warning';
  }

  if (
    payload.assigneeId !== undefined &&
    payload.assigneeId !== currentIssue.assigneeId
  ) {
    messages.push(
      payload.assigneeId ? 'Assignment updated.' : 'Issue unassigned.',
    );
    variant = 'info';
  }

  if (messages.length === 0) {
    return { variant: 'success' as const, message: 'Issue updated.' };
  }

  return {
    variant,
    message: messages.join(' '),
  };
};