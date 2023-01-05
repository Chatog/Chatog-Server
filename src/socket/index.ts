import { Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import { setSocketHandlers } from './eventHandler';

let io: SocketServer | null = null;

export function initSocketIO(server: Server) {
  io = new SocketServer(server, {
    // allow cors for dev
    cors: {
      origin: 'http://localhost:3004'
    }
  });

  io.on('connection', (socket) => {
    // client will pass roomId and memberId just when connect
    const { roomId, memberId } = socket.handshake.auth;
    socket.data.memberId = memberId;
    socket.data.roomId = roomId;

    socket.join(roomId);

    socket.on('disconnect', (e) => {
      console.log(`socket[${memberId}][${roomId}] disconnect:`, e);
      // @TODO do something when exception exit
    });

    setSocketHandlers(socket);
  });

  console.log('socket.io server started');
}
