import { Controller, Post, Body } from '@nestjs/common'
import { DeptService } from './dept.service'
import { CreateDeptDto } from './dto/create-dept.dto'
import { User } from '../user/entities/user.entity'
import { UserInfo } from '../../decorators/user.dectorator'
import { Result } from '../../common/result'
import { Auth } from '../auth/decorators/auth.decorators'

@Controller('dept')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  /**
   * 创建部门
   * @param createDeptDto
   */
  @Post('/create')
  @Auth()
  async create(@Body() createDeptDto: CreateDeptDto, @UserInfo() userInfo: User) {
    const data = this.deptService.create(createDeptDto, userInfo)
    return Result.success(data, '创建部门成功')
  }
}
