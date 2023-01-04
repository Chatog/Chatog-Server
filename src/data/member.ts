import {
  ERR_MEMBER_NOT_EXISTS,
  ERR_OWNER_NOT_EXISTS,
  ERR_ROOM_NOT_EXISTS
} from '../utils/const';
import RoomMemberMapper from './roomMember';

export interface RoomMember {
  memberId: string;
  nickname: string;
  banVideo: boolean;
  banAudio: boolean;
  banScreen: boolean;
  isRoomOwner: boolean;
}

class MemberMapper {
  // [memberId]: RoomMember
  members: Map<string, RoomMember> = new Map();

  findMemberById(memberId: string): RoomMember {
    const member = this.members.get(memberId);
    if (!member) throw ERR_MEMBER_NOT_EXISTS;

    return member;
  }

  updateMember(member: RoomMember) {
    this.members.set(member.memberId, member);
  }

  deleteMember(memberId: string) {
    if (this.members.has(memberId)) throw ERR_MEMBER_NOT_EXISTS;

    this.members.delete(memberId);
  }

  /**
   * join query
   */
  findMembersByRoomId(roomId: string): RoomMember[] {
    const memberIds = RoomMemberMapper.findMemberIdsByRoomId(roomId);
    if (!memberIds) throw ERR_ROOM_NOT_EXISTS;

    return memberIds.map((memberId) => this.members.get(memberId)!);
  }

  findOwnerByRoomId(roomId: string): RoomMember {
    const memberIds = RoomMemberMapper.findMemberIdsByRoomId(roomId);
    if (!memberIds) throw ERR_ROOM_NOT_EXISTS;

    for (const memberId of memberIds) {
      const member = this.members.get(memberId);
      if (member?.isRoomOwner) {
        return member;
      }
    }
    throw ERR_OWNER_NOT_EXISTS;
  }
}

const memberMapper = new MemberMapper();

export default memberMapper;
