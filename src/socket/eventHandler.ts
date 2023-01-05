import { Socket } from 'socket.io';

type EventHandler = (
  socket: Socket,
  data: any,
  callback: (v: any) => void
) => void;

const eventHandlers: Map<string, EventHandler> = new Map();

export function registerEventHandler(eventName: string, handler: EventHandler) {
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
