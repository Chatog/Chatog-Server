import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { ChatogSocketData } from '.';
import { IS_DEBUG } from '..';

export type EventHandler<P, R> = (
  socket: Socket<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    ChatogSocketData
  >,
  data: P,
  callback: (v: R) => void
) => void;

const eventHandlers: Map<string, EventHandler<any, any>> = new Map();

export function registerEventHandler(
  eventName: string,
  handler: EventHandler<any, any>
) {
  eventHandlers.set(eventName, handler);
}

export function setSocketHandlers(socket: Socket) {
  for (const eventName of eventHandlers.keys()) {
    const handler = eventHandlers.get(eventName)!;
    socket.on(eventName, (data, callback) => {
      handler(socket, data, callback);
    });
  }
}
