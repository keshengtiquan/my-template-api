import { Controller, Post } from '@nestjs/common'
import { ProjectLogService } from './project-log.service'
import { Auth } from '../sys/auth/decorators/auth.decorators'
import { Result } from '../common/result'
import { UserInfo } from '../decorators/user.dectorator'
import { User } from '../sys/user/entities/user.entity'

@Controller('project-log')
export class ProjectLogController {
  constructor(private readonly projectLogService: ProjectLogService) {}

  /**
   * 自动生成日志
   */
  @Post('/generateLog')
  @Auth()
  async generateLog() {
    return Result.success(await this.projectLogService.generateLog())
  }
}
