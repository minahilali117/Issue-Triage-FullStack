import { Module } from '@nestjs/common';
import { IssuesModule } from './issues/issues.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, IssuesModule],
})
export class AppModule {}
