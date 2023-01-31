import { Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import { IS_DEBUG } from '..';
import { memberIdToRoomId } from '../utils/common';
import { setSocketHandlers } from './event-handler';

let io: SocketServer | null = null;

export default function getSocketServer() {
  return io;
}

export function initSocketIO(server: Server) {
  io = new SocketServer(server, {
    // allow cors for dev
    cors: {
      origin: '*'
    }
  });

  io.on('connection', (socket) => {
    // client will pass roomId just when connect
    const { memberId } = socket.handshake.auth;
    const roomId = memberIdToRoomId(memberId);

    if (IS_DEBUG) {
      console.log(`[socket] connect:`, memberId);
    }

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
