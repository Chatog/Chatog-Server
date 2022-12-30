export interface Room {
  roomId: string;
  roomName: string;
  roomStartTime: number;
}

class RoomService {
  rooms: Room[] = [];

  getAllRooms(): Room[] {
    return this.rooms;
  }
}

const roomService = new RoomService();

export default roomService;
