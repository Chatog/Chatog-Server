import {
  ReqCreateRoomParam,
  ReqJoinRoomParam,
  RoomInfo
} from '../controllers/room';
import { generateRoomId } from '../utils/common';
import RoomMemberService from './roomMember';
import { ERR_ROOM_NOT_EXISTS } from '../utils/const';
import { encodeRoomMemberJwt } from './token';

export interface Room {
  roomId: string;
  roomName: string;
  roomStartTime: number;
  banVideo: boolean;
  banAudio: boolean;
  banScreen: boolean;
  banChat: boolean;
}

class RoomService {
  rooms: Map<string, Room> = new Map();

  createRoom(param: ReqCreateRoomParam): RoomInfo & { token: string } {
    const roomId = generateRoomId();
    const newRoom: Room = {
      roomId,
      roomStartTime: Date.now(),
      ...param
    };
    this.rooms.set(roomId, newRoom);

    const memberId = RoomMemberService.memberJoinRoom(roomId, {
      memberId: '',
      nickname: param.nickname,
      // room owner will not be banned
      banVideo: true,
      banAudio: true,
      banScreen: true
    });

    return {
      ...newRoom,
      token: encodeRoomMemberJwt(memberId)
    };
  }

  joinRoom(param: ReqJoinRoomParam): RoomInfo & { token: string } {
    const room = this.rooms.get(param.roomNumber);
    if (!room) throw ERR_ROOM_NOT_EXISTS;

    const memberId = RoomMemberService.memberJoinRoom(room.roomId, {
      memberId: '',
      nickname: param.nickname,
      // room config decides member auths
      banVideo: room.banVideo,
      banAudio: room.banAudio,
      banScreen: room.banScreen
    });

    return {
      ...room,
      token: encodeRoomMemberJwt(memberId)
    };
  }

  getRoomInfo(roomId: string): RoomInfo {
    const room = this.rooms.get(roomId);
    if (!room) throw ERR_ROOM_NOT_EXISTS;

    return room;
  }
}

const roomService = new RoomService();

export default roomService;
