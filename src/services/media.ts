import { OnProducerCallback } from '../media/media-manager';
import SyncService, { MediaSyncInfo } from './sync';
import { IMediaVO } from '../controllers/media';
import MediaMapper from '../data/media';
import { memberIdToRoomId } from '../utils/common';
import MemberMapper from '../data/member';
import { ERR_MEMBER_NOT_EXISTS } from '../utils/const';

class MediaService {
  onMediaPub: OnProducerCallback = (socket, producer) => {
    console.log(
      `[onMediaPub] member[${socket.data.memberId}] producer[${producer.id}]`
    );

    const roomId = socket.data.roomId;
    const memberId = socket.data.memberId;

    if (!MediaMapper.memberIMedias.has(memberId)) {
      MediaMapper.memberIMedias.set(memberId, {
        chat: null,
        screen: null
      });
    }
    const syncInfo: MediaSyncInfo = {
      imid: '',
      type: 'add'
    };
    // imedia[chat]
    if (producer.appData.type === 'camera' || producer.appData.type === 'mic') {
      const imedias = MediaMapper.memberIMedias.get(memberId)!;
      // init this imedia
      if (!imedias.chat) {
        imedias.chat = {
          imid: memberId + '@' + 'chat',
          videoId: '',
          audioId: ''
        };
        // only init imedia need to pass nickname, further update not
        const member = MemberMapper.findMemberById(memberId);
        if (!member) throw new Error(ERR_MEMBER_NOT_EXISTS);
        syncInfo.nickname = member.nickname;
      }
      // set imid
      syncInfo.imid = imedias.chat.imid;
      // camera
      if (producer.appData.type === 'camera') {
        imedias.chat.videoId = producer.id;
        syncInfo.videoId = producer.id;
      }
      // mic
      else if (producer.appData.type === 'mic') {
        imedias.chat.audioId = producer.id;
        syncInfo.audioId = producer.id;
      }
    }
    // imedia[screen]
    else if (producer.appData.type === 'screen') {
      const imedias = MediaMapper.memberIMedias.get(memberId)!;
      // init this imedia
      if (!imedias.screen) {
        imedias.screen = {
          imid: memberId + '@' + 'screen',
          videoId: '',
          audioId: ''
        };
        // only init imedia need to pass nickname, further update not
        const member = MemberMapper.findMemberById(memberId);
        if (!member) throw new Error(ERR_MEMBER_NOT_EXISTS);
        syncInfo.nickname = member.nickname;
      }
      syncInfo.imid = imedias.screen.imid;
      imedias.screen.videoId = producer.id;
      syncInfo.videoId = producer.id;
    } else {
      console.error('[onMediaPub] unknown producer');
      return;
    }

    SyncService.syncMedia(roomId, memberId, syncInfo);
  };

  onMediaUnpub: OnProducerCallback = (socket, producer) => {
    console.log(
      `[onMediaUnpub] member[${socket.data.memberId}] producer[${producer.id}]`
    );

    const roomId = socket.data.roomId;
    const memberId = socket.data.memberId;

    const imedias = MediaMapper.memberIMedias.get(memberId);
    if (!imedias) {
      console.error(`[onMediaUnpub] no imedias for member[${memberId}]`);
      return;
    }

    const syncInfo: MediaSyncInfo = {
      imid: '',
      type: 'remove'
    };

    // imedia[chat]
    if (producer.appData.type === 'camera' || producer.appData.type === 'mic') {
      if (!imedias.chat) {
        console.error(`[onMediaUnpub] no member[${memberId}].chat`);
        return;
      }
      // set imid
      syncInfo.imid = imedias.chat.imid;
      // camera
      if (producer.appData.type === 'camera') {
        imedias.chat.videoId = '';
        syncInfo.videoId = producer.id;
      }
      // mic
      else if (producer.appData.type === 'mic') {
        imedias.chat.audioId = '';
        syncInfo.audioId = producer.id;
      }
      // if both media stop, delete imedia
      if (imedias.chat.videoId === '' && imedias.chat.audioId === '') {
        imedias.chat = null;
      }
    }
    // imedia[screen]
    else if (producer.appData.type === 'screen') {
      if (!imedias.screen) {
        console.error(`[onMediaUnpub] no member[${memberId}].screen`);
        return;
      }
      // set imid
      syncInfo.imid = imedias.screen.imid;
      syncInfo.videoId = producer.id;

      imedias.screen = null;
    } else {
      console.error('[onMediaUnpub] unknown producer');
      return;
    }
    // if no imedia, delete memberIMedia
    if (imedias.chat === null && imedias.screen === null) {
      MediaMapper.memberIMedias.delete(memberId);
    }

    SyncService.syncMedia(roomId, memberId, syncInfo);
  };

  getMediaList(roomId: string, memberId: string): IMediaVO[] {
    const ret: IMediaVO[] = [];
    MediaMapper.memberIMedias.forEach((mim, mid) => {
      if (mid !== memberId && memberIdToRoomId(mid) === roomId) {
        const member = MemberMapper.findMemberById(mid);
        if (!member) throw new Error(ERR_MEMBER_NOT_EXISTS);
        mim.chat &&
          ret.push({
            ...mim.chat,
            nickname: member.nickname
          });
        mim.screen &&
          ret.push({
            ...mim.screen,
            nickname: member.nickname
          });
      }
    });
    return ret;
  }
}

const mediaService = new MediaService();

export default mediaService;
