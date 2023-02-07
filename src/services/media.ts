import { OnProducerCallback, ProduceAuthGuard } from '../media/media-manager';
import SyncService, { MediaSyncInfo } from './sync';
import { IMediaVO, MediaType } from '../controllers/media';
import MediaMapper from '../data/media';
import { memberIdToRoomId } from '../utils/common';
import MemberMapper from '../data/member';
import {
  ERR_MEMBER_NOT_EXISTS,
  ERR_NOT_ROOM_OWNER,
  ERR_ROOM_NOT_EXISTS
} from '../utils/const';
import MediaManager from '../media';
import { getSocket } from '../socket';
import { IS_DEBUG } from '..';
import RoomMapper from '../data/room';

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

    SyncService.syncMedia(roomId, syncInfo);
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

    SyncService.syncMedia(roomId, syncInfo);
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

  allowMedia(roomOwnerId: string, memberId: string, type: MediaType) {
    // check room owner auth
    const room = RoomMapper.findRoomById(memberIdToRoomId(roomOwnerId));
    if (!room) throw new Error(ERR_ROOM_NOT_EXISTS);
    if (room.roomOwnerId !== roomOwnerId) throw new Error(ERR_NOT_ROOM_OWNER);
    // check if target member in this room
    if (room.memberIds.indexOf(memberId) < 0)
      throw new Error(ERR_MEMBER_NOT_EXISTS);
    // update member auth
    const member = MemberMapper.findMemberById(memberId);
    if (!member) throw new Error(ERR_MEMBER_NOT_EXISTS);

    switch (type) {
      case MediaType.MIC:
        member.banAudio = false;
        break;
      case MediaType.CAMERA:
        member.banVideo = false;
        break;
      case MediaType.SCREEN:
        member.banScreen = false;
        break;
    }
    MemberMapper.updateMember(member);
    // sync member info for room owner
    SyncService.syncRoomMemberFor(roomOwnerId);
  }

  async banMedia(roomOwnerId: string, memberId: string, type: MediaType) {
    // check room owner auth
    const room = RoomMapper.findRoomById(memberIdToRoomId(roomOwnerId));
    if (!room) throw new Error(ERR_ROOM_NOT_EXISTS);
    if (room.roomOwnerId !== roomOwnerId) throw new Error(ERR_NOT_ROOM_OWNER);
    // check if target member in this room
    if (room.memberIds.indexOf(memberId) < 0)
      throw new Error(ERR_MEMBER_NOT_EXISTS);
    // if already pubed, stop it
    const imedias = MediaMapper.memberIMedias.get(memberId);
    if (imedias) {
      let mediaId = '';
      switch (type) {
        case MediaType.MIC:
          mediaId = imedias.chat?.audioId || '';
          break;
        case MediaType.CAMERA:
          mediaId = imedias.chat?.videoId || '';
          break;
        case MediaType.SCREEN:
          mediaId = imedias.screen?.videoId || '';
      }
      if (mediaId !== '') {
        if (IS_DEBUG) {
          console.debug(
            `[banMedia] member[${memberId}] pubed ${type} will be stopped`
          );
        }
        const socket = await getSocket(memberId);
        if (!socket) {
          throw new Error(
            `[banMedia] cannot find socket for member[${memberId}]`
          );
        }
        MediaManager.closeProducer(socket, mediaId);
      }
    }
    // update member auth
    const member = MemberMapper.findMemberById(memberId);
    if (!member) throw new Error(ERR_MEMBER_NOT_EXISTS);
    switch (type) {
      case MediaType.MIC:
        member.banAudio = true;
        break;
      case MediaType.CAMERA:
        member.banVideo = true;
        break;
      case MediaType.SCREEN:
        member.banScreen = true;
        break;
    }
    MemberMapper.updateMember(member);
    // sync member info for room owner
    SyncService.syncRoomMemberFor(roomOwnerId);
  }

  canProduce: ProduceAuthGuard = (socket, options) => {
    const memberId = socket.data.memberId;
    const member = MemberMapper.findMemberById(memberId);
    if (member) {
      if (
        (options.appData?.type === MediaType.MIC && !member.banAudio) ||
        (options.appData?.type === MediaType.CAMERA && !member.banVideo) ||
        (options.appData?.type === MediaType.SCREEN && !member.banScreen)
      ) {
        return true;
      }
    }
    return false;
  };
}

const mediaService = new MediaService();

export default mediaService;
