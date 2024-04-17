import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../guards/permission.guard';
import { LoginGuard } from '../guards/login.guard';

export function Auth(...perms: any[]) {
  return applyDecorators(SetMetadata('permission', perms), UseGuards(LoginGuard), UseGuards(PermissionGuard));
}
