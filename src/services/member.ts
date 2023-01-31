import MemberMapper, { RoomMember } from '../data/member';
import RoomMapper from '../data/room';
import { ERR_ROOM_NOT_EXISTS } from '../utils/const';
import { RoomMemberVO } from '../controllers/room';

class RoomMemberService {
  /**
   * @attention the first member is yourself, the second is room owner (if not yourself)
   */
  getRoomMembers(roomId: string, memberId: string): RoomMemberVO[] {
    const room = RoomMapper.findRoomById(roomId);
    if (!room) throw ERR_ROOM_NOT_EXISTS;

    const members = MemberMapper.findMembersByRoomId(roomId);

    const ret: RoomMemberVO[] = [];
    let self: RoomMemberVO, owner: RoomMemberVO | undefined;

    for (const member of members) {
      const membervo: RoomMemberVO = {
        ...member,
        isRoomOwner: member.memberId === room.roomOwnerId
      };
      if (member.memberId === memberId) {
        self = membervo;
      } else if (membervo.isRoomOwner) {
        owner = membervo;
      } else {
        ret.push(membervo);
      }
    }

    if (owner) ret.unshift(owner);
    ret.unshift(self!);

    return ret;
  }
}

const roomMemberService = new RoomMemberService();

export default roomMemberService;
