import express from 'express';
import SERVER_CONFIG from '../configs/server.config.json';
import { HI_MSG } from './utils/constant';

const app = express();

app.get('/hi', (req, res) => {
  res.send(HI_MSG);
});

app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`app listening on http://localhost:${SERVER_CONFIG.PORT}`);
});
