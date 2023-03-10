import RoomService from '../services/room';
import { Router } from 'express';
import { fail, success, Res } from './index';
import RoomMemberService from '../services/member';
import { RoomMember } from '../data/member';
import { EventHandler, registerEventHandler } from '../socket/event-handler';
import MediaManager from '../media';
import { memberIdToRoomId } from '../utils/common';

/**
 * http api
 * @prefix /room
 */
const RoomController = Router();

// create room
export interface ReqCreateRoomParam {
  nickname: string;
  roomName: string;
  banVideo: boolean;
  banAudio: boolean;
  banScreen: boolean;
  banChat: boolean;
}
RoomController.post<any, any, any, ReqCreateRoomParam, Res<string>>(
  '/create',
  async (req, res) => {
    try {
      const memberId = RoomService.createRoom(req.body);

      // need to create a router for each room
      await MediaManager.createRouter(memberIdToRoomId(memberId));

      res.send(success(memberId));
    } catch (e) {
      res.send(fail(e));
    }
  }
);

// join room
export interface ReqJoinRoomParam {
  nickname: string;
  roomNumber: string;
}
RoomController.post<any, any, any, ReqJoinRoomParam, Res<string>>(
  '/join',
  (req, res) => {
    try {
      const memberId = RoomService.joinRoom(req.body);
      res.send(success(memberId));
    } catch (e) {
      res.send(fail(e));
    }
  }
);

/**
 * socket api
 */
function initRoomEventHandler() {
  const prefix = '/room';
  registerEventHandler(prefix + '/info', handleGetRoomInfo);
  registerEventHandler(prefix + '/members', handleGetRoomMembers);
  registerEventHandler(prefix + '/quit', handleQuitRoom);
}

// get room info
export interface RoomInfo {
  roomId: string;
  roomName: string;
  roomStartTime: number;
  roomOwnerId: string;
  banChat: boolean;
}
const handleGetRoomInfo: EventHandler<void, Res<RoomInfo>> = (
  socket,
  _,
  callback
) => {
  try {
    callback(success(RoomService.getRoomInfo(socket.data.roomId!)));
  } catch (e) {
    callback(fail(e));
  }
};

export interface RoomMemberVO extends RoomMember {
  isRoomOwner: boolean;
}
// get room members
const handleGetRoomMembers: EventHandler<void, Res<RoomMemberVO[]>> = (
  socket,
  _,
  callback
) => {
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
    callback(fail(e));
  }
};

// quit room
const handleQuitRoom: EventHandler<void, Res<void>> = (socket, _, callback) => {
  try {
    RoomService.quitRoom(socket.data.roomId!, socket.data.memberId!);
    callback(success());
  } catch (e) {
    callback(fail(e));
  }
};

export { RoomController, initRoomEventHandler };
