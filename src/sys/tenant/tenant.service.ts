import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { User } from '../user/entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Tenant } from './entities/tenant.entity'
import { Repository } from 'typeorm'
import { Package } from '../package/entities/package.entity'
import { ManagementGroup, UserType } from '../../enmus'
import { Order } from '../../types'
import { TenantResultVo } from './vo/tenantResultVo'
import { UpdateTenantDto } from './dto/update-tenant.dto'
import { md5 } from '../../utils'

@Injectable()
export class TenantService {
  @InjectRepository(Tenant)
  private tenantRepository: Repository<Tenant>
  @InjectRepository(Package)
  private packageRepository: Repository<Package>
  @InjectRepository(User)
  private userRepository: Repository<User>

  async create(createTenantDto: CreateTenantDto, userInfo: User) {
    try {
      const selectPackage = await this.packageRepository.findOne({ where: { id: createTenantDto.packageId } })
      const tenant = new Tenant()
      tenant.contactUserName = createTenantDto.contactUserName
      tenant.contactPhone = createTenantDto.contactPhone
      tenant.companyName = createTenantDto.companyName
      tenant.address = createTenantDto.address
      tenant.createBy = userInfo.userName
      tenant.updateBy = userInfo.userName
      tenant.packageId = selectPackage
      await this.tenantRepository.manager.transaction(async (transactionalEntityManager) => {
        const createdTenant = await transactionalEntityManager.save(tenant)
        //创建用户
        const tenantAdmin = new User()
        tenantAdmin.nickName = '项目管理员'
        tenantAdmin.password = md5(createTenantDto.password)
        tenantAdmin.userName = createTenantDto.userName
        tenantAdmin.tenantId = createdTenant.id
        tenantAdmin.userType = UserType.SYSUSER
        await this.userRepository.save(tenantAdmin)
      })
    } catch (e) {
      throw new BadRequestException('创建租户失败')
    }
  }

  /**
   * 查询租户列表
   * @param findTenantDto
   */
  async findList(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    tenantId: string,
    companyName: string,
    status: string,
    contactUserName: string,
  ) {
    if (tenantId != ManagementGroup.ID) {
      throw new HttpException('无权访问', HttpStatus.FORBIDDEN)
    }
    try {
      const queryBuilder = this.tenantRepository
        .createQueryBuilder('tenant')
        .skip((current - 1) * pageSize)
        .take(pageSize)
        .orderBy(`tenant.${sortField}`, sortOrder)
      if (companyName) {
        queryBuilder.where('tenant.companyName like :companyName', { companyName: `%${companyName}%` })
      }
      if (status) {
        queryBuilder.andWhere('tenant.state = :state', { state: status })
      }
      if (contactUserName) {
        queryBuilder.andWhere('tenant.contactUserName like :contactUserName', {
          contactUserName: `%${contactUserName}%`,
        })
      }

      const [data, total] = await queryBuilder.getManyAndCount()
      return {
        results: data,
        current: current,
        pageSize: pageSize,
        total,
      }
    } catch (e) {
      throw new BadRequestException('查询租户列表失败')
    }
  }

  /**
   * 禁用租户
   * @param id 租户id
   * @param status 1启用 0 禁用
   */
  async forbidden(id: string, status: string) {
    if (id === ManagementGroup.ID) {
      throw new HttpException('无法禁用超级管理员租户', HttpStatus.BAD_REQUEST)
    }
    try {
      return this.tenantRepository.update({ id }, { status })
    } catch (e) {
      throw new BadRequestException('禁用租户失败')
    }
  }

  /**
   * 查询租户
   * @param id 租户ID
   */
  async getOne(id: string) {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id },
        relations: { packageId: true },
      })
      const tenantVo = new TenantResultVo()
      tenantVo.id = tenant.id
      tenantVo.contactUserName = tenant.contactUserName
      tenantVo.contactPhone = tenant.contactPhone
      tenantVo.companyName = tenant.companyName
      tenantVo.address = tenant.address
      tenantVo.status = tenant.status
      tenantVo.createBy = tenant.createBy
      tenantVo.updateBy = tenant.updateBy
      tenantVo.createTime = tenant.createTime
      tenantVo.updateTime = tenant.updateTime
      tenantVo.packageId = tenant.packageId.id
      return tenantVo
    } catch (e) {
      throw new BadRequestException('查询租户失败')
    }
  }

  /**
   * 更新租户
   * @param updateTenantDto
   */
  async updateTenant(updateTenantDto: UpdateTenantDto, userInfo: User) {
    try {
      const selectPackage = await this.packageRepository.findOne({ where: { id: updateTenantDto.packageId } })

      return await this.tenantRepository.update(
        { id: updateTenantDto.id },
        {
          contactUserName: updateTenantDto.contactUserName,
          contactPhone: updateTenantDto.contactPhone,
          companyName: updateTenantDto.companyName,
          address: updateTenantDto.address,
          updateBy: userInfo.userName,
          packageId: selectPackage,
        },
      )
    } catch (e) {
      throw new BadRequestException('更新租户失败')
    }
  }
  /**
   * 删除租户
   * @param id
   */
  async deleteTenant(id: string) {
    try {
      const res = await this.tenantRepository.manager.transaction(async (manager) => {
        await manager.delete(Tenant, { id })
        await manager.delete(User, { tenantId: id })
      })
      console.log(res)
    } catch (e) {
      throw new BadRequestException('删除租户失败')
    }
  }
}
