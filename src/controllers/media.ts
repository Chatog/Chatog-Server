import { fail, Res, success } from '.';
import MediaService from '../services/media';
import { EventHandler, registerEventHandler } from '../socket/event-handler';

/**
 * socket api
 */
export function initMediaEventHandler() {
  const prefix = '/media';
  registerEventHandler(prefix + '/list', handleGetMediaList);
}

export interface IMediaVO {
  imid: string;
  nickname: string;
  videoId: string;
  audioId: string;
}
const handleGetMediaList: EventHandler<Res<IMediaVO[]>> = (
  socket,
  _,
  callback
) => {
  try {
    callback(
      success(
        MediaService.getMediaList(socket.data.roomId!, socket.data.memberId!)
      )
    );
  } catch (e) {
    callback(fail(e));
  }
};
