import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsService } from './comments.service';

@Controller('issues/:issueId/comments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.DEVELOPER, Role.VIEWER)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  list(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.commentsService.list(issueId);
  }

  @Post()
  create(
    @Param('issueId', ParseIntPipe) issueId: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { userId: number; role: Role },
  ) {
    return this.commentsService.create(issueId, dto, user);
  }

  @Patch(':commentId')
  update(
    @Param('issueId', ParseIntPipe) issueId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: { userId: number; role: Role },
  ) {
    return this.commentsService.update(issueId, commentId, dto, user);
  }

  @Delete(':commentId')
  remove(
    @Param('issueId', ParseIntPipe) issueId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser() user: { userId: number; role: Role },
  ) {
    return this.commentsService.remove(issueId, commentId, user);
  }
}
