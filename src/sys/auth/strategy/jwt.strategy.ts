import { User } from '../../user/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    super({
      //解析用户提交的bearer token header数据
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      //加密的 secret
      secretOrKey: configService.get('jwt_secret'),
    });
  }
  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  async validate({ sub: id }) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      relations: {
        roles: true,
      },
    });
    delete user.password;
    return user;
  }
}
