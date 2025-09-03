import { Server as SocketIOServer } from 'socket.io';

declare global {
  var io: SocketIOServer | undefined;
  var userSockets: Map<string, string> | undefined;
  var socketUsers: Map<string, string> | undefined;
}

export {};
