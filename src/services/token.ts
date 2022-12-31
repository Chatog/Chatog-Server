import jwtEncode from 'jwt-encode';
import jwtDecode from 'jwt-decode';

const JWT_SECRET = 'Chatog';

export interface RoomMemberJWTPayload {
  // member Id
  sub: string;
  iat: number;
  exp: number;
}

export function encodeRoomMemberJwt(memberId: string): string {
  const payload: RoomMemberJWTPayload = {
    sub: memberId,
    iat: Date.now(),
    exp: 0
  };
  // expire in 3 hours
  payload.exp = payload.iat + 1000 * 60 * 60 * 3;
  return jwtEncode(payload, JWT_SECRET);
}

export function decodeRoomMemberJwt(jwt: string): RoomMemberJWTPayload {
  return jwtDecode(jwt);
}
