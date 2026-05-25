import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { getAllowedOrigins } from '../config/cors';

@Injectable()
@WebSocketGateway({
  cors: { origin: getAllowedOrigins(), credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  handleConnection(client: Socket) {
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
}
