import { BadRequestException, Injectable } from '@nestjs/common'
import { CreateDeptDto } from './dto/create-dept.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Dept } from './entities/dept.entity'
import { Repository } from 'typeorm'
import { User } from '../user/entities/user.entity'
import { handleTree } from '../../utils'
import { UpdateDeptDto } from './dto/update-dept.dto'
import { ManagementGroup } from '../../enmus'

@Injectable()
export class DeptService {
  @InjectRepository(Dept)
  private deptRepository: Repository<Dept>
  /**
   * 创建部门
   * @param createDeptDto
   */
  async create(createDeptDto: CreateDeptDto, userInfo: User) {
    const dept = new Dept()
    dept.deptName = createDeptDto.deptName
    dept.email = createDeptDto.email
    dept.leader = createDeptDto.leader
    dept.parentId = createDeptDto.parentId
    dept.phone = createDeptDto.phone
    dept.tenantId = userInfo.tenantId
    dept.createBy = userInfo.userName
    dept.updateBy = userInfo.userName
    try {
      return await this.deptRepository.save(dept)
    } catch (e) {
      throw new BadRequestException('创建部门失败')
    }
  }

  /**
   * 查询部门列表
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   */
  async getlist(userInfo: User) {
    const queryBuilder = this.deptRepository.createQueryBuilder('dept')
    if (userInfo.tenantId !== ManagementGroup.ID) {
      queryBuilder.where('dept.tenantId = :tenantId', { tenantId: userInfo.tenantId })
    }
    try {
      const res = await queryBuilder.getMany()
      return handleTree(res)
    } catch (e) {
      throw new BadRequestException('获取部门列表失败')
    }
  }

  /**
   * 禁用部门
   * @param id 角色id
   * @param status 1启用 0 禁用
   */
  async forbidden(id: string, status: string) {
    try {
      return await this.deptRepository.update(id, { status })
    } catch (e) {
      throw new BadRequestException('禁用部门失败')
    }
  }

  /**
   * 根据ID查询部门
   * @param id
   */
  async getOneById(id: string) {
    try {
      return await this.deptRepository.findOne({ where: { id } })
    } catch (e) {
      throw new BadRequestException('查询部门失败')
    }
  }

  /**
   * 更新部门
   * @param updateDeptDto
   */
  async update(updateDeptDto: UpdateDeptDto, userInfo: User) {
    try {
      return await this.deptRepository.update(
        { id: updateDeptDto.id },
        {
          deptName: updateDeptDto.deptName,
          email: updateDeptDto.email,
          leader: updateDeptDto.leader,
          parentId: updateDeptDto.parentId,
          phone: updateDeptDto.phone,
          updateBy: userInfo.userName,
        },
      )
    } catch (e) {
      throw new BadRequestException('更新部门失败')
    }
  }

  /**
   * 删除部门
   * @param id
   */
  async delete(id: string) {
    try {
      return await this.deptRepository.delete(id)
    } catch (e) {
      throw new BadRequestException('删除部门失败')
    }
  }
}
