import { Controller, Get } from '@nestjs/common'
import { CompletionService } from './completion.service'
import { UserInfo } from 'src/decorators/user.dectorator'
import { User } from 'src/sys/user/entities/user.entity'
import { Auth } from 'src/sys/auth/decorators/auth.decorators'
import { Result } from 'src/common/result'

@Controller('completion')
export class CompletionController {
  constructor(private readonly completionService: CompletionService) {}

  @Get('/getCompletion')
  @Auth()
  async getCompletion(@UserInfo() userInfo: User) {
    return Result.success(await this.completionService.getCompletion(userInfo))
  }
}
