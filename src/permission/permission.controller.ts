import { Body, Controller, Get, Post } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { Auth } from 'src/sys/auth/decorators/auth.decorators';
import { Result } from 'src/common/result';
import { Permission } from './entities/permission.entity';

@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post('/initData')
  @Auth()
  async init() {
    return await this.permissionService.init();
  }

  /**
   * 获取权限列表
   * @returns 权限列表
   */
  @Get('/getlist')
  @Auth()
  async getlist() {
    return Result.success(await this.permissionService.getlist());
  }

  /**
   * 角色分配权限
   * @param roleId 角色ID
   * @param permission 角色权限数组
   */
  @Post('/assignAuth')
  @Auth()
  async assignAuth(@Body('roleId') roleId: string, @Body('permissions') permissions: Permission[]) {
    return await this.permissionService.assignAuth(roleId, permissions);
  }
}
