import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { ChatogSocketData } from '.';
import { IS_DEBUG } from '..';

export type EventHandler<T> = (
  socket: Socket<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    ChatogSocketData
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
      handler(socket, data, callback);
    });
  }
}
