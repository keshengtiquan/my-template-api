import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard } from '../guards/permission.guard';

export function Auth(...perms: any[]) {
  return applyDecorators(
    SetMetadata('permission', perms),
    UseGuards(AuthGuard('jwt'), PermissionGuard),
  );
}
