import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { Auth } from './decorators/auth.decorators'
import { Result } from '../../common/result'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return Result.success(await this.authService.login(loginDto), '登录成功')
  }

  @Get('/userInfo')
  @HttpCode(200)
  @Auth()
  getUserInfo(@Req() req) {
    return Result.success(req.user)
  }
}
