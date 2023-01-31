import {
  ERR_MEMBER_NOT_EXISTS,
  ERR_OWNER_NOT_EXISTS,
  ERR_ROOM_NOT_EXISTS
} from '../utils/const';
import RoomMapper from './room';

export interface RoomMember {
  memberId: string;
  nickname: string;
  banVideo: boolean;
  banAudio: boolean;
  banScreen: boolean;
}

class MemberMapper {
  // [memberId]: RoomMember
  members: Map<string, RoomMember> = new Map();

  findMemberById(memberId: string): RoomMember | undefined {
    return this.members.get(memberId);
  }

  updateMember(member: RoomMember) {
    this.members.set(member.memberId, member);
  }

  deleteMember(memberId: string) {
    this.members.delete(memberId);
  }

  /**
   * join query
   */
  findMembersByRoomId(roomId: string): RoomMember[] {
    const room = RoomMapper.findRoomById(roomId);
    if (!room) throw ERR_ROOM_NOT_EXISTS;

    return room.memberIds.map((memberId) => this.members.get(memberId)!);
  }
}

const memberMapper = new MemberMapper();

export default memberMapper;
