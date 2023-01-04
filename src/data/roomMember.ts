class RoomMemberMapper {
  // [roomId]: [ memberId ]
  roomMembers: Map<string, string[]> = new Map();

  findMemberIdsByRoomId(roomId: string): string[] | undefined {
    return this.roomMembers.get(roomId);
  }

  updateRoomMembers(roomId: string, memberIds: string[]) {
    this.roomMembers.set(roomId, memberIds);
  }

  deleteRoomMembers(roomId: string) {
    this.roomMembers.delete(roomId);
  }
}

const roomMemberMapper = new RoomMemberMapper();

export default roomMemberMapper;
