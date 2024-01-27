import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ProjectLogService } from '../project-log/project-log.service'

@Injectable()
export class TaskService {
  @Inject()
  private projectLogService: ProjectLogService

  @Cron(CronExpression.EVERY_DAY_AT_5PM, {
    name: 'generateLog',
    timeZone: 'Asia/Shanghai',
  })
  async generateLogTask() {
    await this.projectLogService.generateLog()
  }
}
