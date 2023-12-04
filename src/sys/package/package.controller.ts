import { Controller, Get, Post, Body, Query, UseInterceptors, DefaultValuePipe } from '@nestjs/common'
import { PackageService } from './package.service'
import { CreatePackageDto } from './dto/create-package.dto'
import { UpdatePackageDto } from './dto/update-package.dto'
import { UserInfo } from '../../decorators/user.dectorator'
import { User } from '../user/entities/user.entity'
import { Auth } from '../auth/decorators/auth.decorators'
import { generateParseIntPipe } from '../../utils'
import { Order } from '../../types'
import { UtcToLocalInterceptor } from '../../interceptor/utc2Local.interceptor'
import { Result } from '../../common/result'

@Controller('package')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  /**
   * 创建套餐
   * @param createPackageDto
   */
  @Post('/create')
  @Auth()
  async create(@Body() createPackageDto: CreatePackageDto, @UserInfo() userInfo: User) {
    return Result.success(await this.packageService.create(createPackageDto, userInfo), '创建成功')
  }

  /**
   * 查询套餐列表
   * @param current 当前页
   * @param pageSize 每页大小
   */
  @Get('/getList')
  @UseInterceptors(UtcToLocalInterceptor)
  @Auth()
  async getList(
    @Query('packageName') packageName: string,
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current'))
    current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize'))
    pageSize: number,
    @Query('sortField', new DefaultValuePipe('createTime')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
  ) {
    return Result.success(await this.packageService.getList(current, pageSize, sortField, sortOrder, packageName))
  }

  /**
   * 根据ID查询套餐
   * @param id
   */
  @Get('/get')
  @Auth()
  async getOne(@Query('id') id: string) {
    return Result.success(await this.packageService.getOne(id))
  }

  /**
   * 更新套餐
   * @param updatePackageDto
   */
  @Post('/update')
  @Auth()
  async update(@Body() updatePackageDto: UpdatePackageDto, @UserInfo() userInfo: User) {
    return Result.success(await this.packageService.update(updatePackageDto, userInfo), '套餐更新成功')
  }

  /**
   * 删除套餐
   * @param id
   */
  @Post('/delete')
  @Auth()
  async delete(@Body('id') id: string) {
    return Result.success(await this.packageService.delete(id), '删除成功')
  }
}
