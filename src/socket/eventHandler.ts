import { Socket } from 'socket.io';
import { IS_DEBUG } from '..';

export type EventHandler<T> = (
  socket: Socket<
    any,
    any,
    any,
    {
      roomId: string;
      memberId: string;
    }
  >,
  data: T,
  callback: (v: T) => void
) => void;

const eventHandlers: Map<string, EventHandler<any>> = new Map();

export function registerEventHandler(
  eventName: string,
  handler: EventHandler<any>
) {
  eventHandlers.set(eventName, handler);
}

export function setSocketHandlers(socket: Socket) {
  for (const eventName of eventHandlers.keys()) {
    const handler = eventHandlers.get(eventName)!;
    socket.on(eventName, (data, callback) => {
      if (IS_DEBUG) {
        console.log('[Socket Request]', eventName, data);
      }
      handler(socket, data, callback);
    });
  }
}
