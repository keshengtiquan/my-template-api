import { BadGatewayException, Injectable } from '@nestjs/common'
import { CreateDeptDto } from './dto/create-dept.dto'
import { UpdateDeptDto } from './dto/update-dept.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Dept } from './entities/dept.entity'
import { Repository } from 'typeorm'
import { User } from '../user/entities/user.entity'

@Injectable()
export class DeptService {
  @InjectRepository(Dept)
  private deptRepository: Repository<Dept>
  /**
   * 创建部门
   * @param createDeptDto
   */
  create(createDeptDto: CreateDeptDto, userInfo: User) {
    const dept = new Dept()
    dept.deptName = createDeptDto.deptName
    dept.email = createDeptDto.email
    dept.leader = createDeptDto.leader
    dept.parentId = createDeptDto.parentId
    dept.phone = createDeptDto.phone
    dept.tenantId = userInfo.tenantId
    dept.createBy = userInfo.nickName
    dept.updateBy = userInfo.nickName
    try {
      return this.deptRepository.save(dept)
    } catch (e) {
      throw new BadGatewayException('创建部门失败')
    }
  }
}
