import { IssueListResponse, IssueQuery, IssueSummary } from '@/types/issue';

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

export const fetchIssues = async (query: IssueQuery): Promise<IssueListResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/issues${buildQueryString(query)}`,
    { cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error('Failed to load issues.');
  }

  return response.json();
};

export const fetchSummary = async (): Promise<IssueSummary> => {
  const response = await fetch(`${API_BASE_URL}/issues/summary`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load summary.');
  }

  return response.json();
};
