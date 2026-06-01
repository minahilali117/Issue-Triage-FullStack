import type { AuthResponse } from '@/types/auth';
import {
  ActivityLog,
  Attachment,
  Comment,
  Issue,
  IssueInput,
  IssueListResponse,
  IssueQuery,
  IssueSummary,
  IssueUpdateInput,
  IssueUser,
  UserRole,
} from '@/types/issue';
import type {
  NotificationListResponse,
  NotificationQuery,
} from '@/types/notification';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const buildQueryString = (query: IssueQuery) => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const buildNotificationQueryString = (query?: NotificationQuery) => {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();
  if (query.unread !== undefined) params.set('unread', String(query.unread));
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.limit !== undefined) params.set('limit', String(query.limit));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const buildHeaders = (extraHeaders?: HeadersInit) => {
  return {
    ...(extraHeaders ?? {}),
  };
};

const buildRequest = (options: RequestInit = {}): RequestInit => ({
  ...options,
  headers: buildHeaders(options.headers),
  credentials: 'include',
});

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const emitAuthInvalid = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('triage-auth-invalid'));
  }
};

const readErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };
    if (Array.isArray(data.message)) return data.message.join(' ');
    return data.message ?? data.error ?? fallback;
  } catch {
    return fallback;
  }
};

const ensureOk = async (response: Response, fallback: string) => {
  if (!response.ok) {
    if (response.status === 401) {
      emitAuthInvalid();
    }
    throw new ApiError(await readErrorMessage(response, fallback), response.status);
  }
};

export const login = async (payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    buildRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );

  await ensureOk(response, 'Failed to log in.');

  return response.json();
};

export const signup = async (payload: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/auth/signup`,
    buildRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );

  await ensureOk(response, 'Failed to sign up.');

  return response.json();
};

export const logout = async (): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/auth/logout`,
    buildRequest({ method: 'POST' }),
  );

  await ensureOk(response, 'Failed to log out.');
};

export const fetchCurrentUser = async (): Promise<AuthResponse['user']> => {
  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    buildRequest({
      cache: 'no-store',
    }),
  );

  await ensureOk(response, 'Failed to load current user.');

  return response.json();
};

