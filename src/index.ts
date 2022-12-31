import express from 'express';
import SERVER_CONFIG from '../configs/server.config.json';
import cors from 'cors';
import RoomController from './controllers/room';

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
if (process.argv[2] === '--debug') {
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
 * Room
 */
app.use('/room', RoomController);

app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`app listening on http://localhost:${SERVER_CONFIG.PORT}`);
});
