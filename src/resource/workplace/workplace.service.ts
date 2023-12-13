import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { CreateWorkplaceDto } from './dto/create-workplace.dto'
import { User } from '../../sys/user/entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { WorkPlace, WorkPlaceType } from './entities/workplace.entity'
import { Repository } from 'typeorm'
import { Order } from '../../types'
import { ImportFileService, ManagementGroup } from '../../enmus'
import { UpdateWorkplaceDto } from './dto/update-workplace.dto'
import { Excel } from '../../excel/entities/excel.entity'
import { ExcelService } from '../../excel/excel.service'

@Injectable()
export class WorkplaceService {
  @InjectRepository(WorkPlace)
  private workPlaceRepository: Repository<WorkPlace>
  @InjectRepository(Excel)
  private excelRepository: Repository<Excel>

  @Inject()
  private excelService: ExcelService
  /**
   * 创建工点
   * @param createWorkplaceDto
   */
  async create(createWorkplaceDto: CreateWorkplaceDto, userInfo: User) {
    const workPlace = new WorkPlace()
    workPlace.workPlaceCode = createWorkplaceDto.workPlaceCode
    workPlace.workPlaceName = createWorkplaceDto.workPlaceName
    workPlace.workPlaceType = createWorkplaceDto.workPlaceType
    workPlace.sortNumber = createWorkplaceDto.sortNumber
    workPlace.createBy = userInfo.userName
    workPlace.updateBy = userInfo.userName
    workPlace.createDept = userInfo.deptId
    workPlace.tenantId = userInfo.tenantId

    const typeMapping: { [key: string]: string } = {
      车站: 'station',
      区间: 'section',
      station: 'station',
      section: 'section',
    }
    workPlace.workPlaceType = typeMapping[createWorkplaceDto.workPlaceType]

    try {
      return await this.workPlaceRepository.save(workPlace)
    } catch (e) {
      throw new BadRequestException('创建工点失败')
    }
  }

  /**
   * 查询工点列表
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param workPlaceType
   * @param userInfo
   */
  async getList(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    workPlaceType: WorkPlaceType,
    userInfo: User,
  ) {
    const queryBuilder = this.workPlaceRepository
      .createQueryBuilder('workplace')
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .orderBy(`workplace.${sortField}`, sortOrder)
    if (userInfo.tenantId !== ManagementGroup.ID) {
      queryBuilder.where('workplace.tenantId = :tenantId', { tenantId: userInfo.tenantId })
    }
    if (workPlaceType) {
      queryBuilder.andWhere('workplace.workPlaceType = :workPlaceType', { workPlaceType })
    }
    try {
      const [list, total] = await queryBuilder.getManyAndCount()
      const data = list.map((item) => {
        const { workPlaceType, ...other } = item
        return {
          ...other,
          workPlaceType: workPlaceType === WorkPlaceType.STATION ? '车站' : '区间',
        }
      })
      return {
        results: data,
        current,
        pageSize,
        total,
      }
    } catch (e) {
      throw new BadRequestException('查询工点列表失败')
    }
  }

  /**
   * 查询工点
   */
  async getOne(id: string) {
    try {
      return await this.workPlaceRepository.findOne({
        where: { id },
      })
    } catch (e) {
      throw new BadRequestException('查询工点失败')
    }
  }

  /**
   * 更新工点
   * @param updateWorkplaceDto
   * @param userInfo
   */
  async update(updateWorkplaceDto: UpdateWorkplaceDto, userInfo: User) {
    try {
      return await this.workPlaceRepository.update(
        { id: updateWorkplaceDto.id },
        {
          workPlaceCode: updateWorkplaceDto.workPlaceCode,
          workPlaceName: updateWorkplaceDto.workPlaceName,
          workPlaceType: updateWorkplaceDto.workPlaceType,
          sortNumber: updateWorkplaceDto.sortNumber,
          updateBy: userInfo.userName,
        },
      )
    } catch (e) {
      throw new BadRequestException('更新工点失败')
    }
  }

  /**
   * 删除工点
   * @param id
   */
  async delete(id: string) {
    try {
      return await this.workPlaceRepository.delete({ id })
    } catch (e) {
      console.log(e)
      throw new BadRequestException('删除工点失败')
    }
  }

  /**
   * 上传
   * @param file
   * @param userInfo
   */
  async upload(file: Express.Multer.File, userInfo: User) {
    return this.excelService.excelImport(file, userInfo, ImportFileService.WORKPLACEIMPORT, this.create.bind(this))
  }
}
