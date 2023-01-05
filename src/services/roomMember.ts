import MemberMapper, { RoomMember } from '../data/member';
import RoomMemberMapper from '../data/roomMember';
import { generateRoomMemberId } from '../utils/common';

class RoomMemberService {
  newMemberJoinRoom(roomId: string, roomMemberInit: RoomMember): string {
    const memberId = generateRoomMemberId();
    const member = {
      ...roomMemberInit,
      memberId
    };

    const memberIds = RoomMemberMapper.findMemberIdsByRoomId(roomId) || [];

    RoomMemberMapper.updateRoomMembers(roomId, [...memberIds, memberId]);

    MemberMapper.updateMember(member);

    return memberId;
  }

  /**
   * @attention the first member is yourself, the second is room owner (if not yourself)
   */
  getRoomMembers(roomId: string, memberId: string): RoomMember[] {
    const members = MemberMapper.findMembersByRoomId(roomId);

    const ret: RoomMember[] = [];
    let self: RoomMember, owner: RoomMember | undefined;

    for (const member of members) {
      if (member.memberId === memberId) {
        self = member;
      } else if (member.isRoomOwner) {
        owner = member;
      } else {
        ret.push(member);
      }
    }

    if (owner) ret.unshift(owner);
    ret.unshift(self!);

    return ret;
  }
}

const roomMemberService = new RoomMemberService();

export default roomMemberService;
