import { Module } from '@nestjs/common';
import { IssuesModule } from './issues/issues.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [IssuesModule],
  providers: [PrismaService],
})
export class AppModule {}
