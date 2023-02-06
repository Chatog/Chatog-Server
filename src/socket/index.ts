import { Server } from 'http';
import { RemoteSocket, Server as SocketServer, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { IS_DEBUG } from '..';
import RoomService from '../services/room';
import { memberIdToRoomId } from '../utils/common';
import { setSocketHandlers } from './event-handler';

export interface ChatogSocketData {
  memberId: string;
  roomId: string;
}

export type ChatogServer = SocketServer<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  ChatogSocketData
>;

let io: ChatogServer | null = null;
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
      // if client side cause socket disconnect, we must call quitRoom
      if (
        e === 'client namespace disconnect' ||
        e === 'transport close' ||
        e === 'transport error'
      ) {
        RoomService.quitRoom(roomId, memberId);
      }
    });

    if (IS_DEBUG) {
      socket.use(([event, payload], next) => {
        console.debug('[socket] on:', event, JSON.stringify(payload));
        next();
      });
    }

    setSocketHandlers(socket);
  });

  console.log('[socket] socket.io server started');

  return io;
}

type DataGenerator = (
  s: RemoteSocket<DefaultEventsMap, ChatogSocketData>
) => any;
/**
 * broadcast msg to all clients except some
 * @param roomId
 * @param exceptCondition judge whether a socket should be excepted
 * @param event
 * @param dataGenerator data or function to generate data via socket instance
 */
export function broadcastExcept(
  roomId: string,
  exceptCondition: (
    s: RemoteSocket<DefaultEventsMap, ChatogSocketData>
  ) => boolean,
  event: string,
  dataGenerator: number | string | Record<string, any> | DataGenerator
) {
  io?.in(roomId)
    .fetchSockets()
    .then((sockets) => {
      for (const socket of sockets) {
        if (exceptCondition(socket)) continue;

        const data =
          typeof dataGenerator === 'function'
            ? dataGenerator(socket)
            : dataGenerator;
        socket.emit(event, data);
      }
    });
}
/**
 * close socket of a specific member
 */
export function closeSocket(memberId: string) {
  io?.in(memberIdToRoomId(memberId))
    .fetchSockets()
    .then((sockets) => {
      const memberSocket = sockets.find(
        (socket) => socket.data.memberId === memberId
      );
      if (memberSocket) {
        memberSocket.disconnect();
      }
    });
}
/**
 * get socket by memberId
 */
export async function getSocket(
  memberId: string
): Promise<RemoteSocket<any, ChatogSocketData> | undefined> {
  return io
    ?.in(memberIdToRoomId(memberId))
    .fetchSockets()
    .then((sockets) => {
      return sockets.find((socket) => socket.data.memberId === memberId);
    });
}
