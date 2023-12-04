import { Controller, Post, Body } from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { Auth } from '../auth/decorators/auth.decorators'
import { Result } from '../../common/result'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/create')
  async create(@Body() createUserDto: CreateUserDto) {
    return Result.success(await this.userService.create(createUserDto), '添加用户成功')
  }
}
