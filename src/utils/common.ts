import { v4 as uuid } from 'uuid';

/**
 * generate unique id
 */
export function generateRoomId(): string {
  return 'r@' + uuid().replaceAll(/\-/g, '');
}
export function generateMemberId(roomId: string): string {
  return roomId + '@' + uuid().replaceAll(/\-/g, '');
}

/**
 * convert memberId to roomId
 * @param {string} memberId r@${uuid}@${uuid}
 * @return roomId: r@${uuid}
 */
export function memberIdToRoomId(memberId: string): string {
  let lastAtIndex = 0;
  for (let i = memberId.length; i >= 0; --i) {
    if (memberId[i] === '@') {
      lastAtIndex = i;
      break;
    }
  }
  return memberId.substring(0, lastAtIndex);
}
