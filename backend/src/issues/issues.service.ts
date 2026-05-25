import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ActivityType, Prisma, Role } from '@prisma/client';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { ListIssuesDto } from './dto/list-issues.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueSortBy, SortOrder } from './issues.types';

interface IssueActor {
  userId: number;
  role: Role;
  email: string;
  name?: string | null;
}

@Injectable()
export class IssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateIssueDto, actor: IssueActor) {
    if (!actor?.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const issue = await this.prisma.issue.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        category: dto.category,
        createdById: actor.userId,
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
      },
      include: this.issueInclude,
    });

    await this.activityLogService.log({
      issueId: issue.id,
      userId: actor.userId,
      type: ActivityType.ISSUE_CREATED,
      message: 'Issue created',
    });

    await this.notificationsService.notifyIssueCreated(issue, actor);

    const shapedIssue = this.shapeIssue(issue);
    this.realtimeGateway.emitIssueUpdated(shapedIssue);
    return shapedIssue;
  }

  async list(query: ListIssuesDto, actor: IssueActor) {
    const where: Prisma.IssueWhereInput = {};
    const and: Prisma.IssueWhereInput[] = [];

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.assigneeId !== undefined) {
      and.push({ assigneeId: query.assigneeId });
    }

    const assignmentFilters: Prisma.IssueWhereInput[] = [];
    if (query.my) {
      assignmentFilters.push({ assigneeId: actor.userId });
    }
    if (query.unassigned) {
      assignmentFilters.push({ assigneeId: null });
    }
    if (assignmentFilters.length === 1) {
      and.push(assignmentFilters[0]);
    }
    if (assignmentFilters.length > 1) {
      and.push({ OR: assignmentFilters });
    }

    if (query.search) {
      and.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { category: { contains: query.search, mode: 'insensitive' } },
          {
            assignee: {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          },
        ],
      });
    }

    if (and.length > 0) {
      where.AND = and;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy: IssueSortBy = query.sortBy ?? 'createdAt';
    const sortOrder: SortOrder = query.sortOrder ?? 'desc';
    const orderBy =
      sortBy === 'assignee'
        ? ({
            assignee: { name: sortOrder },
          } as Prisma.IssueOrderByWithRelationInput)
        : ({ [sortBy]: sortOrder } as Prisma.IssueOrderByWithRelationInput);

    const [data, total] = await Promise.all([
      this.prisma.issue.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: this.issueInclude,
      }),
      this.prisma.issue.count({ where }),
    ]);

    return {
      data: data.map((issue) => this.shapeIssue(issue)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        ...this.issueInclude,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        activityLog: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return this.shapeIssue(issue);
  }

  async summary() {
    const [total, open, critical, resolved] = await Promise.all([
      this.prisma.issue.count({}),
      this.prisma.issue.count({ where: { status: 'OPEN' } }),
      this.prisma.issue.count({ where: { priority: 'CRITICAL' } }),
      this.prisma.issue.count({ where: { status: 'RESOLVED' } }),
    ]);

    return { total, open, critical, resolved };
  }

  async update(id: number, dto: UpdateIssueDto, actor: IssueActor) {
    const current = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, email: true, name: true } },
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });

    if (!current) {
      throw new NotFoundException('Issue not found');
    }

    const data: Prisma.IssueUpdateInput = {};
    const isAdmin = actor.role === Role.ADMIN;

    if (isAdmin) {
      if (dto.title !== undefined) data.title = dto.title;
      if (dto.description !== undefined) data.description = dto.description;
      if (dto.status !== undefined) data.status = dto.status;
      if (dto.priority !== undefined) data.priority = dto.priority;
      if (dto.category !== undefined) data.category = dto.category;
    } else {
      if (
        dto.title !== undefined ||
        dto.description !== undefined ||
        dto.priority !== undefined ||
        dto.category !== undefined
      ) {
        throw new ForbiddenException(
          'Developers can only update issue status or assignment',
        );
      }

      if (dto.status !== undefined) {
        data.status = dto.status;
      }
    }

    if (dto.assigneeId !== undefined) {
      if (isAdmin) {
        if (dto.assigneeId === null) {
          data.assignee = { disconnect: true };
        } else {
          data.assignee = { connect: { id: dto.assigneeId } };
        }
      } else {
        if (dto.assigneeId === null) {
          if (current.assigneeId !== actor.userId) {
            throw new ForbiddenException(
              'Developers can only unassign themselves',
            );
          }
          data.assignee = { disconnect: true };
        } else if (dto.assigneeId !== actor.userId) {
          throw new ForbiddenException(
            'Developers can only assign issues to themselves',
          );
        } else {
          data.assignee = { connect: { id: actor.userId } };
        }
      }
    }

    const issue = await this.prisma.issue.update({
      where: { id },
      data,
      include: this.issueInclude,
    });

    await this.logIssueChanges(current, issue, actor.userId, data, issue.id);
    await this.notificationsService.notifyIssueUpdated(current, issue, actor);

    const shapedIssue = this.shapeIssue(issue);
    this.realtimeGateway.emitIssueUpdated(shapedIssue);
    if (
      data.assignee !== undefined &&
      current.assigneeId !== issue.assigneeId
    ) {
      this.realtimeGateway.emitIssueAssigned(shapedIssue);
    }
    return shapedIssue;
  }

  async remove(
    id: number,
    actor: { userId: number; email: string; name?: string | null; role: Role },
  ) {
    const issue = await this.getById(id);
    await this.notificationsService.notifyIssueDeleted(issue, {
      userId: actor.userId,
      email: actor.email,
      name: actor.name,
      role: actor.role,
    });
    return this.prisma.issue.delete({ where: { id } });
  }

  private readonly issueInclude = {
    assignee: { select: { id: true, name: true, email: true, role: true } },
    createdBy: { select: { id: true, name: true, email: true, role: true } },
  } satisfies Prisma.IssueInclude;

  private shapeIssue<
    T extends {
      assignee: {
        id: number;
        name: string | null;
        email: string;
        role: Role;
      } | null;
      createdBy: { id: number; name: string | null; email: string; role: Role };
    } & Record<string, unknown>,
  >(issue: T) {
    return {
      ...issue,
      assignee: issue.assignee,
      createdBy: issue.createdBy,
    };
  }

  private async logIssueChanges(
    before: {
      status: string;
      priority: string;
      assigneeId: number | null;
      assignee: { id: number; name: string | null; email: string } | null;
    },
    after: {
      status: string;
      priority: string;
      assigneeId: number | null;
      assignee: { id: number; name: string | null; email: string } | null;
    },
    actorId: number,
    data: Prisma.IssueUpdateInput,
    issueId: number,
  ) {
    const logs: Array<Promise<unknown>> = [];

    if (data.status !== undefined && before.status !== after.status) {
      logs.push(
        this.activityLogService.log({
          issueId,
          userId: actorId,
          type: ActivityType.STATUS_CHANGED,
          oldValue: before.status,
          newValue: after.status,
        }),
      );
    }

    if (data.priority !== undefined && before.priority !== after.priority) {
      logs.push(
        this.activityLogService.log({
          issueId,
          userId: actorId,
          type: ActivityType.PRIORITY_CHANGED,
          oldValue: before.priority,
          newValue: after.priority,
        }),
      );
    }

    if (data.assignee !== undefined && before.assigneeId !== after.assigneeId) {
      const beforeLabel = before.assignee
        ? (before.assignee.name ?? before.assignee.email)
        : 'Unassigned';
      const afterLabel = after.assignee
        ? (after.assignee.name ?? after.assignee.email)
        : 'Unassigned';

      logs.push(
        this.activityLogService.log({
          issueId,
          userId: actorId,
          type: ActivityType.ASSIGNEE_CHANGED,
          oldValue: beforeLabel,
          newValue: afterLabel,
        }),
      );
    }

    if (logs.length > 0) {
      await Promise.all(logs);
    }
  }
}
