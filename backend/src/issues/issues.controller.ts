import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateIssueDto } from './dto/create-issue.dto';
import { ListIssuesDto } from './dto/list-issues.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssuesService } from './issues.service';

@Controller('issues')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.DEVELOPER, Role.VIEWER)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.DEVELOPER)
  create(@Body() dto: CreateIssueDto, @CurrentUser() user: { userId: number; role: Role; email: string }) {
    return this.issuesService.create(dto, user);
  }

  @Get()
  list(@Query() query: ListIssuesDto) {
    return this.issuesService.list(query);
  }

  @Get('summary')
  summary() {
    return this.issuesService.summary();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.getById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.DEVELOPER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIssueDto,
    @CurrentUser() user: { userId: number; role: Role; email: string },
  ) {
    return this.issuesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.remove(id);
  }
}
