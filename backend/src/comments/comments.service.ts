import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, Role } from '@prisma/client';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

interface CommentActor {
  userId: number;
  role: Role;
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async list(issueId: number) {
    await this.ensureIssue(issueId);

    return this.prisma.comment.findMany({
      where: { issueId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async create(issueId: number, dto: CreateCommentDto, actor: CommentActor) {
    await this.ensureIssue(issueId);

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content.trim(),
        issueId,
        authorId: actor.userId,
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await this.activityLogService.log({
      issueId,
      userId: actor.userId,
      type: ActivityType.COMMENT_ADDED,
      message: 'Comment added',
    });

    this.realtimeGateway.emitCommentAdded({ issueId, comment });

    return comment;
  }

  async update(
    issueId: number,
    commentId: number,
    dto: UpdateCommentDto,
    actor: CommentActor,
  ) {
    const comment = await this.getCommentForIssue(issueId, commentId);

    if (comment.authorId !== actor.userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content.trim() },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async remove(issueId: number, commentId: number, actor: CommentActor) {
    const comment = await this.getCommentForIssue(issueId, commentId);

    const isAdmin = actor.role === Role.ADMIN;
    if (!isAdmin && comment.authorId !== actor.userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });

    await this.activityLogService.log({
      issueId,
      userId: actor.userId,
      type: ActivityType.COMMENT_DELETED,
      message: 'Comment deleted',
    });

    return { success: true };
  }

  private async ensureIssue(issueId: number) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
    });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
  }

  private async getCommentForIssue(issueId: number, commentId: number) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, issueId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }
}
