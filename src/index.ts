import express, { Request } from 'express';
import SERVER_CONFIG from '../configs/server.config.json';
import cors from 'cors';
import { initRoomEventHandler, RoomController } from './controllers/room';
import { decodeRoomMemberJwt } from './services/token';
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

const isDebug = process.argv[2] === '--debug';
// log req info in debug mode
if (isDebug) {
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    if (req.method === 'GET') {
      console.log(req.query);
    } else {
      console.log(req.body);
    }
    next();
  });
}

/**
 * get memberId from jwt
 */
app.use((req: Request, res, next) => {
  const jwt = req.headers['auth'];
  if (jwt && typeof jwt === 'string') {
    const curMemberId = decodeRoomMemberJwt(jwt).sub;
    res.locals.memberId = curMemberId;
    if (isDebug) {
      console.log(`[from: ${curMemberId}]`);
    }
  }
  next();
});

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
