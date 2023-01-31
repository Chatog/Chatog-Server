import express, { Request } from 'express';
import SERVER_CONFIG from '../configs/server.config.json';
import cors from 'cors';
import { initRoomEventHandler, RoomController } from './controllers/room';
import { createServer } from 'http';
import { initSocketIO } from './socket';

const app = express();

/* cors */
app.use(
  cors({
    origin: '*'
  })
);
/* json parse */
app.use(express.json());

export const IS_DEBUG = process.argv[2] === '--debug';
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

const httpServer = createServer(app);
initSocketIO(httpServer);

httpServer.listen(SERVER_CONFIG.PORT, () => {
  console.log(`app listening on http://localhost:${SERVER_CONFIG.PORT}`);
});
