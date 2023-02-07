import { fail, Res, success } from '.';
import ChatService from '../services/chat';
import SyncService, { ChatMsg, ChatMsgState } from '../services/sync';
import { EventHandler, registerEventHandler } from '../socket/event-handler';

/**
 * socket api
 */
export function initChatEventHandler() {
  const prefix = '/chat';
  registerEventHandler(prefix + '/send', handleSendChatMsg);
}

const handleSendChatMsg: EventHandler<ChatMsg, Res<void>> = (
  socket,
  msg,
  callback
) => {
  try {
    ChatService.sendChatMsg(socket.data.roomId!, socket.data.memberId!, msg);
    callback(success());
  } catch (e) {
    SyncService.syncChatMsg(socket.data.roomId!, {
      ...msg,
      state: ChatMsgState.FAIL
    });
    callback(fail(e));
  }
};
