import {
  ReqCreateRoomParam,
  ReqJoinRoomParam,
  RoomInfo
} from '../controllers/room';
import { generateRoomId, generateMemberId } from '../utils/common';
import { ERR_ROOM_NOT_EXISTS } from '../utils/const';
import RoomMapper, { Room } from '../data/room';
import MemberMapper from '../data/member';
import SyncService from './sync';
import MemberService from './member';

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
    if (!room) throw new Error(ERR_ROOM_NOT_EXISTS);

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

    SyncService.syncRoomMembers(param.roomNumber, memberId);

    return memberId;
  }

  getRoomInfo(roomId: string): RoomInfo {
    const room = RoomMapper.findRoomById(roomId);
    if (!room) throw new Error(ERR_ROOM_NOT_EXISTS);

    return room;
  }

  /**
   * member quit room, update members and room info
   */
  quitRoom(roomId: string, memberId: string) {
    const room = RoomMapper.findRoomById(roomId);
    if (!room) throw new Error(ERR_ROOM_NOT_EXISTS);

    const memberIds = room.memberIds;

    // owner quit
    if (memberId === room.roomOwnerId) {
      // release all members in room
      memberIds.forEach((mid) => MemberService.memberQuit(mid));
      RoomMapper.deleteRoom(roomId);
    }
    // member quit
    else {
      MemberService.memberQuit(memberId);

      memberIds.splice(memberIds.indexOf(memberId), 1);
      RoomMapper.updateRoom(room);

      // still has members in room, should sync
      SyncService.syncRoomMembers(roomId, memberId);
    }
  }
}

const roomService = new RoomService();

export default roomService;
