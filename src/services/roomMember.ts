import { generateRoomMemberId } from '../utils/common';

export interface RoomMember {
  memberId: string;
  nickname: string;
  banVideo: boolean;
  banAudio: boolean;
  banScreen: boolean;
}

class RoomMemberService {
  // [roomId]: ([memberId]: RoomMember)
  roomMembers: Map<string, Map<string, RoomMember>> = new Map();
  // [roomId]: memberId
  roomOwner: Map<string, string> = new Map();

  /**
   * @returns memberId
   */
  memberJoinRoom(roomId: string, roomMemberInit: RoomMember): string {
    const memberId = generateRoomMemberId();
    if (!this.roomMembers.has(roomId)) {
      this.roomMembers.set(roomId, new Map());
      // the first member will be the room owner
      if (!this.roomOwner.has(roomId)) {
        this.roomOwner.set(roomId, memberId);
      }
    }

    this.roomMembers.get(roomId)?.set(memberId, {
      ...roomMemberInit,
      memberId
    });

    return memberId;
  }
}

const roomMemberService = new RoomMemberService();

export default roomMemberService;
