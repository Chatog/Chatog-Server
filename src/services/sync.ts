import { broadcastExcept } from '../socket';
import MemberService from './member';

const SYNC_TYPE = {
  SYNC_ROOM_MEMBERS: 'SYNC_ROOM_MEMBERS',
  SYNC_MEDIA: 'SYNC_MEDIA'
};

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

  syncMedia(roomId: string, memberId: string, mediaId: string) {
    broadcastExcept(
      roomId,
      (socket) => socket.data.memberId === memberId,
      SYNC_TYPE.SYNC_MEDIA,
      {
        mediaId
      }
    );
  }
}

const syncService = new SyncService();

export default syncService;
