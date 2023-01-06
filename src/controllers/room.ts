import RoomService from '../services/room';
import { Request, Router } from 'express';
import { fail, success, Res } from './index';
import RoomMemberService from '../services/roomMember';
import { RoomMember } from '../data/member';
import { EventHandler, registerEventHandler } from '../socket/eventHandler';

/**
 * http api
 * @prefix /room
 */
const RoomController = Router();

export interface ReqCreateRoomParam {
  nickname: string;
  roomName: string;
  banVideo: boolean;
  banAudio: boolean;
  banScreen: boolean;
  banChat: boolean;
}
export interface RoomInfo {
  roomId: string;
  roomName: string;
  roomStartTime: number;
}
RoomController.post<ReqCreateRoomParam, Res<RoomInfo>>(
  '/create',
  (req, res) => {
    try {
      const roomInfoWithToken = RoomService.createRoom(req.body);
      res.setHeader('set-auth', roomInfoWithToken.token);
      res.send(success(roomInfoWithToken));
    } catch (e) {
      res.send(fail(e as string));
    }
  }
);

export interface ReqJoinRoomParam {
  nickname: string;
  roomNumber: string;
}
RoomController.post<ReqJoinRoomParam, Res<RoomInfo>>('/join', (req, res) => {
  try {
    const roomInfoWithToken = RoomService.joinRoom(req.body);
    res.setHeader('set-auth', roomInfoWithToken.token);
    res.send(success(roomInfoWithToken));
  } catch (e) {
    res.send(fail(e as string));
  }
});

/**
 * socket api
 */
function initRoomEventHandler() {
  registerEventHandler('/room/info', handleGetRoomInfo);
  registerEventHandler('/room/members', handleGetRoomMembers);
  registerEventHandler('/room/quit', handleQuitRoom);
}

const handleGetRoomInfo: EventHandler<void> = (socket, _, callback) => {
  try {
    callback(success(RoomService.getRoomInfo(socket.data.roomId!)));
  } catch (e) {
    callback(fail(e as string));
  }
};

const handleGetRoomMembers: EventHandler<void> = (socket, _, callback) => {
  try {
    callback(
      success(
        RoomMemberService.getRoomMembers(
          socket.data.roomId!,
          socket.data.memberId!
        )
      )
    );
  } catch (e) {
    callback(fail(e as string));
  }
};

const handleQuitRoom: EventHandler<void> = (socket, _, callback) => {
  try {
    callback(
      success(RoomService.quitRoom(socket.data.roomId!, socket.data.memberId!))
    );
  } catch (e) {
    callback(fail(e as string));
  }
};

export { RoomController, initRoomEventHandler };
