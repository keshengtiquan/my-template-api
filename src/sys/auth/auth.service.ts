import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { md5 } from '../../utils';
import { JwtService } from '@nestjs/jwt';
import { ManagementGroup, Status, UserType } from '../../enmus';
import { Tenant } from '../tenant/entities/tenant.entity';

@Injectable()
export class AuthService {
  @InjectRepository(User)
  private userRepository: Repository<User>;
  @Inject(JwtService)
  private jwtService: JwtService;
  @InjectRepository(Tenant)
  private tenantRepository: Repository<Tenant>;

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: {
        userName: loginDto.userName,
      },
    });
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (user.password !== md5(loginDto.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }
    if (user.tenantId !== ManagementGroup.ID) {
      const tenant = await this.tenantRepository.findOne({ where: { id: user.tenantId } });
      if (tenant.status === Status.FORBIDDEN) {
        throw new HttpException('租户被禁用,请联系管理员', HttpStatus.BAD_REQUEST);
      }
    }

    if (user.status === Status.FORBIDDEN) {
      throw new HttpException('用户被禁用,请联系管理员', HttpStatus.BAD_REQUEST);
    }

    return this.token(user);
  }

  private async token({ id, userName }) {
    return {
      token: await this.jwtService.signAsync({
        sub: id,
        userName,
      }),
    };
  }

  async getPermissions(id: string) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      relations: {
        roles: {
          permissions: true,
        },
      },
    });
    if (user.userType === UserType.SYSUSER || user.tenantId === ManagementGroup.ID) {
      return ['*'];
    }
    const permissions = new Set([]);
    user.roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        permissions.add(permission.key);
      });
    });
    return Array.from(permissions);
  }
}
