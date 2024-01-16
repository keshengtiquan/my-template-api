import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Role } from './entities/role.entity'
import { In, Repository } from 'typeorm'
import { User } from '../user/entities/user.entity'
import { Menu } from '../menu/entities/menu.entity'
import { ManagementGroup } from '../../enmus'

@Injectable()
export class RoleService {
  @InjectRepository(Role)
  private roleRepository: Repository<Role>

  @InjectRepository(Menu)
  private menuRepository: Repository<Menu>

  async create(createRoleDto: CreateRoleDto, userInfo: User) {
    if (createRoleDto.menuIds.length === 0) {
      throw new HttpException('请选择菜单', HttpStatus.BAD_REQUEST)
    }
    const findRoleName = await this.roleRepository.findOne({
      where: { roleName: createRoleDto.roleName, tenantId: userInfo.tenantId },
    })
    if (findRoleName) {
      throw new HttpException('角色名称已存在', HttpStatus.BAD_REQUEST)
    }
    const findRoleKey = await this.roleRepository.findOne({
      where: { roleKey: createRoleDto.roleKey, tenantId: userInfo.tenantId },
    })
    if (findRoleKey) {
      throw new HttpException('角色key已存在', HttpStatus.BAD_REQUEST)
    }
    const menus = await this.menuRepository.find({
      where: { id: In(createRoleDto.menuIds) },
    })
    const role = new Role()
    role.roleName = createRoleDto.roleName
    role.roleKey = createRoleDto.roleKey
    role.roleSort = createRoleDto.roleSort
    role.remark = createRoleDto.remark
    role.tenantId = userInfo.tenantId
    role.createBy = userInfo.userName
    role.updateBy = userInfo.userName
    role.createDept = userInfo.deptId
    role.menus = menus

    try {
      return await this.roleRepository.save(role)
    } catch (e) {
      throw new HttpException('角色创建失败', HttpStatus.BAD_REQUEST)
    }
  }

  /**
   * 获取角色列表
   * @param current 当前页码
   * @param pageSize 页码大小
   */
  async getList(current: number, pageSize: number, sortField: string, sortOrder: string, user: User) {
    const order = {}
    order[sortField] = sortOrder
    const where = {}
    if (user.tenantId !== ManagementGroup.ID) {
      where['tenantId'] = user.tenantId
    }
    try {
      const [data, total] = await this.roleRepository.findAndCount({
        skip: (current - 1) * pageSize,
        take: pageSize,
        where: where,
        order: order,
      })
      return {
        results: data,
        current: current,
        pageSize: pageSize,
        total,
      }
    } catch (e) {
      throw new BadRequestException('查询角色失败')
    }
  }

  /**
   * 禁用租户
   * @param id 角色id
   * @param status 1启用 0 禁用
   */
  async forbidden(id: string, status: string) {
    try {
      return await this.roleRepository.update({ id }, { status })
    } catch (e) {
      throw new BadRequestException('禁用角色失败')
    }
  }

  /**
   * 根据id查询角色
   * @param id
   */
  async getOneById(id: string) {
    try {
      return this.roleRepository.findOne({
        where: { id },
        relations: { menus: true },
      })
    } catch (e) {
      throw new BadRequestException('查询角色失败')
    }
  }

  /**
   * 更新角色
   * @param updateRoleDto
   */
  async update(updateRoleDto: UpdateRoleDto, userInfo: User) {
    try {
      const role = await this.roleRepository.findOne({
        where: { id: updateRoleDto.id },
        relations: { menus: true },
      })
      const menus = await this.menuRepository.find({
        where: { id: In(updateRoleDto.menuIds) },
      })

      role.roleName = updateRoleDto.roleName
      role.roleKey = updateRoleDto.roleKey
      role.roleSort = updateRoleDto.roleSort
      role.remark = updateRoleDto.remark
      role.updateBy = userInfo.userName
      role.menus = menus
      return await this.roleRepository.save(role)
    } catch (e) {
      throw new BadRequestException('角色更新失败')
    }
  }

  /**
   * 删除角色
   * @param id
   */
  async delete(id: string) {
    try {
      const role = await this.roleRepository.findOne({
        where: { id },
        relations: { menus: true },
      })
      role.menus = []
      await this.roleRepository.save(role)
      return await this.roleRepository.delete(id)
    } catch (e) {
      throw new BadRequestException('删除角色失败')
    }
  }
}
