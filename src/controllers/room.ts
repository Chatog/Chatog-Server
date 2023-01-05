import RoomService from '../services/room';
import { Request, Router } from 'express';
import { fail, success, Res } from './index';
import RoomMemberService from '../services/roomMember';
import { RoomMember } from '../data/member';
import { registerEventHandler } from '../socket/eventHandler';

/**
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

export interface ReqGetRoomInfoParam {
  roomId: string;
}
RoomController.get(
  '/info',
  (req: Request<null, Res<RoomInfo>, null, ReqGetRoomInfoParam>, res) => {
    try {
      res.send(success(RoomService.getRoomInfo(req.query.roomId)));
    } catch (e) {
      res.send(fail(e as string));
    }
  }
);

export interface ReqGetRoomMembersParam {
  roomId: string;
}
RoomController.get(
  '/members',
  (
    req: Request<
      { memberId: string },
      Res<RoomMember[]>,
      null,
      ReqGetRoomInfoParam
    >,
    res
  ) => {
    try {
      const memberId = res.locals.memberId;
      res.send(
        success(RoomMemberService.getRoomMembers(req.query.roomId, memberId))
      );
    } catch (e) {
      res.send(fail(e as string));
    }
  }
);

export interface ReqQuitRoomParam {
  roomId: string;
}
RoomController.post('/quit', (req, res) => {
  try {
    const memberId = res.locals.memberId;
    res.send(success(RoomService.quitRoom(req.body.roomId, memberId)));
  } catch (e) {
    res.send(fail(e as string));
  }
});

function initRoomEventHandler() {
  registerEventHandler(
    'roomInfo',
    (socket, data: ReqGetRoomInfoParam, callback) => {
      try {
        callback(success(RoomService.getRoomInfo(data.roomId)));
      } catch (e) {
        callback(fail(e as string));
      }
    }
  );
}

export { RoomController, initRoomEventHandler };
