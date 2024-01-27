import { Body, Controller, DefaultValuePipe, Get, Post, Query, UseInterceptors } from '@nestjs/common'
import { ProjectLogService } from './project-log.service'
import { Auth } from '../sys/auth/decorators/auth.decorators'
import { Result } from '../common/result'
import { UserInfo } from '../decorators/user.dectorator'
import { User } from '../sys/user/entities/user.entity'
import { generateParseIntPipe } from '../utils'
import { Order } from '../types'
import { UtcToLocalInterceptor } from '../interceptor/utc2Local.interceptor'

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

  /**
   * 获取日志列表
   */
  @Get('/getLogList')
  @Auth()
  @UseInterceptors(UtcToLocalInterceptor)
  async getLogList(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('fill_date')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('DESC')) sortOrder: Order,
    @Query('fillDate') fillDate: string,
    @Query('fillUser') fillUser: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.projectLogService.getLogList(current, pageSize, sortField, sortOrder, fillDate, fillUser, userInfo),
    )
  }

  /**
   * 查询日志详细信息
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param userInfo
   */
  @Get('/getLogDetailList')
  @Auth()
  @UseInterceptors(UtcToLocalInterceptor)
  async getLogDetailList(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('serial_number')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @Query('fillDate') fillDate: string,
    @Query('logId') logId: string,
    @Query('workAreaId') workAreaId: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.projectLogService.getLogDetailList(
        current,
        pageSize,
        sortField,
        sortOrder,
        fillDate,
        logId,
        workAreaId,
        userInfo,
      ),
    )
  }

  /**
   * 保存日志
   * @param logId
   * @param workAreaId
   * @param listId
   * @param workPlace
   * @param completionQuantity
   * @param userInfo
   */
  @Post('/saveLog')
  @Auth()
  async saveLog(
    @Body('logDetailId') logDetailId: string,
    @Body('logId') logId: string,
    @Body('workPlace') workPlace: string[],
    @Body('quantity') quantity: number,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.projectLogService.saveLog(logDetailId, logId, workPlace, quantity, userInfo),
      '填写成功',
    )
  }

  /**
   * 添加清单到日志列表
   * @param logId
   * @param workAreaId
   * @param listId
   * @param userInfo
   */
  @Post('/addList')
  @Auth()
  async addList(
    @Body('logId') logId: string,
    @Body('workAreaId') workAreaId: string,
    @Body('listIds') listIds: string[],
    @UserInfo() userInfo: User,
  ) {
    return Result.success(await this.projectLogService.addList(logId, workAreaId, listIds, userInfo))
  }

  /**
   * 删除日志的清单
   * @param id 日志详细信息的ID
   * @param userInfo 当前用户
   * @returns 删除成功
   */
  @Post('/deleteList')
  @Auth()
  async deleteList(@Body('id') id: string) {
    return Result.success(await this.projectLogService.deleteList(id))
  }
}
