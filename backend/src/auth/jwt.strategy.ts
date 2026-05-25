import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { JwtPayload } from './auth.types';
import { AUTH_COOKIE_NAME } from './auth.constants';

const cookieExtractor = (request: Request): string | null => {
  const maybeCookies = (request as unknown as { cookies?: unknown }).cookies;
  if (!maybeCookies || typeof maybeCookies !== 'object') return null;
  const cookies = maybeCookies as Record<string, unknown>;
  const val = cookies[AUTH_COOKIE_NAME];
  return typeof val === 'string' ? val : null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
