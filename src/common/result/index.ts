export class Result<T> {
  code: number | null // 1 for success, 0 or other numbers for failure
  message: string | null // error message
  data: T | null // data

  private constructor() {
    this.code = null
    this.message = null
    this.data = null
  }

  static success<T>(data: T, message?: string): Result<T> {
    const result = new Result<T>()
    result.data = data
    result.code = 200
    result.message = message || 'ok'
    return result
  }

  static error<T>(msg: string): Result<T> {
    const result = new Result<T>()
    result.message = msg
    result.code = 0
    return result
  }
}
