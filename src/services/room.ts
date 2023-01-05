import {
  ReqCreateRoomParam,
  ReqJoinRoomParam,
  RoomInfo
} from '../controllers/room';
import { generateRoomId } from '../utils/common';
import { ERR_MEMBER_NOT_EXISTS, ERR_ROOM_NOT_EXISTS } from '../utils/const';
import { encodeRoomMemberJwt } from './token';
import RoomMemberService from './roomMember';
import RoomMapper, { Room } from '../data/room';
import RoomMemberMapper from '../data/roomMember';
import MemberMapper from '../data/member';

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

    const memberId = RoomMemberService.newMemberJoinRoom(roomId, {
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

    const memberId = RoomMemberService.newMemberJoinRoom(room.roomId, {
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

  quitRoom(roomId: string, memberId: string) {
    const memberIds = RoomMemberMapper.findMemberIdsByRoomId(roomId);
    if (!memberIds) throw ERR_ROOM_NOT_EXISTS;

    const memberIndex = memberIds.indexOf(memberId);
    const member = MemberMapper.findMemberById(memberId);
    if (memberIndex === -1 || !member) throw ERR_MEMBER_NOT_EXISTS;

    MemberMapper.deleteMember(memberId);
    // @TODO release webrtc connections

    // just member quit, no need to delete members and room
    if (!member.isRoomOwner) {
      memberIds.splice(memberIndex, 1);
      RoomMemberMapper.updateRoomMembers(roomId, memberIds);
      return;
    }

    RoomMemberMapper.deleteRoomMembers(roomId);
    RoomMapper.deleteRoom(roomId);
  }
}

const roomService = new RoomService();

export default roomService;
