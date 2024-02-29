import { Controller, Post, Body, DefaultValuePipe, Get, Query, UseInterceptors } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { Auth } from '../auth/decorators/auth.decorators';
import { Result } from '../../common/result';
import { UserInfo } from '../../decorators/user.dectorator';
import { User } from '../user/entities/user.entity';
import { generateParseIntPipe } from '../../utils';
import { UtcToLocalInterceptor } from '../../interceptor/utc2Local.interceptor';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('/create')
  @Auth()
  async create(@Body() createRoleDto: CreateRoleDto, @UserInfo() userInfo: User) {
    return Result.success(await this.roleService.create(createRoleDto, userInfo), '角色创建成功');
  }

  /**
   * 获取角色列表
   * @param current 当前页码
   * @param pageSize 页码大小
   */
  @Get('/getlist')
  @Auth()
  @UseInterceptors(UtcToLocalInterceptor)
  async getList(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField') sortField: string,
    @Query('sortOrder') sortOrder: string,
    @UserInfo() user: User,
  ) {
    const data = await this.roleService.getList(current, pageSize, sortField, sortOrder, user);
    return Result.success(data);
  }

  /**
   * 禁用租户
   * @param id 角色id
   * @param status 1启用 0 禁用
   */
  @Post('/forbidden')
  @Auth()
  async forbiddenRole(@Body('id') id: string, @Body('status') status: string) {
    const data = await this.roleService.forbidden(id, status);
    return Result.success(data, status === '1' ? '禁用成功' : '启用成功');
  }

  /**
   * 根据id查询角色
   * @param id
   */
  @Get('/get')
  @Auth()
  async get(@Query('id') id: string) {
    const data = await this.roleService.getOneById(id);
    return Result.success(data);
  }

  /**
   * 更新角色
   * @param updateRoleDto
   */
  @Post('/update')
  @Auth()
  async update(@Body() updateRoleDto: UpdateRoleDto, @UserInfo() userInfo: User) {
    const data = await this.roleService.update(updateRoleDto, userInfo);
    return Result.success(data, '更新角色成功');
  }

  /**
   * 删除角色
   * @param id
   */
  @Post('/delete')
  @Auth()
  async delete(@Body('id') id: string) {
    const data = await this.roleService.delete(id);
    return Result.success(data, '删除角色成功');
  }
}
