import { Controller, Get, Post, Body, Query, DefaultValuePipe } from '@nestjs/common'
import { IssuedService } from './issued.service'
import { CreateIssuedDto } from './dto/create-issued.dto'
import { Auth } from '../../sys/auth/decorators/auth.decorators'
import { Result } from '../../common/result'
import { UserInfo } from '../../decorators/user.dectorator'
import { User } from '../../sys/user/entities/user.entity'
import { generateParseIntPipe } from '../../utils'
import { Order } from '../../types'

@Controller('issued')
export class IssuedController {
  constructor(private readonly issuedService: IssuedService) {}

  /**
   * 查询是否有重复的计划
   * @param createIssuedDto
   * @param userInfo
   */
  @Get('/hasRepeat')
  @Auth()
  async hasRepeat(@Query() createIssuedDto: CreateIssuedDto, @UserInfo() userInfo: User) {
    return Result.success(await this.issuedService.hasRepeat(createIssuedDto, userInfo))
  }
  /**
   * 生成计划
   * @param createIssuedDto
   */
  @Post('/generatePlan')
  @Auth()
  async generatePlan(@Body() createIssuedDto: CreateIssuedDto, @UserInfo() userInfo: User) {
    return Result.success(await this.issuedService.generatePlan(createIssuedDto, userInfo))
  }

  /**
   * 查询计划列表
   * @param createIssuedDto
   * @param userInfo
   */
  @Get('/getPlanList')
  @Auth()
  async getPlanList(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('year')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('DESC')) sortOrder: Order,
    @Query('planType') planType: string,
    @Query('planName') planName: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.issuedService.getPlanList(current, pageSize, sortField, sortOrder, planType, planName, userInfo),
    )
  }

  /**
   * 查询计划详情
   * @constructor
   */
  @Get('/getPlanDetail')
  @Auth()
  async getPlanDetail(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('serial_number')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @Query('planName') planName: string,
    @Query('listCode') listCode: string,
    @Query('listName') listName: string,
    @Query('listCharacteristic') listCharacteristic: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.issuedService.getPlanDetail(
        current,
        pageSize,
        sortField,
        sortOrder,
        planName,
        listCode,
        listName,
        listCharacteristic,
        userInfo,
      ),
      '获取计划详情列表成功',
    )
  }

  /**
   * 更新计划详情
   * @param listId
   * @param workAreaId
   * @param workAreaQuantities
   * @param planName
   * @param userInfo
   */
  @Post('/updatePlanDetail')
  @Auth()
  async updatePlanDetail(
    @Body('listId') listId: string,
    @Body('planQuantities') planQuantities: Record<string, number>,
    @Body('planName') planName: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.issuedService.updatePlanDetail(listId, planQuantities, planName, userInfo),
      '更新计划详情成功',
    )
  }

  /**
   * 删除计划详情
   * @param planName
   * @param listId
   * @param userInfo
   */
  @Post('/deletePlanDetail')
  @Auth()
  async deletePlanDetail(
    @Body('planName') planName: string,
    @Body('listId') listId: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(await this.issuedService.deletePlanDetail(planName, listId, userInfo), '删除计划详情成功')
  }

  /**
   * 添加计划详情
   * @param listIds
   * @param planName
   */
  @Post('/addList')
  @Auth()
  async addList(@Body('listIds') listIds: string[], @Body('planName') planName: string, @UserInfo() userInfo: User) {
    return Result.success(await this.issuedService.addList(listIds, planName, userInfo), '添加计划详情成功')
  }
}
