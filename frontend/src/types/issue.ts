export enum IssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export type IssueSortBy = 'createdAt' | 'updatedAt' | 'priority';
export type SortOrder = 'asc' | 'desc';

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  category: string;
  assignee?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssueSummary {
  total: number;
  open: number;
  critical: number;
  resolved: number;
}

export interface IssueListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IssueListResponse {
  data: Issue[];
  meta: IssueListMeta;
}

export interface IssueQuery {
  search?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  category?: string;
  assignee?: string;
  page?: number;
  limit?: number;
  sortBy?: IssueSortBy;
  sortOrder?: SortOrder;
}
