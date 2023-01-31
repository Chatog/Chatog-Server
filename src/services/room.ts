import {
  ReqCreateRoomParam,
  ReqJoinRoomParam,
  RoomInfo
} from '../controllers/room';
import { generateRoomId, generateMemberId } from '../utils/common';
import { ERR_MEMBER_NOT_EXISTS, ERR_ROOM_NOT_EXISTS } from '../utils/const';
import RoomMemberService from './member';
import RoomMapper, { Room } from '../data/room';
import MemberMapper from '../data/member';

class RoomService {
  /**
   * create room, create room owner and join
   * @returns memberId
   */
  createRoom(param: ReqCreateRoomParam): string {
    const roomId = generateRoomId();
    const room: Room = {
      roomId,
      roomStartTime: Date.now(),
      roomOwnerId: '',
      memberIds: [],
      ...param
    };

    const memberId = generateMemberId(roomId);
    const member = {
      memberId,
      nickname: param.nickname,
      // room owner will not be banned
      banVideo: false,
      banAudio: false,
      banScreen: false
    };

    room.memberIds.push(memberId);
    room.roomOwnerId = memberId;

    MemberMapper.updateMember(member);
    RoomMapper.updateRoom(room);

    return memberId;
  }
  /**
   * create member and join
   * @returns memberId
   */
  joinRoom(param: ReqJoinRoomParam): string {
    const room = RoomMapper.findRoomById(param.roomNumber);
    if (!room) throw ERR_ROOM_NOT_EXISTS;

    const memberId = generateMemberId(room.roomId);
    const member = {
      memberId,
      nickname: param.nickname,
      // room config decides member auths
      banVideo: room.banVideo,
      banAudio: room.banAudio,
      banScreen: room.banScreen
    };

    room.memberIds.push(memberId);

    MemberMapper.updateMember(member);
    RoomMapper.updateRoom(room);

    return memberId;
  }

  getRoomInfo(roomId: string): RoomInfo {
    const room = RoomMapper.findRoomById(roomId);
    if (!room) throw ERR_ROOM_NOT_EXISTS;

    return room;
  }

  /**
   * member quit room, stop media and close socket
   */
  quitRoom(roomId: string, memberId: string) {
    const room = RoomMapper.findRoomById(roomId);
    if (!room) throw ERR_ROOM_NOT_EXISTS;

    const memberIds = room.memberIds;

    const memberIndex = memberIds.indexOf(memberId);
    const member = MemberMapper.findMemberById(memberId);
    if (memberIndex === -1 || !member) throw ERR_MEMBER_NOT_EXISTS;

    MemberMapper.deleteMember(memberId);
    // @TODO stop media
    // @TODO close socket

    // member quit or owner quit
    if (member.memberId === room.roomOwnerId) {
      memberIds.splice(memberIndex, 1);
      RoomMapper.updateRoom(room);
    } else {
      RoomMapper.deleteRoom(roomId);
    }
  }
}

const roomService = new RoomService();

export default roomService;
