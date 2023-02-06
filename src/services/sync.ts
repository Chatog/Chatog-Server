import { broadcastExcept } from '../socket';
import MemberService from './member';

const SYNC_TYPE = {
  SYNC_ROOM_MEMBERS: 'SYNC_ROOM_MEMBERS',
  SYNC_MEDIA: 'SYNC_MEDIA'
};

export interface MediaSyncInfo {
  type: 'add' | 'remove';
  imid: string;
  nickname?: string;
  audioId?: string;
  videoId?: string;
}

class SyncService {
  syncRoomMembers(roomId: string, memberId: string) {
    broadcastExcept(
      roomId,
      (socket) => socket.data.memberId === memberId,
      SYNC_TYPE.SYNC_ROOM_MEMBERS,
      (socket) =>
        MemberService.getRoomMembers(socket.data.roomId, socket.data.memberId)
    );
  }

  syncMedia(roomId: string, memberId: string, info: MediaSyncInfo) {
    broadcastExcept(
      roomId,
      (socket) => socket.data.memberId === memberId,
      SYNC_TYPE.SYNC_MEDIA,
      info
    );
  }
}

const syncService = new SyncService();

export default syncService;
