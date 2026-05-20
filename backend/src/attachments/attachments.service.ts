import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { unlink } from 'fs/promises';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(issueId: number) {
    await this.ensureIssue(issueId);

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

  async create(issueId: number, file: Express.Multer.File, userId: number) {
    await this.ensureIssue(issueId);

    return this.prisma.attachment.create({
      data: {
        fileName: file.originalname,
        filePath: file.path,
        uploadedById: userId,
        issueId,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
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

  async remove(
    issueId: number,
    attachmentId: number,
    actor: { userId: number; role: Role },
  ) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, issueId },
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

    try {
      await unlink(attachment.filePath);
    } catch {
      // Metadata deletion should still succeed if the file was already missing.
    }

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
}
