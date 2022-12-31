import RoomService from '../services/room';
import { Request, Router } from 'express';
import { fail, success, Res } from './index';

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
roomController.post<ReqCreateRoomParam>('/create', (req, res) => {
  try {
    const roomInfoWithToken = RoomService.createRoom(req.body);
    res.setHeader('set-auth', roomInfoWithToken.token);
    res.send(success(roomInfoWithToken));
  } catch (e) {
    res.send(fail(e as string));
  }
});

export interface ReqJoinRoomParam {
  nickname: string;
  roomNumber: string;
}
roomController.post<ReqJoinRoomParam>('/join', (req, res) => {
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
  (req: Request<null, any, null, ReqGetRoomInfoParam>, res) => {
    try {
      res.send(success(RoomService.getRoomInfo(req.query.roomId)));
    } catch (e) {
      res.send(fail(e as string));
    }
  }
);

export default roomController;
