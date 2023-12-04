import { Controller, Get, Post, Body, Query, UseInterceptors, DefaultValuePipe } from '@nestjs/common'
import { TenantService } from './tenant.service'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { UpdateTenantDto } from './dto/update-tenant.dto'
import { Auth } from '../auth/decorators/auth.decorators'
import { UserInfo } from '../../decorators/user.dectorator'
import { User } from '../user/entities/user.entity'
import { UtcToLocalInterceptor } from '../../interceptor/utc2Local.interceptor'
import { generateParseIntPipe } from '../../utils'
import { Order } from '../../types'
import { Result } from '../../common/result'

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * 创建租户
   * @param createTenantDto
   */
  @Post('/create')
  @Auth()
  async create(@Body() createTenantDto: CreateTenantDto, @UserInfo() userInfo: User) {
    return Result.success(await this.tenantService.create(createTenantDto, userInfo), '创建租户成功')
  }

  /**
   * 查询租户列表
   * @param findTenantDto
   */
  @Get('/getlist')
  @UseInterceptors(UtcToLocalInterceptor)
  @Auth()
  async getList(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('createTime')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @Query('companyName') companyName: string,
    @Query('status') status: string,
    @Query('contactUserName') contactUserName: string,
    @UserInfo('tenantId') tenantId: string,
  ) {
    const data = await this.tenantService.findList(
      current,
      pageSize,
      sortField,
      sortOrder,
      tenantId,
      companyName,
      status,
      contactUserName,
    )
    return Result.success(data, '查询租户列表成功')
  }

  /**
   * 禁用租户
   * @param id 租户id
   * @param status 1启用 0 禁用
   */
  @Post('/forbidden')
  @Auth()
  async forbiddenTenant(@Body('id') id: string, @Body('status') status: string) {
    const data = await this.tenantService.forbidden(id, status)
    return Result.success(data, status === '1' ? '启用成功' : '禁用成功')
  }
  /**
   * 查询租户
   * @param id 租户ID
   */
  @Get('/get')
  @Auth()
  async getOne(@Query('id', generateParseIntPipe('id')) id: string) {
    const data = await this.tenantService.getOne(id)
    return Result.success(data)
  }

  /**
   * 更新租户
   * @param updateTenantDto
   */
  @Post('/update')
  @Auth()
  async updateTenant(@Body() updateTenantDto: UpdateTenantDto, @UserInfo() userInfo: User) {
    const data = await this.tenantService.updateTenant(updateTenantDto, userInfo)
    return Result.success(data, '更新租户成功')
  }
  /**
   * 删除租户
   * @param id
   */
  @Post('/delete')
  @Auth()
  async deleteTenant(@Body('id') id: string) {
    const data = await this.tenantService.deleteTenant(id)
    return Result.success(data, '删除租户成功')
  }
}
