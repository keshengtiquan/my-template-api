import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '../user/entities/user.entity'
import { Repository } from 'typeorm'
import { LoginDto } from './dto/login.dto'
import { md5 } from '../../utils'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  @InjectRepository(User)
  private userRepository: Repository<User>
  @Inject(JwtService)
  private jwtService: JwtService

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: {
        userName: loginDto.userName,
      },
    })
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST)
    }

    if (user.password !== md5(loginDto.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST)
    }

    return this.token(user)
  }

  private async token({ id, userName }) {
    return {
      token: await this.jwtService.signAsync({
        sub: id,
        userName,
      }),
    }
  }
}
