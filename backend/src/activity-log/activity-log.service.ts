import { Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

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
