import { Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async recent(limit = 8) {
    const safeLimit = Math.max(1, Math.min(limit, 20));

    return this.prisma.activityLog.findMany({
      where: { issueId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      select: {
        id: true,
        type: true,
        message: true,
        issueId: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, role: true } },
        issue: { select: { id: true, title: true } },
      },
    });
  }

  async log(params: {
    issueId: number;
    userId?: number | null;
    type: ActivityType;
    oldValue?: string | null;
    newValue?: string | null;
    message?: string | null;
  }) {
    const { issueId, userId, type, oldValue, newValue, message } = params;

    return this.prisma.activityLog.create({
      data: {
        issueId,
        userId: userId ?? null,
        type,
        oldValue: oldValue ?? null,
        newValue: newValue ?? null,
        message: message ?? null,
      },
    });
  }
}
