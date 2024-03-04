import { Controller, Post, Body } from '@nestjs/common';
import { JobteamService } from './jobteam.service';
import { CreateJobteamDto } from './dto/create-jobteam.dto';
import { Auth } from 'src/sys/auth/decorators/auth.decorators';
import { Result } from 'src/common/result';
import { UserInfo } from 'src/decorators/user.dectorator';
import { User } from 'src/sys/user/entities/user.entity';

@Controller('jobteam')
export class JobteamController {
  constructor(private readonly jobteamService: JobteamService) {}

  /**
   * 创建班组
   * @param createJobteamDto CreateJobteamDto
   * @param userInfo 用户信息
   */
  @Post('/create')
  @Auth()
  async create(@Body() createJobteamDto: CreateJobteamDto, @UserInfo() userInfo: User) {
    return Result.success(await this.jobteamService.create(createJobteamDto, userInfo));
  }
}
