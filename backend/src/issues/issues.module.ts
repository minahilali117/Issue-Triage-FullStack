import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RealtimeModule } from '../realtime/realtime.module';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';

@Module({
  imports: [PrismaModule, ActivityLogModule, RealtimeModule],
  controllers: [IssuesController],
  providers: [IssuesService, JwtAuthGuard, RolesGuard],
})
export class IssuesModule {}
