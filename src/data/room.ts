export interface Room {
  roomId: string;
  roomName: string;
  roomStartTime: number;
  banVideo: boolean;
  banAudio: boolean;
  banScreen: boolean;
  banChat: boolean;
}

class RoomMapper {
  // [roomId]: Room
  rooms: Map<string, Room> = new Map();

  findRoomById(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  updateRoom(room: Room) {
    this.rooms.set(room.roomId, room);
  }

  deleteRoom(roomId: string) {
    this.rooms.delete(roomId);
  }
}

const roomMapper = new RoomMapper();

export default roomMapper;
