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

export type UserRole = 'ADMIN' | 'DEVELOPER' | 'VIEWER';

export interface IssueUser {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
}

export interface Comment {
  id: number;
  content: string;
  issueId: number;
  authorId: number | null;
  author: IssueUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: number;
  type:
    | 'ISSUE_CREATED'
    | 'STATUS_CHANGED'
    | 'PRIORITY_CHANGED'
    | 'ASSIGNEE_CHANGED'
    | 'COMMENT_ADDED'
    | 'COMMENT_DELETED';
  message: string | null;
  oldValue: string | null;
  newValue: string | null;
  user: IssueUser | null;
  createdAt: string;
}

export interface Attachment {
  id: number;
  fileName: string;
  filePath: string;
  uploadedBy: IssueUser | null;
  createdAt: string;
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  category: string;
  assigneeId: number | null;
  assignee: IssueUser | null;
  createdById: number;
  createdBy: IssueUser;
  comments?: Comment[];
  activityLog?: ActivityLog[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface IssueInput {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  category: string;
  assigneeId?: number | null;
}

export type IssueUpdateInput = Partial<IssueInput>;

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
  assigneeId?: number | null;
  my?: boolean;
  unassigned?: boolean;
  page?: number;
  limit?: number;
  sortBy?: IssueSortBy;
  sortOrder?: SortOrder;
}
