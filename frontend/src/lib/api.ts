import type { AuthResponse } from '@/types/auth';
import {
  IssueInput,
  IssueListResponse,
  IssueQuery,
  IssueSummary,
  IssueUpdateInput,
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
