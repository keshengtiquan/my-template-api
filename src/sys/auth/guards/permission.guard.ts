import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserType, ManagementGroup } from 'src/enmus';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    //当前登录的用户
    const user = context.switchToHttp().getRequest().user;
    console.log(user, 'user');
    const userPermissions = user.roles.flatMap((role) => {
      return role.permissions.map((permission) => {
        return permission.key;
      });
    });

    const apiPermission = this.reflector.get('permission', context.getHandler());
    console.log(userPermissions, 'userPermissions');
    console.log(apiPermission, 'apiPermission');

    if (user.userType === UserType.SYSUSER || user.tenantId === ManagementGroup.ID) {
      return true;
    }
    return apiPermission.length === 0 || apiPermission.some((item) => userPermissions.includes(item));
  }
}
