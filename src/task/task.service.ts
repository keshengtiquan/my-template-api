import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ProjectLogService } from '../project-log/project-log.service'
import * as dayjs from 'dayjs'

@Injectable()
export class TaskService {
  @Inject()
  private projectLogService: ProjectLogService

  @Cron(CronExpression.EVERY_DAY_AT_5PM, {
    name: 'generateLog',
    timeZone: 'Asia/Shanghai',
  })
  // @Cron(CronExpression.EVERY_10_SECONDS)
  async generateLogTask() {
    const date = dayjs(new Date()).format('YYYY-MM-DD')
    await this.projectLogService.generateLog(date)
  }
}
