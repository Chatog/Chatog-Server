import RoomService from '../services/room';
import { Request, Router } from 'express';
import { fail, success, Res } from './index';
import roomMemberService, { RoomMemberVO } from '../services/roomMember';

/**
 * @prefix /room
 */
const roomController = Router();

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
roomController.post<ReqCreateRoomParam, Res<RoomInfo>>(
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
roomController.post<ReqJoinRoomParam, Res<RoomInfo>>('/join', (req, res) => {
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
roomController.get(
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
roomController.get(
  '/members',
  (
    req: Request<
      { memberId: string },
      Res<RoomMemberVO[]>,
      null,
      ReqGetRoomInfoParam
    >,
    res
  ) => {
    try {
      const memberId = res.locals.memberId;
      res.send(
        success(roomMemberService.getRoomMembers(req.query.roomId, memberId))
      );
    } catch (e) {
      res.send(fail(e as string));
    }
  }
);

export default roomController;
