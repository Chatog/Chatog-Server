import RoomMapper from '../data/room';
import MemberMapper from '../data/member';
import { ERR_ROOM_NOT_EXISTS, ERR_MEMBER_NOT_EXISTS } from '../utils/const';
import SyncService, { ChatMsg, ChatMsgState } from '../services/sync';
import { generateMsgId } from '../utils/common';

class ChatService {
  sendChatMsg(roomId: string, memberId: string, localMsg: ChatMsg) {
    const room = RoomMapper.findRoomById(roomId);
    if (!room) throw new Error(ERR_ROOM_NOT_EXISTS);

    const member = MemberMapper.findMemberById(memberId);
    if (!member) throw new Error(ERR_MEMBER_NOT_EXISTS);

    const msg: ChatMsg = {
      msgId: generateMsgId(memberId),
      text: localMsg.text,
      state: ChatMsgState.SUCCESS,
      time: Date.now(),
      sender: {
        memberId,
        nickname: member.nickname
      },
      localId: localMsg.msgId
    };

    SyncService.syncChatMsg(roomId, msg);
  }
}

const chatService = new ChatService();

export default chatService;
