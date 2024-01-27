import { Controller, DefaultValuePipe, Get, Query } from '@nestjs/common'
import { AnalyseService } from './analyse.service'
import { UserInfo } from '../decorators/user.dectorator'
import { Auth } from '../sys/auth/decorators/auth.decorators'
import { User } from '../sys/user/entities/user.entity'
import { Result } from '../common/result'
import { generateParseIntPipe } from '../utils'
import { Order } from '../types'

@Controller('analyse')
export class AnalyseController {
  constructor(private readonly analyseService: AnalyseService) {}

  /**
   * 获取指标卡数据
   * @param userInfo
   */
  @Get('/getIntroduce')
  @Auth()
  async getIntroduce(@UserInfo() userInfo: User) {
    return Result.success(await this.analyseService.getIntroduce(userInfo))
  }

  /**
   * 获取各个工点的完成清空
   * @param workPlaceType
   * @param userInfo
   */
  @Get('/getWorkPlaceOutputValue')
  @Auth()
  async getWorkPlaceOutputValue(@Query('workPlaceType') workPlaceType: string, @UserInfo() userInfo: User) {
    return Result.success(await this.analyseService.getWorkPlaceOutputValue(workPlaceType, userInfo))
  }

  /**
   * 获取工区的完成产值
   */
  @Get('/getWorkAreaOutPutValue')
  @Auth()
  async getWorkAreaOutPutValue(@Query('time') time: string[], @UserInfo() userInfo: User) {
    return Result.success(await this.analyseService.getWorkAreaOutPutValue(time, userInfo))
  }

  /**
   * 获取关注列表
   * @param userInfo
   */
  @Get('/getFocusList')
  @Auth()
  async getFocusList(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(5), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('serial_number')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(await this.analyseService.getFocusList(current, pageSize, sortField, sortOrder, userInfo))
  }

  /**
   * 获取分项占比
   * @param userInfo
   */
  @Get('/getProportion')
  @Auth()
  async getProportion(@UserInfo() userInfo: User) {
    return Result.success(await this.analyseService.getProportion(userInfo))
  }
}
