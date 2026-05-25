import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { unlink } from 'fs/promises';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

interface AttachmentActor {
  userId: number;
  email: string;
  role: Role;
  name?: string | null;
}

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list(issueId: number) {
    await this.getIssueContext(issueId);

    return this.prisma.attachment.findMany({
      where: { issueId },
      orderBy: { createdAt: 'asc' },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async create(issueId: number, file: Express.Multer.File, actor: AttachmentActor) {
    const issue = await this.getIssueContext(issueId);

    const attachment = await this.prisma.attachment.create({
      data: {
        fileName: file.originalname,
        filePath: file.path,
        uploadedById: actor.userId,
        issueId,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await this.notificationsService.notifyAttachmentUploaded(issue, attachment, actor);

    return attachment;
  }

  async getForDownload(issueId: number, attachmentId: number) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, issueId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  async remove(issueId: number, attachmentId: number, actor: AttachmentActor) {
    const issue = await this.getIssueContext(issueId);
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, issueId },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const canDelete =
      actor.role === Role.ADMIN || attachment.uploadedById === actor.userId;

    if (!canDelete) {
      throw new ForbiddenException('You can only delete your own attachments');
    }

    await this.prisma.attachment.delete({ where: { id: attachment.id } });

    await this.notificationsService.notifyAttachmentDeleted(issue, attachment, actor);

    try {
      await unlink(attachment.filePath);
    } catch {
      // Metadata deletion should still succeed if the file was already missing.
    }

    return { success: true };
  }

  private async getIssueContext(issueId: number) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        status: true,
        priority: true,
        assigneeId: true,
        createdById: true,
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return issue;
  }
}
