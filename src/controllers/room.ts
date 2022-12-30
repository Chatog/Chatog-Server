import RoomService from '../services/room';
import { Router } from 'express';

/**
 * @prefix /room
 */
const roomController = Router();

roomController.get('/all', (req, res) => {
  res.send(RoomService.getAllRooms());
});

export default roomController;
