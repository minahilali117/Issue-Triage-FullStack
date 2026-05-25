import { NotificationType, Role } from '@prisma/client';

export interface NotificationActor {
  userId: number;
  role: Role;
  email: string;
  name?: string | null;
}

export interface NotificationUserRef {
  id: number;
  name: string | null;
  email: string;
}

export interface NotificationIssueContext {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  priority: string;
  assigneeId: number | null;
  createdById: number;
  assignee: NotificationUserRef | null;
  createdBy: NotificationUserRef;
}

export interface NotificationCommentContext {
  id: number;
  content: string;
  authorId: number | null;
  author: NotificationUserRef | null;
}

export interface NotificationAttachmentContext {
  id: number;
  fileName: string;
  uploadedById: number | null;
  uploadedBy: NotificationUserRef | null;
}

export interface NotificationRecord {
  id: number;
  recipientId: number;
  actorId: number | null;
  issueId: number | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationListItem extends NotificationRecord {
  actor: NotificationUserRef | null;
  issue: { id: number; title: string } | null;
}