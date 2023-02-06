export interface MemberIMedia {
  chat: IMedia | null;
  screen: IMedia | null;
}

export interface IMedia {
  imid: string;
  videoId: string;
  audioId: string;
}

class MediaMapper {
  // memberId => (chat)IMedia, (screen)IMedia
  memberIMedias: Map<string, MemberIMedia> = new Map();
}

const mediaMapper = new MediaMapper();

export default mediaMapper;
