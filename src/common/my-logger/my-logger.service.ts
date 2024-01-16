import { Injectable } from '@nestjs/common'
import { createLogger, Logger, transport, format, transports } from 'winston'
import * as path from 'path'
export type ObjectType = Record<string, any>
import { IS_DEV } from '../../utils/index'
import * as dayjs from 'dayjs'

const transportsHandler = () => {
  const transportsList: transport[] = [
    new transports.File({
      // filename: 'logs/error-%DATE%.log',
      filename: path.join(process.cwd(), 'logs', `error-${dayjs(new Date()).format('YYYY-MM-DD')}.log`),
      dirname: 'logs',
      maxsize: 1024 * 20,
      level: 'error',
    }),
    new transports.File({
      filename: path.join(process.cwd(), 'logs', `info-${dayjs(new Date()).format('YYYY-MM-DD')}.log`),
      dirname: 'logs',
      maxsize: 1024 * 20,
      level: 'silly',
    }),
  ]
  if (IS_DEV) {
    transportsList.push(new transports.Console({}))
  }
  return transportsList
}

@Injectable()
export class MyLoggerService {
  private logger: Logger
  constructor() {
    this.logger = createLogger({
      level: 'info', // 根据环境来区分日志级别
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // 自定义输出代码格式
        format.printf(({ prefix, timestamp, message, level }) => {
          return `[${timestamp}]-【${level}】-${prefix ? `-【${prefix}】` : ''} ${message}`
        }),
      ),
      transports: transportsHandler(),
    })
  }

  // log level 0
  public error(message: string | ObjectType, prefix = ''): void {
    this.logger.error(this.toString(message), { prefix })
  }

  // log level 1
  public warn(message: string | ObjectType, prefix = ''): void {
    this.logger.warn(this.toString(message), { prefix })
  }

  // log level 2
  public info(message: string | ObjectType, prefix = ''): void {
    this.logger.info(this.toString(message), { prefix })
  }

  // log level 3
  public http(message: string | ObjectType, prefix = ''): void {
    this.logger.http(this.toString(message), { prefix })
  }

  // log level 4
  public verbose(message: string | ObjectType, prefix = ''): void {
    this.logger.verbose(this.toString(message), { prefix })
  }

  // log level 5
  public debug(message: string | ObjectType, prefix = ''): void {
    this.logger.debug(this.toString(message), { prefix })
  }

  // log level 6
  public silly(message: string | ObjectType, prefix = ''): void {
    this.logger.silly(this.toString(message), { prefix })
  }

  private toString(message: string | ObjectType): string {
    if (typeof message !== 'string') {
      return JSON.stringify(message, null, 2)
    } else {
      return message as string
    }
  }
}

// export class MyLoggerService implements LoggerService {
//   private logger: Logger
//
//   constructor(options) {
//     this.logger = createLogger(options)
//   }
//
//   log(message: string, context: string) {
//     const time = dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss')
//
//     this.logger.log('info', message, { context, time })
//   }
//
//   error(message: string, context: string) {
//     const time = dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss')
//
//     this.logger.log('info', message, { context, time })
//   }
//
//   warn(message: string, context: string) {
//     const time = dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss')
//
//     this.logger.log('info', message, { context, time })
//   }
// }
