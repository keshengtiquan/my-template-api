import { Controller, Post, Body, Get, UseInterceptors, Query, DefaultValuePipe } from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { Auth } from '../auth/decorators/auth.decorators'
import { Result } from '../../common/result'
import { UserInfo } from '../../decorators/user.dectorator'
import { User } from './entities/user.entity'
import { UtcToLocalInterceptor } from '../../interceptor/utc2Local.interceptor'
import { generateParseIntPipe } from '../../utils'
import { Order } from '../../types'
import { UpdateUserDto } from './dto/update-user.dto'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/create')
  @Auth()
  async create(@Body() createUserDto: CreateUserDto, @UserInfo() userInfo: User) {
    return Result.success(await this.userService.create(createUserDto, userInfo), '添加用户成功')
  }

  /**
   * 查询用户列表
   * @param current
   * @param pageSize
   */
  @Get('/getlist')
  @Auth()
  @UseInterceptors(UtcToLocalInterceptor)
  async getlist(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('nickName') nickName: string,
    @Query('sortField', new DefaultValuePipe('createTime')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @UserInfo() userInfo: User,
  ) {
    const data = await this.userService.getList(current, pageSize, nickName, sortField, sortOrder, userInfo)
    return Result.success(data)
  }

  /**
   * 禁用用户
   * @param id
   * @param status
   */
  @Post('/forbidden')
  @Auth()
  async forbiddenUser(@Body('id') id: string, @Body('status') status: string, @UserInfo() user: User) {
    const data = await this.userService.forbidden(id, status, user)
    return Result.success(data, status === '1' ? '禁用成功' : '启用成功')
  }

  /**
   * 根据ID获取用户信息
   * @param id
   */
  @Get('/get')
  @Auth()
  async getOneById(@Query('id') id: string) {
    const data = await this.userService.getOneById(id)
    return Result.success(data)
  }

  /**
   * 更新用户
   * @param user
   * @param updateUserDto
   */
  @Post('/update')
  @Auth()
  async update(@UserInfo() userInfo: User, @Body() updateUserDto: UpdateUserDto) {
    const data = await this.userService.update(updateUserDto, userInfo)
    return Result.success(data, '用户更新成功')
  }
  /**
   * 删除用户
   * @param id
   */
  @Post('/delete')
  @Auth()
  async delete(@Body('id') id: string, @UserInfo() userInfo: User) {
    const data = await this.userService.delete(id, userInfo)
    return Result.success(data, '删除用户成功')
  }
}
