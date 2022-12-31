import { v4 as uuidv4 } from 'uuid';

export function generateRoomId(): string {
  return 'r@' + uuidv4();
}

export function generateRoomMemberId(): string {
  return 'm@' + uuidv4();
}
