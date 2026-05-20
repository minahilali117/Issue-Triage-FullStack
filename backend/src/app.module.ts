import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { IssuesModule } from './issues/issues.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, IssuesModule],
})
export class AppModule {}
