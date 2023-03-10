import express from 'express';
import SERVER_CONFIG from '../configs/server.config.json';
import cors from 'cors';
import { initRoomEventHandler, RoomController } from './controllers/room';
import { initMediaEventHandler } from './controllers/media';
import { initChatEventHandler } from './controllers/chat';
import { createServer } from 'https';
import { initSocketIO } from './socket';
import MediaManager from './media';
import MediaService from './services/media';
import fs from 'node:fs';
import path from 'node:path';

export const IS_DEBUG = process.argv[2] === '--debug';

const app = express();

/* cors */
app.use(
  cors({
    origin: '*'
  })
);
/* json parse */
app.use(express.json());

// log req info in debug mode
if (IS_DEBUG) {
  app.use((req, _, next) => {
    console.log(`[HTTP Request] ${req.method} ${req.path}`);
    if (req.method === 'GET') {
      console.log(req.query);
    } else {
      console.log(req.body);
    }
    next();
  });
}

/**
 * Room
 */
app.use('/room', RoomController);
initRoomEventHandler();
/**
 * Media
 */
initMediaEventHandler();
/**
 * Chat
 */
initChatEventHandler();

const httpsServer = createServer(
  {
    cert: fs.readFileSync(path.resolve(__dirname, './cert/cert.pem')),
    key: fs.readFileSync(path.resolve(__dirname, './cert/key.pem'))
  },
  app
);
// init socket
const socketServer = initSocketIO(httpsServer);
// init media manager
MediaManager.init(
  socketServer,
  MediaService.onMediaPub,
  MediaService.onMediaUnpub,
  MediaService.canProduce
);

httpsServer.listen(SERVER_CONFIG.PORT, () => {
  console.log(
    `[index.ts] app listening on https://localhost:${SERVER_CONFIG.PORT}`
  );
});
