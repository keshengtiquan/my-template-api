import { Inject, Injectable, Scope } from '@nestjs/common'
import { MyLoggerService } from '../common/my-logger/my-logger.service'
import { InjectRepository } from '@nestjs/typeorm'
import { ProjectLog } from './entities/project-log.entity'
import { Repository } from 'typeorm'
import { ProjectLogDetail } from './entities/project-log-detail.entity'

@Injectable()
export class ProjectLogService {
  @Inject()
  private loggerService: MyLoggerService

  @InjectRepository(ProjectLog)
  private readonly projectLogRepository: Repository<ProjectLog>
  @InjectRepository(ProjectLogDetail)
  private readonly projectLogDetailRepository: Repository<ProjectLogDetail>

  /**
   * 自动生成日志
   */
  async generateLog() {
    // const projectLog = new ProjectLog()
    // projectLog.fillDate = dayjs(new Date()).format('YYYY-MM-DD')
    // projectLog.createBy = userInfo.userName
    // projectLog.updateBy = userInfo.userName
    // projectLog.tenantId = userInfo.tenantId
    // projectLog.createDept = userInfo.createDept
    try {
      // await this.projectLogRepository.save(projectLog)
    } catch (e) {
      this.loggerService.error(`生成日志失败【${e.message}】`, ProjectLog.name)
    }
  }
}
