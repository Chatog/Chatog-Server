import express from 'express';
import SERVER_CONFIG from '../configs/server.config.json';
import cors from 'cors';
import RoomController from './controllers/room';

const app = express();

// log req info in debug mode
if (process.argv[2] === '--debug') {
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    if (req.body) {
      console.log(req.body);
    }
    next();
  });
}

/* cors */
app.use(
  cors({
    origin: '*'
  })
);
/* json parse */
app.use(express.json());

/**
 * Room
 */
app.use('/room', RoomController);

app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`app listening on http://localhost:${SERVER_CONFIG.PORT}`);
});
