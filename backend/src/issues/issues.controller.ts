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
} from '@nestjs/common';
import { CreateIssueDto } from './dto/create-issue.dto';
import { ListIssuesDto } from './dto/list-issues.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssuesService } from './issues.service';

@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  create(@Body() dto: CreateIssueDto) {
    return this.issuesService.create(dto);
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIssueDto) {
    return this.issuesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.remove(id);
  }
}