export const updateMyProfile = async (payload: {
  name?: string | null;
}): Promise<AuthResponse['user']> => {
  const response = await fetch(
    `${API_BASE_URL}/users/me/profile`,
    buildRequest({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );

  await ensureOk(response, 'Failed to update profile.');

  return response.json();
};

export const changeMyPassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean }> => {
  const response = await fetch(
    `${API_BASE_URL}/users/me/password`,
    buildRequest({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );

  await ensureOk(response, 'Failed to change password.');

  return response.json();
};

export const updateUserRole = async (
  userId: number,
  role: UserRole,
): Promise<IssueUser> => {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}/role`,
    buildRequest({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }),
  );

  await ensureOk(response, 'Failed to update user role.');

  return response.json();
};

export const fetchIssues = async (query: IssueQuery): Promise<IssueListResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/issues${buildQueryString(query)}`,
    buildRequest({ cache: 'no-store' }),
  );

  await ensureOk(response, 'Failed to load issues.');

  return response.json();
};

export const fetchIssue = async (id: number): Promise<Issue> => {
  const response = await fetch(
    `${API_BASE_URL}/issues/${id}`,
    buildRequest({ cache: 'no-store' }),
  );

  await ensureOk(response, 'Failed to load issue.');

  return response.json();
};

export const fetchSummary = async (): Promise<IssueSummary> => {
  const response = await fetch(
    `${API_BASE_URL}/issues/summary`,
    buildRequest({ cache: 'no-store' }),
  );

  await ensureOk(response, 'Failed to load summary.');

  return response.json();
};

export const fetchRecentActivity = async (limit = 8): Promise<ActivityLog[]> => {
  const response = await fetch(
    `${API_BASE_URL}/activity-log/recent?limit=${limit}`,
    buildRequest({ cache: 'no-store' }),
  );

  await ensureOk(response, 'Failed to load recent activity.');

  return response.json();
};

export const createIssue = async (payload: IssueInput) => {
  const response = await fetch(
    `${API_BASE_URL}/issues`,
    buildRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );

  await ensureOk(response, 'Failed to create issue.');

  return response.json();
};

export const updateIssue = async (id: number, payload: IssueUpdateInput) => {
  const response = await fetch(
    `${API_BASE_URL}/issues/${id}`,
    buildRequest({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );

  await ensureOk(response, 'Failed to update issue.');

  return response.json();
};

export const deleteIssue = async (id: number) => {
  const response = await fetch(
    `${API_BASE_URL}/issues/${id}`,
    buildRequest({ method: 'DELETE' }),
  );

  await ensureOk(response, 'Failed to delete issue.');
};

export const fetchUsers = async (): Promise<IssueUser[]> => {
  const response = await fetch(
    `${API_BASE_URL}/users`,
    buildRequest({ cache: 'no-store' }),
  );

  await ensureOk(response, 'Failed to load users.');

  return response.json();
};

export const fetchComments = async (issueId: number): Promise<Comment[]> => {
  const response = await fetch(
    `${API_BASE_URL}/issues/${issueId}/comments`,
    buildRequest({ cache: 'no-store' }),
  );

  await ensureOk(response, 'Failed to load comments.');

  return response.json();
};

export const createComment = async (
  issueId: number,
  payload: { content: string; mentionIds?: number[] },
) => {
  const response = await fetch(
    `${API_BASE_URL}/issues/${issueId}/comments`,
    buildRequest({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );

  await ensureOk(response, 'Failed to add comment.');

  return response.json();
};

export const updateComment = async (
  issueId: number,
  commentId: number,
  payload: { content: string; mentionIds?: number[] },
) => {
  const response = await fetch(
    `${API_BASE_URL}/issues/${issueId}/comments/${commentId}`,
    buildRequest({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );

  await ensureOk(response, 'Failed to update comment.');

  return response.json();
};

export const deleteComment = async (issueId: number, commentId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/issues/${issueId}/comments/${commentId}`,
    buildRequest({ method: 'DELETE' }),
  );

  await ensureOk(response, 'Failed to delete comment.');
};

export const fetchAttachments = async (issueId: number): Promise<Attachment[]> => {
  const response = await fetch(
    `${API_BASE_URL}/issues/${issueId}/attachments`,
    buildRequest({ cache: 'no-store' }),
  );

  await ensureOk(response, 'Failed to load attachments.');

  return response.json();
};

export const uploadAttachment = async (issueId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/issues/${issueId}/attachments`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  await ensureOk(response, 'Failed to upload attachment.');

  return response.json();
};

export const downloadAttachment = async (
  issueId: number,
  attachmentId: number,
  fileName: string,
) => {
  const response = await fetch(
    `${API_BASE_URL}/issues/${issueId}/attachments/${attachmentId}/download`,
    buildRequest(),
  );

  await ensureOk(response, 'Failed to download attachment.');

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const deleteAttachment = async (issueId: number, attachmentId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/issues/${issueId}/attachments/${attachmentId}`,
    buildRequest({ method: 'DELETE' }),
  );

  await ensureOk(response, 'Failed to delete attachment.');
};

export const fetchNotifications = async (
  query?: NotificationQuery,
): Promise<NotificationListResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/notifications${buildNotificationQueryString(query)}`,
    buildRequest({ cache: 'no-store' }),
  );

  await ensureOk(response, 'Failed to load notifications.');

  return response.json();
};

export const fetchUnreadNotificationCount = async (): Promise<number> => {
  const response = await fetch(
    `${API_BASE_URL}/notifications/unread-count`,
    buildRequest({ cache: 'no-store' }),
  );

  await ensureOk(response, 'Failed to load notification count.');

  return response.json();
};

export const markNotificationRead = async (notificationId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    buildRequest({ method: 'PATCH' }),
  );

  await ensureOk(response, 'Failed to mark notification as read.');

  return response.json() as Promise<{ unreadCount: number }>;
};

export const markAllNotificationsRead = async () => {
  const response = await fetch(
    `${API_BASE_URL}/notifications/read-all`,
    buildRequest({ method: 'PATCH' }),
  );

  await ensureOk(response, 'Failed to mark all notifications as read.');

  return response.json() as Promise<{ unreadCount: number }>;
};

export const apiBaseUrl = API_BASE_URL;
