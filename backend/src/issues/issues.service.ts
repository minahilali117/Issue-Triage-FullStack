import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIssueDto, actor: IssueActor) {
    if (!actor?.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const assigneeId = await this.resolveAssigneeId(dto.assignee);

    const issue = await this.prisma.issue.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        category: dto.category,
        createdById: actor.userId,
        ...(assigneeId !== undefined ? { assigneeId } : {}),
      },
      include: this.issueInclude,
    });

    return this.shapeIssue(issue);
  }

  async list(query: ListIssuesDto) {
    const where: Prisma.IssueWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.assignee) {
      const maybeId = Number(query.assignee);
      if (!Number.isNaN(maybeId)) {
        where.assigneeId = maybeId;
      } else {
        const users = await this.prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: query.assignee, mode: 'insensitive' } },
              { email: { contains: query.assignee, mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });

        where.assigneeId =
          users.length > 0 ? { in: users.map((user) => user.id) } : -1;
      }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy: IssueSortBy = query.sortBy ?? 'createdAt';
    const sortOrder: SortOrder = query.sortOrder ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.issue.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder } as Prisma.IssueOrderByWithRelationInput,
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
          include: { author: { select: { id: true, name: true, email: true, role: true } } },
        },
        activityLog: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
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
      include: { assignee: { select: { id: true, email: true, name: true } } },
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
      if (dto.title !== undefined || dto.description !== undefined || dto.priority !== undefined || dto.category !== undefined) {
        throw new ForbiddenException('Developers can only update issue status or assignment');
      }

      if (dto.status !== undefined) {
        data.status = dto.status;
      }
    }

    if (dto.assignee !== undefined) {
      if (isAdmin) {
        const assigneeId = await this.resolveAssigneeId(dto.assignee);
        data.assignee = assigneeId === undefined ? undefined : assigneeId === null ? { disconnect: true } : { connect: { id: assigneeId } };
      } else {
        const normalizedAssignee = dto.assignee.trim().toLowerCase();
        const actorMatchesSelf =
          normalizedAssignee === actor.email.toLowerCase() ||
          normalizedAssignee === String(actor.userId) ||
          (actor.name ? normalizedAssignee === actor.name.toLowerCase() : false);

        if (!actorMatchesSelf) {
          throw new ForbiddenException('Developers can only assign issues to themselves');
        }

        data.assignee = { connect: { id: actor.userId } };
      }
    }

    const issue = await this.prisma.issue.update({
      where: { id },
      data,
      include: this.issueInclude,
    });

    return this.shapeIssue(issue);
  }

  async remove(id: number) {
    await this.getById(id);
    return this.prisma.issue.delete({ where: { id } });
  }

  private readonly issueInclude = {
    assignee: { select: { id: true, name: true, email: true, role: true } },
    createdBy: { select: { id: true, name: true, email: true, role: true } },
  } satisfies Prisma.IssueInclude;

  private async resolveAssigneeId(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const maybeId = Number(trimmed);
    if (!Number.isNaN(maybeId)) {
      return maybeId;
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: trimmed, mode: 'insensitive' } },
          { email: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    return user?.id ?? null;
  }

  private shapeIssue<T extends {
    assignee: { id: number; name: string | null; email: string; role: Role } | null;
    createdBy: { id: number; name: string | null; email: string; role: Role };
  } & Record<string, unknown>>(issue: T) {
    return {
      ...issue,
      assignee: issue.assignee ? issue.assignee.name ?? issue.assignee.email : null,
      createdBy: issue.createdBy,
    };
  }
}
