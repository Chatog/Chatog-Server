export enum ResCode {
  SUCCESS = 0,
  ERROR_MSG = 1
}

export interface Res<T> {
  code: ResCode;
  msg: string;
  data: T;
}

export function success<T>(data: T): Res<T> {
  return {
    code: ResCode.SUCCESS,
    msg: '',
    data
  };
}

export function fail(err: any): Res<any> {
  console.error(err);
  return {
    code: ResCode.ERROR_MSG,
    msg: err.message,
    data: null
  };
}
