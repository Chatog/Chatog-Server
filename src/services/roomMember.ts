import { generateRoomMemberId } from '../utils/common';
import { ERR_MEMBER_NOT_EXISTS, ERR_ROOM_NOT_EXISTS } from '../utils/const';

export interface RoomMember {
  memberId: string;
  nickname: string;
  banVideo: boolean;
  banAudio: boolean;
  banScreen: boolean;
}

export interface RoomMemberVO {
  memberId: string;
  nickname: string;
  banVideo: boolean;
  banAudio: boolean;
  banScreen: boolean;
  isRoomOwner: boolean;
}

class RoomMemberService {
  // [roomId]: [ memberId ]
  roomMembers: Map<string, string[]> = new Map();
  // [memberId]: RoomMember
  members: Map<string, RoomMember> = new Map();
  // [roomId]: memberId
  roomOwner: Map<string, string> = new Map();

  /**
   * @returns memberId
   */
  memberJoinRoom(roomId: string, roomMemberInit: RoomMember): string {
    const memberId = generateRoomMemberId();
    if (!this.roomMembers.has(roomId)) {
      this.roomMembers.set(roomId, []);
      // the first member will be the room owner
      if (!this.roomOwner.has(roomId)) {
        this.roomOwner.set(roomId, memberId);
      }
    }

    this.members.set(memberId, {
      ...roomMemberInit,
      memberId
    });

    this.roomMembers.get(roomId)!.push(memberId);

    return memberId;
  }

  isRoomOwner(roomId: string, memberId: string): boolean {
    const roomOwnerId = this.roomOwner.get(roomId);
    if (!roomOwnerId) throw ERR_ROOM_NOT_EXISTS;
    return roomOwnerId === memberId;
  }

  getRoomMembers(roomId: string, memberId: string): RoomMemberVO[] {
    const memberIds = this.roomMembers.get(roomId);
    if (!memberIds) throw ERR_ROOM_NOT_EXISTS;

    const ret: RoomMemberVO[] = [];
    let self: RoomMemberVO, roomOwner: RoomMemberVO | undefined;

    for (let i = 0; i < memberIds.length; ++i) {
      const member = this.members.get(memberIds[i]);
      if (!member) throw ERR_MEMBER_NOT_EXISTS;

      const memberVO = {
        ...member,
        isRoomOwner: this.isRoomOwner(roomId, member?.memberId)
      };
      if (member.memberId === memberId) {
        self = memberVO;
      } else if (memberVO.isRoomOwner) {
        roomOwner = memberVO;
      } else {
        ret.push(memberVO);
      }
    }

    // the first member is yourself, the second is room owner (if not yourself)
    if (roomOwner) ret.unshift(roomOwner);
    ret.unshift(self!);

    return ret;
  }
}

const roomMemberService = new RoomMemberService();

export default roomMemberService;
