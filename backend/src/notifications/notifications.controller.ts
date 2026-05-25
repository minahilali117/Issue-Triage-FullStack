import {
  Controller,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: { userId: number },
    @Query() query: ListNotificationsDto,
  ) {
    return this.notificationsService.list(user.userId, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: { userId: number }) {
    return this.notificationsService.unreadCount(user.userId);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: { userId: number }) {
    return this.notificationsService.markAllRead(user.userId);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markRead(id, user.userId);
  }
}
