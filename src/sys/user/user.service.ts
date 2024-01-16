import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { User } from './entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { md5 } from '../../utils'
import { Order } from '../../types'
import { ManagementGroup } from '../../enmus'
import { Role } from '../role/entities/role.entity'
import { UserResultVo } from './vo/UserResultVo'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UserService {
  @InjectRepository(User)
  private userRepository: Repository<User>
  @InjectRepository(Role)
  private roleRepository: Repository<Role>

  async create(createUserDto: CreateUserDto, userInfo: User) {
    const foundUser = await this.userRepository.findOneBy({
      userName: createUserDto.userName,
    })
    if (foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST)
    }
    const roles = await this.roleRepository.find({
      where: { id: In(createUserDto.roleIds) },
    })
    const newUser = new User()
    newUser.userName = createUserDto.userName
    newUser.password = md5(createUserDto.password)
    newUser.nickName = createUserDto.nickName
    newUser.email = createUserDto.email
    newUser.phoneNumber = createUserDto.phoneNumber
    newUser.gender = createUserDto.gender
    newUser.avatar = createUserDto.avatar
    newUser.createDept = userInfo.createDept
    newUser.remark = createUserDto.remark
    newUser.createBy = userInfo.userName
    newUser.updateBy = userInfo.userName
    newUser.deptId = createUserDto.deptId
    newUser.tenantId = userInfo.tenantId
    newUser.roles = roles
    try {
      await this.userRepository.save(newUser)
      return '注册成功'
    } catch (e) {
      return '注册失败'
    }
  }

  /**
   * 查询用户列表
   * @param current
   * @param pageSize
   */
  async getList(
    current: number,
    pageSize: number,
    nickName: string,
    sortField: string,
    sortOrder: Order,
    userInfo: User,
  ) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .orderBy(`user.${sortField}`, sortOrder)
    if (userInfo.tenantId !== ManagementGroup.ID) {
      queryBuilder.where('user.tenantId = :tenantId', { tenantId: userInfo.tenantId })
    }
    if (nickName) {
      queryBuilder.andWhere('user.nickName like :nickName', { nickName: `%${nickName}%` })
    }
    try {
      const [list, total] = await queryBuilder.getManyAndCount()
      return {
        results: list,
        current: current,
        pageSize: pageSize,
        total,
      }
    } catch (e) {
      throw new BadRequestException('查询用户列表失败')
    }
  }

  /**
   * 禁用用户
   * @param id
   * @param status
   */
  async forbidden(id: string, status: string, user: User) {
    const userInfo = await this.userRepository.findOne({ where: { id } })
    if (userInfo.tenantId === ManagementGroup.ID) {
      throw new HttpException('无法禁用系统管理员', HttpStatus.FORBIDDEN)
    }
    if (user.tenantId != ManagementGroup.ID && userInfo.userType === 'sys_user' && status === '1') {
      throw new HttpException('你无权限禁用系统用户', HttpStatus.FORBIDDEN)
    }
    try {
      return await this.userRepository.update(id, { status })
    } catch (e) {
      throw new BadRequestException('禁用用户失败')
    }
  }

  /**
   * 根据ID获取用户信息
   * @param id
   */
  async getOneById(id: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id }, relations: { roles: true } })
      const userVo = new UserResultVo()
      userVo.roleIds = user.roles.map((item) => item.id)
      userVo.id = user.id
      userVo.tenantId = user.tenantId
      userVo.userType = user.userType
      userVo.userName = user.userName
      userVo.nickName = user.nickName
      userVo.email = user.email
      userVo.phoneNumber = user.phoneNumber
      userVo.gender = user.gender
      userVo.avatar = user.avatar
      userVo.status = user.status
      userVo.createDept = user.createDept
      userVo.remark = user.remark
      userVo.createBy = user.createBy
      userVo.updateBy = user.updateBy
      userVo.createTime = user.createTime
      userVo.updateTime = user.updateTime
      userVo.deptId = user.deptId
      return userVo
    } catch (e) {
      throw new BadRequestException('获取用户信息失败')
    }
  }

  /**
   * 更新用户
   * @param user
   * @param updateUserDto
   */
  async update(updateUserDto: UpdateUserDto, userInfo: User) {
    try {
      const updateUser = await this.userRepository.findOne({
        where: { id: updateUserDto.id },
        relations: ['roles'],
      })
      const roles = await this.roleRepository.find({
        where: { id: In(updateUserDto.roleIds) },
      })
      updateUser.userName = updateUserDto.userName
      updateUser.nickName = updateUserDto.nickName
      updateUser.email = updateUserDto.email
      updateUser.phoneNumber = updateUserDto.phoneNumber
      updateUser.gender = updateUserDto.gender
      updateUser.remark = updateUserDto.remark
      updateUser.updateBy = userInfo.userName
      updateUser.deptId = updateUserDto.deptId
      updateUser.roles = roles
      return await this.userRepository.save(updateUser)
    } catch (e) {
      throw new BadRequestException('更新用户失败')
    }
  }

  /**
   * 删除用户
   * @param id
   */
  async delete(id: string, userInfo: User) {
    if (id === userInfo.id) {
      throw new BadRequestException('不能删除自己')
    }
    if (userInfo.tenantId !== ManagementGroup.ID && userInfo.userType !== 'sys_user') {
      throw new BadRequestException('你无权限删除系统用户')
    }
    try {
      const deleteUser = await this.userRepository.findOne({
        where: { id },
        relations: { roles: true },
      })
      deleteUser.roles = []
      await this.userRepository.save(deleteUser)
      return await this.userRepository.delete(id)
    } catch (e) {
      throw new BadRequestException('删除用户失败')
    }
  }

  setCurrentUser(request: any, user: any) {
    request.currentUser = user
  }

  getCurrentUser(request: any): any {
    return request.currentUser
  }
}
