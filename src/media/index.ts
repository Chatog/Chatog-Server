import { MediaManagerServer } from './media-manager';
import { IS_DEBUG } from '..';

const mediaManager = new MediaManagerServer(IS_DEBUG);

export default mediaManager;
