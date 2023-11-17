import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    //当前登录的用户
    const user = context.switchToHttp().getRequest().user;
    console.log(user);
    console.log(this.reflector.get('permission', context.getHandler()));
    return true;
  }
}
