import { Injectable, NotFoundException } from '@nestjs/common';
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

  private async ensureIssue(issueId: number) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
    });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
  }
}
