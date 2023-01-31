import io from '../socket';
import MemberService from './member';

const SYNC_TYPE = {
  SYNC_ROOM_MEMBERS: 'SYNC_ROOM_MEMBERS'
};

class SyncService {
  syncRoomMembers(roomId: string, memberId: string) {
    io()
      ?.in(roomId)
      .fetchSockets()
      .then((sockets) => {
        for (const socket of sockets) {
          if (socket.data.memberId === memberId) continue;
          socket.emit(
            SYNC_TYPE.SYNC_ROOM_MEMBERS,
            MemberService.getRoomMembers(
              socket.data.roomId,
              socket.data.memberId
            )
          );
        }
      });
  }
}

const syncService = new SyncService();

export default syncService;
