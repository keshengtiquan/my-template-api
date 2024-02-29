import { Controller, DefaultValuePipe, Get, Query } from '@nestjs/common'
import { CompletionService } from './completion.service'
import { UserInfo } from 'src/decorators/user.dectorator'
import { User } from 'src/sys/user/entities/user.entity'
import { Auth } from 'src/sys/auth/decorators/auth.decorators'
import { Result } from 'src/common/result'
import { generateParseIntPipe } from 'src/utils'
import { Order } from 'src/types'

@Controller('completion')
export class CompletionController {
  constructor(private readonly completionService: CompletionService) {}

  @Get('/getCompletion')
  @Auth()
  async getCompletion(@UserInfo() userInfo: User) {
    return Result.success(await this.completionService.getCompletion(userInfo))
  }

  @Get('/getCompletionStatus')
  @Auth()
  async getCompletionStatus(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('create_time')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @Query('serialNumber') serialNumber: string,
    @Query('listName') listName: string,
    @Query('listCharacteristic') listCharacteristic: string,
    @Query('sectionalEntry') sectionalEntry: string,
    @Query('completeStatus') completeStatus: string[],
    @Query('status') status: string[],
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.completionService.getCompletionStatus(
        current,
        pageSize,
        sortField,
        sortOrder,
        serialNumber,
        listName,
        listCharacteristic,
        sectionalEntry,
        completeStatus,
        status,
        userInfo,
      ),
    )
  }
}
