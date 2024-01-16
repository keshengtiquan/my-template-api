import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule'
import { ProjectLogService } from '../project-log/project-log.service'

@Injectable()
export class TaskService {
  @Inject()
  private projectLogService: ProjectLogService
  constructor(protected schedulerRegistry: SchedulerRegistry) {}
}
