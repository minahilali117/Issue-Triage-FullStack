import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import {
  NotificationActor,
  NotificationAttachmentContext,
  NotificationCommentContext,
  NotificationIssueContext,
  NotificationListItem,
  NotificationUserRef,
} from './notifications.types';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async list(recipientId: number, query: ListNotificationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.NotificationWhereInput = {
      recipientId,
      ...(query.unread === true ? { isRead: false } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: this.notificationSelect,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async unreadCount(recipientId: number) {
    return this.prisma.notification.count({
      where: { recipientId, isRead: false },
    });
  }

  async markRead(notificationId: number, recipientId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, recipientId },
      select: { id: true, isRead: true },
    });

    if (!notification) {
      return null;
    }

    if (!notification.isRead) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    }

    const unreadCount = await this.unreadCount(recipientId);
    this.realtimeGateway.emitNotificationUpdated(recipientId, {
      notificationId,
      unreadCount,
    });

    return { unreadCount };
  }

  async markAllRead(recipientId: number) {
    await this.prisma.notification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true },
    });

    this.realtimeGateway.emitNotificationUpdated(recipientId, {
      unreadCount: 0,
      markAll: true,
    });

    return { unreadCount: 0 };
  }

  async notifyIssueCreated(issue: NotificationIssueContext, actor: NotificationActor) {
    if (issue.assigneeId && issue.assigneeId !== actor.userId) {
      await this.createForRecipients({
        recipients: [issue.assignee],
        actor,
        issueId: issue.id,
        type: NotificationType.ISSUE_ASSIGNED,
        message: this.buildIssueAssignedMessage(issue, actor),
      });
    }
  }

  async notifyIssueUpdated(
    before: NotificationIssueContext,
    after: NotificationIssueContext,
    actor: NotificationActor,
  ) {
    const assigneeChanged = before.assigneeId !== after.assigneeId;
    const statusChanged = before.status !== after.status;
    const priorityChanged = before.priority !== after.priority;
    const titleChanged = before.title !== after.title;
    const descriptionChanged = before.description !== after.description;
    const categoryChanged = before.category !== after.category;
    const genericUpdate =
      titleChanged || descriptionChanged || categoryChanged || statusChanged || priorityChanged;
    const recipients = this.issueRecipients(before, after);

    if (assigneeChanged && after.assigneeId && after.assigneeId !== actor.userId) {
      await this.createForRecipients({
        recipients,
        actor,
        issueId: after.id,
        type: NotificationType.ISSUE_ASSIGNED,
        message: this.buildIssueAssignedMessage(after, actor),
      });
      return;
    }

    if (statusChanged && after.status === 'RESOLVED') {
      await this.createForRecipients({
        recipients,
        actor,
        issueId: after.id,
        type: NotificationType.ISSUE_RESOLVED,
        message: this.buildIssueResolvedMessage(after, actor),
      });
      return;
    }

    if (priorityChanged) {
      await this.createForRecipients({
        recipients,
        actor,
        issueId: after.id,
        type: NotificationType.PRIORITY_CHANGED,
        message: this.buildPriorityChangedMessage(after, actor),
      });
      return;
    }

    if (genericUpdate) {
      await this.createForRecipients({
        recipients,
        actor,
        issueId: after.id,
        type: NotificationType.ISSUE_UPDATED,
        message: this.buildIssueUpdatedMessage(after, actor),
      });
    }
  }

  async notifyIssueDeleted(issue: NotificationIssueContext, actor: NotificationActor) {
    await this.createForRecipients({
      recipients: this.issueRecipients(issue),
      actor,
      issueId: issue.id,
      type: NotificationType.ISSUE_DELETED,
      message: this.buildIssueDeletedMessage(issue, actor),
    });
  }

  async notifyAttachmentUploaded(
    issue: NotificationIssueContext,
    attachment: NotificationAttachmentContext,
    actor: NotificationActor,
  ) {
    await this.createForRecipients({
      recipients: this.issueRecipients(issue),
      actor,
      issueId: issue.id,
      type: NotificationType.ATTACHMENT_UPLOADED,
      message: this.buildAttachmentUploadedMessage(issue, attachment, actor),
    });
  }

  async notifyAttachmentDeleted(
    issue: NotificationIssueContext,
    attachment: NotificationAttachmentContext,
    actor: NotificationActor,
  ) {
    await this.createForRecipients({
      recipients: this.issueRecipients(issue),
      actor,
      issueId: issue.id,
      type: NotificationType.ATTACHMENT_DELETED,
      message: this.buildAttachmentDeletedMessage(issue, attachment, actor),
    });
  }

  async notifyCommentAdded(
    issue: NotificationIssueContext,
    actor: NotificationActor,
    options: { content: string; mentionIds?: number[] },
  ) {
    await this.createForRecipients({
      recipients: this.issueRecipients(issue),
      actor,
      issueId: issue.id,
      type: NotificationType.COMMENT_ADDED,
      message: this.buildCommentAddedMessage(issue, actor),
    });

    const mentionRecipients = await this.resolveMentionRecipients(options.content, options.mentionIds);
    if (mentionRecipients.length > 0) {
      await this.createForRecipients({
        recipients: mentionRecipients,
        actor,
        issueId: issue.id,
        type: NotificationType.COMMENT_MENTIONED,
        message: this.buildCommentMentionedMessage(issue, actor),
      });
    }
  }

  async notifyCommentUpdated(
    issue: NotificationIssueContext,
    actor: NotificationActor,
    options: { content: string; mentionIds?: number[] },
  ) {
    await this.createForRecipients({
      recipients: this.issueRecipients(issue),
      actor,
      issueId: issue.id,
      type: NotificationType.COMMENT_UPDATED,
      message: this.buildCommentUpdatedMessage(issue, actor),
    });

    const mentionRecipients = await this.resolveMentionRecipients(options.content, options.mentionIds);
    if (mentionRecipients.length > 0) {
      await this.createForRecipients({
        recipients: mentionRecipients,
        actor,
        issueId: issue.id,
        type: NotificationType.COMMENT_MENTIONED,
        message: this.buildCommentMentionedMessage(issue, actor),
      });
    }
  }

  async notifyCommentDeleted(
    issue: NotificationIssueContext,
    comment: NotificationCommentContext,
    actor: NotificationActor,
  ) {
    if (comment.author && comment.authorId !== actor.userId) {
      await this.createForRecipients({
        recipients: [comment.author],
        actor,
        issueId: issue.id,
        type: NotificationType.COMMENT_DELETED,
        message: this.buildCommentDeletedMessage(issue, actor, 'author'),
      });
    }

    const participantRecipients = this.issueRecipients(issue).filter(
      (recipient) => recipient?.id !== comment.authorId,
    );

    if (participantRecipients.length === 0) {
      return;
    }

    await this.createForRecipients({
      recipients: participantRecipients,
      actor,
      issueId: issue.id,
      type: NotificationType.COMMENT_DELETED,
      message: this.buildCommentDeletedMessage(issue, actor, 'participant'),
    });
  }

  private readonly notificationSelect = {
    id: true,
    recipientId: true,
    actorId: true,
    issueId: true,
    type: true,
    message: true,
    isRead: true,
    createdAt: true,
    actor: { select: { id: true, name: true, email: true } },
    issue: { select: { id: true, title: true } },
  } satisfies Prisma.NotificationSelect;

  private buildActorLabel(actor: NotificationActor) {
    return actor.name ?? actor.email;
  }

  private buildIssueLabel(issue: NotificationIssueContext) {
    return `Issue #${issue.id}`;
  }

  private buildIssueAssignedMessage(
    issue: NotificationIssueContext,
    actor: NotificationActor,
  ) {
    return `${this.buildActorLabel(actor)} assigned you ${this.buildIssueLabel(issue)}.`;
  }

  private buildIssueResolvedMessage(
    issue: NotificationIssueContext,
    actor: NotificationActor,
  ) {
    return `${this.buildActorLabel(actor)} resolved ${this.buildIssueLabel(issue)}.`;
  }

  private buildPriorityChangedMessage(
    issue: NotificationIssueContext,
    actor: NotificationActor,
  ) {
    return `${this.buildActorLabel(actor)} changed priority for ${this.buildIssueLabel(issue)}.`;
  }

  private buildIssueUpdatedMessage(
    issue: NotificationIssueContext,
    actor: NotificationActor,
  ) {
    return `${this.buildActorLabel(actor)} updated ${this.buildIssueLabel(issue)}.`;
  }

  private buildIssueDeletedMessage(
    issue: NotificationIssueContext,
    actor: NotificationActor,
  ) {
    return `${this.buildActorLabel(actor)} deleted ${this.buildIssueLabel(issue)}.`;
  }

  private buildAttachmentUploadedMessage(
    issue: NotificationIssueContext,
    attachment: NotificationAttachmentContext,
    actor: NotificationActor,
  ) {
    return `${this.buildActorLabel(actor)} uploaded ${attachment.fileName} to ${this.buildIssueLabel(issue)}.`;
  }

  private buildAttachmentDeletedMessage(
    issue: NotificationIssueContext,
    attachment: NotificationAttachmentContext,
    actor: NotificationActor,
  ) {
    return `${this.buildActorLabel(actor)} deleted ${attachment.fileName} from ${this.buildIssueLabel(issue)}.`;
  }

  private buildCommentAddedMessage(
    issue: NotificationIssueContext,
    actor: NotificationActor,
  ) {
    return `${this.buildActorLabel(actor)} commented on ${this.buildIssueLabel(issue)}.`;
  }

  private buildCommentUpdatedMessage(
    issue: NotificationIssueContext,
    actor: NotificationActor,
  ) {
    return `${this.buildActorLabel(actor)} updated a comment on ${this.buildIssueLabel(issue)}.`;
  }

  private buildCommentMentionedMessage(
    issue: NotificationIssueContext,
    actor: NotificationActor,
  ) {
    return `${this.buildActorLabel(actor)} mentioned you in a comment on ${this.buildIssueLabel(issue)}.`;
  }

  private buildCommentDeletedMessage(
    issue: NotificationIssueContext,
    actor: NotificationActor,
    audience: 'author' | 'participant',
  ) {
    return audience === 'author'
      ? `${this.buildActorLabel(actor)} deleted your comment on ${this.buildIssueLabel(issue)}.`
      : `${this.buildActorLabel(actor)} deleted a comment on ${this.buildIssueLabel(issue)}.`;
  }

  private async createForRecipients(params: {
    recipients: Array<NotificationUserRef | null | undefined>;
    actor: NotificationActor;
    issueId: number | null;
    type: NotificationType;
    message: string;
  }) {
    const recipientIds = Array.from(
      new Set(
        params.recipients
          .filter((recipient): recipient is NotificationUserRef => Boolean(recipient))
          .filter((recipient) => recipient.id !== params.actor.userId)
          .map((recipient) => recipient.id),
      ),
    );

    if (recipientIds.length === 0) {
      return [] as NotificationListItem[];
    }

    const created = (await Promise.all(
      recipientIds.map((recipientId) =>
        this.prisma.notification.create({
          data: {
            recipientId,
            actorId: params.actor.userId,
            issueId: params.issueId,
            type: params.type,
            message: params.message,
          },
          select: this.notificationSelect,
        }),
      ),
    )) as NotificationListItem[];

    await Promise.all(
      created.map(async (notification) => {
        const unreadCount = await this.unreadCount(notification.recipientId);
        this.realtimeGateway.emitNotificationCreated(notification.recipientId, {
          notification,
          unreadCount,
        });
      }),
    );

    return created;
  }

  private issueRecipients(
    ...issues: Array<Pick<NotificationIssueContext, 'createdBy' | 'assignee'>>
  ) {
    return issues.flatMap((issue) => [issue.createdBy, issue.assignee]);
  }

  private async resolveMentionRecipients(content: string, mentionIds?: number[]) {
    const resolvedIds = new Set<number>(mentionIds ?? []);
    const mentionTokens = Array.from(
      content.matchAll(/@([a-zA-Z0-9._-]+)/g),
      (match) => match[1].toLowerCase(),
    );

    if (mentionTokens.length === 0 && resolvedIds.size === 0) {
      return [] as NotificationUserRef[];
    }

    const users = await this.prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });

    for (const user of users) {
      const localPart = user.email.split('@')[0].toLowerCase();
      const normalizedName = (user.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (mentionTokens.includes(localPart) || mentionTokens.includes(normalizedName)) {
        resolvedIds.add(user.id);
      }
    }

    return users.filter((user) => resolvedIds.has(user.id));
  }
}