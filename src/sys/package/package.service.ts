import { BadRequestException, Injectable } from '@nestjs/common'
import { CreatePackageDto } from './dto/create-package.dto'
import { UpdatePackageDto } from './dto/update-package.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Package } from './entities/package.entity'
import { Repository } from 'typeorm'
import { User } from '../user/entities/user.entity'

@Injectable()
export class PackageService {
  @InjectRepository(Package)
  private packageRepository: Repository<Package>

  /**
   * 创建套餐
   * @param createPackageDto
   */
  async create(createPackageDto: CreatePackageDto, userInfo: User) {
    const tenantPackage = new Package()
    tenantPackage.packageName = createPackageDto.packageName
    tenantPackage.menuIds = createPackageDto.menuIds
    tenantPackage.remark = createPackageDto.remark
    tenantPackage.createBy = userInfo.nickName
    tenantPackage.updateBy = userInfo.nickName
    try {
      return this.packageRepository.save(tenantPackage)
    } catch (e) {
      throw new BadRequestException('租户套餐创建失败')
    }
  }

  /**
   * 查询套餐列表
   * @param current 当前页
   * @param pageSize 每页大小
   */
  async getList(current: number, pageSize: number, sortField: string, sortOrder: 'ASC' | 'DESC', packageName: string) {
    try {
      const queryBuilder = this.packageRepository
        .createQueryBuilder('package')
        .skip((current - 1) * pageSize)
        .take(pageSize)
        .orderBy(`package.${sortField}`, sortOrder)
      if (packageName) {
        queryBuilder.where('package.packageName like :packageName', {
          packageName: `%${packageName}%`,
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
      throw new BadRequestException('查询套餐列表失败')
    }
  }

  /**
   * 根据ID查询套餐
   * @param id
   */
  async getOne(id: string) {
    try {
      return await this.packageRepository.findOne({
        where: { id },
      })
    } catch (e) {
      throw new BadRequestException('查询套餐失败')
    }
  }

  /**
   * 更新套餐
   * @param updatePackageDto
   */
  async update(updatePackageDto: UpdatePackageDto, userInfo: User) {
    try {
      await this.packageRepository.update(
        { id: updatePackageDto.id },
        {
          packageName: updatePackageDto.packageName,
          menuIds: updatePackageDto.menuIds,
          remark: updatePackageDto.remark,
          updateBy: userInfo.nickName,
        },
      )
    } catch (e) {
      throw new BadRequestException('更新套餐失败')
    }
  }

  /**
   * 删除套餐
   * @param id
   */
  async delete(id: string) {
    try {
      return this.packageRepository.delete(id)
    } catch (e) {
      throw new BadRequestException('删除套餐失败')
    }
  }
}
