export type NotificationType =
  | 'ISSUE_ASSIGNED'
  | 'COMMENT_ADDED'
  | 'COMMENT_MENTIONED'
  | 'COMMENT_UPDATED'
  | 'PRIORITY_CHANGED'
  | 'ISSUE_RESOLVED'
  | 'COMMENT_DELETED'
  | 'ISSUE_UPDATED'
  | 'ISSUE_DELETED'
  | 'ATTACHMENT_UPLOADED'
  | 'ATTACHMENT_DELETED';

export interface NotificationIssueRef {
  id: number;
  title: string;
}

export interface NotificationUserRef {
  id: number;
  name: string | null;
  email: string;
}

export interface NotificationItem {
  id: number;
  recipientId: number;
  actorId: number | null;
  issueId: number | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  actor: NotificationUserRef | null;
  issue: NotificationIssueRef | null;
}

export interface NotificationListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  meta: NotificationListMeta;
}

export interface NotificationQuery {
  unread?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationCreatedPayload {
  notification: NotificationItem;
  unreadCount: number;
}

export interface NotificationUpdatedPayload {
  notificationId?: number;
  unreadCount: number;
  markAll?: boolean;
}