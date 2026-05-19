import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateIssueDto } from './dto/create-issue.dto';
import { ListIssuesDto } from './dto/list-issues.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueSortBy, SortOrder } from './issues.types';
import { PrismaService } from '../prisma.service';

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateIssueDto) {
    return this.prisma.issue.create({ data: dto });
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
      where.assignee = query.assignee;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
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
      }),
      this.prisma.issue.count({ where }),
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

  async getById(id: number) {
    const issue = await this.prisma.issue.findUnique({ where: { id } });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return issue;
  }

  async summary() {
    const [total, open, critical, resolved] = await Promise.all([
      this.prisma.issue.count({}),
      this.prisma.issue.count({ where: { status: 'OPEN' } }),
      this.prisma.issue.count({ where: { priority: 'CRITICAL' } }),
      this.prisma.issue.count({ where: { status: 'RESOLVED' } }),
    ]);

    return {
      total,
      open,
      critical,
      resolved,
    };
  }

  async update(id: number, dto: UpdateIssueDto) {
    await this.getById(id);
    return this.prisma.issue.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.getById(id);
    return this.prisma.issue.delete({ where: { id } });
  }
}
