import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/auth.types';
import { getAllowedOrigins } from '../config/cors';
import { PrismaService } from '../prisma.service';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'triage_auth';

const parseCookieHeader = (cookieHeader?: string) => {
  if (!cookieHeader) {
    return {} as Record<string, string>;
  }

  return cookieHeader
    .split(';')
    .reduce<Record<string, string>>((accumulator, part) => {
      const [rawKey, ...rest] = part.trim().split('=');
      if (!rawKey) {
        return accumulator;
      }

      accumulator[rawKey] = decodeURIComponent(rest.join('='));
      return accumulator;
    }, {});
};

@Injectable()
@WebSocketGateway({
  cors: { origin: getAllowedOrigins(), credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  @WebSocketServer()
  private server!: Server;

  async handleConnection(client: Socket) {
    try {
      const userId = await this.authenticateClient(client);
      void client.join(this.userRoom(userId));
    } catch {
      client.disconnect(true);
      return;
    }

    client.emit('connected', { ok: true });
  }

  emitIssueUpdated(issue: unknown) {
    this.server?.emit('issue.updated', issue);
  }

  emitIssueAssigned(payload: unknown) {
    this.server?.emit('issue.assigned', payload);
  }

  emitCommentAdded(payload: unknown) {
    this.server?.emit('comment.added', payload);
  }

  emitNotificationCreated(recipientId: number, payload: unknown) {
    this.server
      ?.to(this.userRoom(recipientId))
      .emit('notification.created', payload);
  }

  emitNotificationUpdated(recipientId: number, payload: unknown) {
    this.server
      ?.to(this.userRoom(recipientId))
      .emit('notification.updated', payload);
  }

  private userRoom(userId: number) {
    return `user:${userId}`;
  }

  private async authenticateClient(client: Socket) {
    const cookies = parseCookieHeader(client.handshake.headers.cookie);
    const token =
      cookies[AUTH_COOKIE_NAME] ??
      client.handshake.auth?.token ??
      this.extractBearerToken(client.handshake.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: process.env.JWT_SECRET ?? 'dev-secret-key',
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    return user.id;
  }

  private extractBearerToken(authorizationHeader?: string) {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      return null;
    }

    return authorizationHeader.slice('Bearer '.length);
  }
}
