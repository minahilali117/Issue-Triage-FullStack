import { Module } from '@nestjs/common';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { IssuesModule } from './issues/issues.module';
import { PrismaModule } from './prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    ActivityLogModule,
    AuthModule,
    IssuesModule,
    CommentsModule,
    AttachmentsModule,
    RealtimeModule,
    UsersModule,
  ],
})
export class AppModule {}
