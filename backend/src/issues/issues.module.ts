import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';

@Module({
  imports: [PrismaModule],
  controllers: [IssuesController],
  providers: [IssuesService, JwtAuthGuard, RolesGuard],
})
export class IssuesModule {}
