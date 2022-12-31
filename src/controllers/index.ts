export interface Res<T> {
  code: number;
  msg: string;
  data: T;
}

export function success<T>(data: T): Res<T> {
  return {
    code: 0,
    msg: '',
    data
  };
}

export function fail(msg: string): Res<null> {
  return {
    code: 1,
    msg,
    data: null
  };
}
