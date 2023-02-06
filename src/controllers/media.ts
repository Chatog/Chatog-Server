import { fail, Res, success } from '.';
import MediaService from '../services/media';
import { EventHandler, registerEventHandler } from '../socket/event-handler';

/**
 * socket api
 */
export function initMediaEventHandler() {
  const prefix = '/media';
  registerEventHandler(prefix + '/list', handleGetMediaList);
  registerEventHandler(prefix + '/allow', handleAllowMedia);
  registerEventHandler(prefix + '/ban', handleBanMedia);
}

export interface IMediaVO {
  imid: string;
  nickname: string;
  videoId: string;
  audioId: string;
}
const handleGetMediaList: EventHandler<void, Res<IMediaVO[]>> = (
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

export enum MediaType {
  MIC = 'mic',
  CAMERA = 'camera',
  SCREEN = 'screen'
}
interface MediaAuthParams {
  memberId: string;
  type: MediaType;
}
const handleAllowMedia: EventHandler<MediaAuthParams, Res<void>> = (
  socket,
  payload,
  callback
) => {
  try {
    callback(
      success(
        MediaService.allowMedia(
          socket.data.memberId!,
          payload.memberId,
          payload.type
        )
      )
    );
  } catch (e) {
    callback(fail(e));
  }
};

const handleBanMedia: EventHandler<MediaAuthParams, Res<void>> = (
  socket,
  payload,
  callback
) => {
  try {
    MediaService.banMedia(
      socket.data.memberId!,
      payload.memberId,
      payload.type
    );
    callback(success());
  } catch (e) {
    callback(fail(e));
  }
};
