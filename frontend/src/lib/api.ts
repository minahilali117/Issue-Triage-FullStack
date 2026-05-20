import type { AuthResponse } from '@/types/auth';
import {
  Attachment,
  Comment,
  Issue,
  IssueInput,
  IssueListResponse,
  IssueQuery,
  IssueSummary,
  IssueUpdateInput,
  IssueUser,
} from '@/types/issue';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
const AUTH_STORAGE_KEY = 'triage_dashboard_auth';

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

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as AuthResponse;
    return session.accessToken;
  } catch {
    return null;
  }
};

const buildHeaders = (extraHeaders?: HeadersInit) => {
  const token = getStoredToken();
  return {
    ...(extraHeaders ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const login = async (payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to log in.');
  }

  return response.json();
};

export const signup = async (payload: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to sign up.');
  }

  return response.json();
};

export const fetchIssues = async (query: IssueQuery): Promise<IssueListResponse> => {
  const response = await fetch(`${API_BASE_URL}/issues${buildQueryString(query)}`, {
    cache: 'no-store',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load issues.');
  }

  return response.json();
};

export const fetchIssue = async (id: number): Promise<Issue> => {
  const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
    cache: 'no-store',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load issue.');
  }

  return response.json();
};

export const fetchSummary = async (): Promise<IssueSummary> => {
  const response = await fetch(`${API_BASE_URL}/issues/summary`, {
    cache: 'no-store',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load summary.');
  }

  return response.json();
};

export const createIssue = async (payload: IssueInput) => {
  const response = await fetch(`${API_BASE_URL}/issues`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to create issue.');
  }

  return response.json();
};

export const updateIssue = async (id: number, payload: IssueUpdateInput) => {
  const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
    method: 'PATCH',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to update issue.');
  }

  return response.json();
};

export const deleteIssue = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete issue.');
  }
};

export const fetchUsers = async (): Promise<IssueUser[]> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    cache: 'no-store',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load users.');
  }

  return response.json();
};

export const fetchComments = async (issueId: number): Promise<Comment[]> => {
  const response = await fetch(`${API_BASE_URL}/issues/${issueId}/comments`, {
    cache: 'no-store',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load comments.');
  }

  return response.json();
};

export const createComment = async (issueId: number, content: string) => {
  const response = await fetch(`${API_BASE_URL}/issues/${issueId}/comments`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error('Failed to add comment.');
  }

  return response.json();
};

export const updateComment = async (
  issueId: number,
  commentId: number,
  content: string,
) => {
  const response = await fetch(
    `${API_BASE_URL}/issues/${issueId}/comments/${commentId}`,
    {
      method: 'PATCH',
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ content }),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to update comment.');
  }

  return response.json();
};

export const deleteComment = async (issueId: number, commentId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/issues/${issueId}/comments/${commentId}`,
    {
      method: 'DELETE',
      headers: buildHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to delete comment.');
  }
};

export const fetchAttachments = async (issueId: number): Promise<Attachment[]> => {
  const response = await fetch(`${API_BASE_URL}/issues/${issueId}/attachments`, {
    cache: 'no-store',
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load attachments.');
  }

  return response.json();
};

export const uploadAttachment = async (issueId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/issues/${issueId}/attachments`, {
    method: 'POST',
    headers: buildHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload attachment.');
  }

  return response.json();
};

export const attachmentDownloadUrl = (issueId: number, attachmentId: number) =>
  `${API_BASE_URL}/issues/${issueId}/attachments/${attachmentId}/download`;

export const apiBaseUrl = API_BASE_URL;
