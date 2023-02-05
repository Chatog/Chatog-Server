import { OnProducerCallback } from '../media/media-manager';
import SyncService from './sync';

class MediaService {
  onMediaPub: OnProducerCallback = (socket, { producerId }) => {
    SyncService.syncMedia(socket.data.roomId, socket.data.memberId, producerId);
  };
}

const mediaService = new MediaService();

export default mediaService;
