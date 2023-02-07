import { broadcastExcept, getSocket } from '../socket';
import MemberService from './member';

const SYNC_TYPE = {
  SYNC_ROOM_MEMBERS: 'SYNC_ROOM_MEMBERS',
  SYNC_MEDIA: 'SYNC_MEDIA',
  SYNC_CHAT_MSG: 'SYNC_CHAT_MSG'
};

export interface MediaSyncInfo {
  type: 'add' | 'remove';
  imid: string;
  nickname?: string;
  audioId?: string;
  videoId?: string;
}

export enum ChatMsgState {
  SENDING,
  SUCCESS,
  FAIL
}
export interface ChatMsg {
  msgId: string;
  text: string;
  state: ChatMsgState;
  time: number;
  sender: {
    memberId: string;
    nickname: string;
  };
  localId: string;
}

class SyncService {
  /**
   * @param memberId except member
   */
  syncRoomMembers(roomId: string, memberId: string) {
    broadcastExcept(
      roomId,
      (socket) => socket.data.memberId === memberId,
      SYNC_TYPE.SYNC_ROOM_MEMBERS,
      (socket) =>
        MemberService.getRoomMembers(socket.data.roomId, socket.data.memberId)
    );
  }
  /**
   * @param memberId the only sync member
   */
  async syncRoomMemberFor(memberId: string) {
    const socket = await getSocket(memberId);
    if (socket) {
      socket.emit(
        SYNC_TYPE.SYNC_ROOM_MEMBERS,
        MemberService.getRoomMembers(socket.data.roomId!, socket.data.memberId!)
      );
    }
  }

  syncMedia(roomId: string, info: MediaSyncInfo) {
    broadcastExcept(
      roomId,
      // sync to pub side too for promising local state
      // use when ban media stop pub
      () => false,
      SYNC_TYPE.SYNC_MEDIA,
      info
    );
  }

  syncChatMsg(roomId: string, msg: ChatMsg) {
    broadcastExcept(roomId, () => false, SYNC_TYPE.SYNC_CHAT_MSG, msg);
  }
}

const syncService = new SyncService();

export default syncService;
