import {
  ReqCreateRoomParam,
  ReqJoinRoomParam,
  RoomInfo
} from '../controllers/room';
import { generateRoomId } from '../utils/common';
import { ERR_ROOM_NOT_EXISTS } from '../utils/const';
import { encodeRoomMemberJwt } from './token';
import RoomMemberService from './roomMember';
import RoomMapper, { Room } from '../data/room';

export interface RoomInfoWithToken extends RoomInfo {
  token: string;
}

class RoomService {
  createRoom(param: ReqCreateRoomParam): RoomInfoWithToken {
    const roomId = generateRoomId();
    const newRoom: Room = {
      roomId,
      roomStartTime: Date.now(),
      ...param
    };
    RoomMapper.updateRoom(newRoom);

    const memberId = RoomMemberService.memberJoinRoom(roomId, {
      memberId: '',
      nickname: param.nickname,
      isRoomOwner: true,
      // room owner will not be banned
      banVideo: false,
      banAudio: false,
      banScreen: false
    });

    const token = encodeRoomMemberJwt(memberId);

    return {
      ...newRoom,
      token
    };
  }

  joinRoom(param: ReqJoinRoomParam): RoomInfoWithToken {
    const room = RoomMapper.findRoomById(param.roomNumber);
    if (!room) throw ERR_ROOM_NOT_EXISTS;

    const memberId = RoomMemberService.memberJoinRoom(room.roomId, {
      memberId: '',
      nickname: param.nickname,
      isRoomOwner: false,
      // room config decides member auths
      banVideo: room.banVideo,
      banAudio: room.banAudio,
      banScreen: room.banScreen
    });

    const token = encodeRoomMemberJwt(memberId);

    return {
      ...room,
      token
    };
  }

  getRoomInfo(roomId: string): RoomInfo {
    const room = RoomMapper.findRoomById(roomId);
    if (!room) throw ERR_ROOM_NOT_EXISTS;

    return room;
  }
}

const roomService = new RoomService();

export default roomService;
