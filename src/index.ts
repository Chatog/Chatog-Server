import express from 'express';
import SERVER_CONFIG from '../configs/server.config.json';
import { HI_MSG } from './utils/constant';
import cors from 'cors';

const app = express();

/* cors */
app.use(
  cors({
    origin: '*'
  })
);
/* json parse */
app.use(express.json());

app.post('/hi', (req, res) => {
  console.log(req.body);
  console.log(req.body.name);
  res.send(HI_MSG);
});

app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`app listening on http://localhost:${SERVER_CONFIG.PORT}`);
});
