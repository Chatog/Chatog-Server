import { broadcastExcept } from '../socket';
import MemberService from './member';

const SYNC_TYPE = {
  SYNC_ROOM_MEMBERS: 'SYNC_ROOM_MEMBERS'
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
}

const syncService = new SyncService();

export default syncService;
