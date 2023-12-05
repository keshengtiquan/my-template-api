import { Controller, Post, Body, Get, UseInterceptors, Query } from '@nestjs/common'
import { DeptService } from './dept.service'
import { CreateDeptDto } from './dto/create-dept.dto'
import { User } from '../user/entities/user.entity'
import { UserInfo } from '../../decorators/user.dectorator'
import { Result } from '../../common/result'
import { Auth } from '../auth/decorators/auth.decorators'
import { UtcToLocalInterceptor } from '../../interceptor/utc2Local.interceptor'
import { UpdateDeptDto } from './dto/update-dept.dto'

@Controller('dept')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  /**
   * 创建部门
   * @param createDeptDto
   */
  @Post('/create')
  @Auth()
  async create(@Body() createDeptDto: CreateDeptDto, @UserInfo() userInfo: User) {
    const data = this.deptService.create(createDeptDto, userInfo)
    return Result.success(data, '创建部门成功')
  }

  /**
   * 查询部门列表
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   */
  @Get('/getlist')
  @UseInterceptors(UtcToLocalInterceptor)
  @Auth()
  async getList(@UserInfo() userInfo: User) {
    const data = await this.deptService.getlist(userInfo)
    return Result.success(data)
  }

  /**
   * 禁用部门
   * @param id 角色id
   * @param status 1启用 0 禁用
   */
  @Post('/forbidden')
  @Auth()
  async forbidden(@Body('id') id: string, @Body('status') status: string) {
    const data = await this.deptService.forbidden(id, status)
    return Result.success(data, status === '1' ? '禁用成功' : '启用成功')
  }

  /**
   * 根据ID查询部门
   * @param id
   */
  @Get('/get')
  @Auth()
  async getOneById(@Query('id') id: string) {
    const data = await this.deptService.getOneById(id)
    return Result.success(data)
  }

  /**
   * 更新部门
   * @param updateDeptDto
   */
  @Post('/update')
  @Auth()
  async update(@Body() updateDeptDto: UpdateDeptDto, @UserInfo() userInfo: User) {
    const data = await this.deptService.update(updateDeptDto, userInfo)
    return Result.success(data, '更新部门成功')
  }

  /**
   * 删除部门
   * @param id
   */
  @Post('/delete')
  @Auth()
  async delete(@Body('id') id: string) {
    const data = await this.deptService.delete(id)
    return Result.success(data, '删除部门成功')
  }
}
