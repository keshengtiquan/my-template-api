import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    //当前登录的用户
    const headers = context.switchToHttp().getRequest().headers;

    const token = headers.authorization.split(' ');
    if (!token[1]) {
      throw new UnauthorizedException();
    } else {
      try {
        const payload = await this.jwtService.verifyAsync(token[1], {
          secret: this.configService.get('jwt_secret'),
        });
        console.log(payload);
      } catch (error) {
        throw new UnauthorizedException();
      }
    }

    //当前用户类型
    return true;
  }
}
