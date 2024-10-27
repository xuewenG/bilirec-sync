export interface HttpResult<T> {
  code: number
  message?: string
  data?: T
}

export class ResultUtil {
  public static success<T>(data: T) {
    const result: HttpResult<T> = {
      code: 0,
      data,
    }
    return result
  }

  public static error(message: string) {
    const result: HttpResult<null> = {
      code: -1,
      message,
    }
    return result
  }
}
