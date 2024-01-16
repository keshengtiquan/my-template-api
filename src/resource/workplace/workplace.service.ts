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
import { List } from '../list/entities/list.entity'
import { WorkPlaceList } from './entities/workplace.list.entity'
import Decimal from 'decimal.js'
import { MyLoggerService } from '../../common/my-logger/my-logger.service'

@Injectable()
export class WorkplaceService {
  @InjectRepository(WorkPlace)
  private workPlaceRepository: Repository<WorkPlace>
  @InjectRepository(Excel)
  private excelRepository: Repository<Excel>
  @InjectRepository(List)
  private listRepository: Repository<List>
  @InjectRepository(WorkPlaceList)
  private workPlaceListRepository: Repository<WorkPlaceList>
  @Inject()
  private loggerService: MyLoggerService
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

  /**
   * 工点关联清单
   * @param id
   * @param listIds
   * @param userInfo
   */
  async relevanceList(id: string, listIds: string[], userInfo: User) {
    if (listIds.length === 0) {
      throw new BadRequestException('请选择清单')
    }
    const data = []
    listIds.forEach((item) => {
      data.push({
        workPlaceId: id,
        listId: item,
        tenantId: userInfo.tenantId,
        createBy: userInfo.userName,
        updateBy: userInfo.userName,
        createDept: userInfo.deptId,
      })
    })
    try {
      return await this.workPlaceListRepository.save(data)
    } catch (e) {
      console.log(e)
      throw new BadRequestException('工点关联清单失败')
    }
  }

  /**
   * 查询关联的清单列表
   * @param id
   * @param userInfo
   */
  async getWorkPlaceRelevanceList(
    id: string,
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    listCode: string,
    listName: string,
    listCharacteristic: string,
    userInfo: User,
  ) {
    const queryBuilder = this.workPlaceListRepository
      .createQueryBuilder('wpl')
      .leftJoinAndSelect(List, 'list', 'list.id = wpl.listId')
      .select([
        'wpl.id as id',
        'wpl.allQuantities as allQuantities',
        'wpl.leftQuantities as leftQuantities',
        'wpl.rightQuantities as rightQuantities',
        'list.unitPrice as unitPrice',
        'wpl.combinedPrice as combinedPrice',
        'list.serialNumber as serialNumber',
        'list.listCode as listCode',
        'list.listName as listName',
        'list.listCharacteristic as listCharacteristic',
        'list.unit as unit',
        'list.unitPrice as unitPrice',
      ])
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .orderBy(`list.${sortField}`, sortOrder)
      .where('wpl.workPlaceId = :id', { id })
      .andWhere('wpl.tenantId = :tenantId', {
        tenantId: userInfo.tenantId,
      })
    if (listCode) {
      queryBuilder.andWhere('list.listCode = :listCode', { listCode })
    }
    if (listName) {
      queryBuilder.andWhere('list.listName like :listName', { listName: `%${listName}%` })
    }
    if (listCharacteristic) {
      queryBuilder.andWhere('list.listCharacteristic like :listCharacteristic', {
        listCharacteristic: `%${listCharacteristic}%`,
      })
    }
    try {
      const list = await queryBuilder.getRawMany()
      const totalCombinedPrice = list.reduce((total, item) => {
        return total + parseFloat(item.combinedPrice)
      }, 0)
      await this.workPlaceRepository.update(
        { id },
        {
          outputValue: totalCombinedPrice,
        },
      )

      return {
        results: list,
        current,
        pageSize,
        total: await queryBuilder.getCount(),
      }
    } catch (e) {
      console.log(e)
      throw new BadRequestException('工点关联清单列表查询失败')
    }
  }

  /**
   * 更新工点的工程量
   *
   * @param id 当前wpl的id
   * @param allQuantities
   * @param userInfo
   */
  async updateQuantities(
    id: string,
    allQuantities: number,
    leftQuantities: number,
    rightQuantities: number,
    userInfo: User,
  ) {
    //根据workplaceId(ID)查询出当前的 listid， 再查询清单ID相同的所有wpl， wpl工程量加起来不能超过清单的工程量
    try {
      //查询listId
      const { listId }: { listId: string } = await this.workPlaceListRepository.findOne({
        where: { id },
        select: ['listId'],
      })
      if (!listId) {
        throw new Error('工点关联清单列表查询失败')
      }
      const totalExistingQuantities = await this.workPlaceListRepository
        .createQueryBuilder('wpl')
        .select('SUM(wpl.allQuantities)', 'total')
        .where('wpl.listId = :listId', { listId })
        .andWhere('wpl.id != :id', { id })
        .andWhere('wpl.tenantId = :tenantId', { tenantId: userInfo.tenantId })
        .getRawOne()
      const totalAllowedQuantities = await this.listRepository
        .createQueryBuilder('list')
        .select('list.quantities', 'quantities')
        .addSelect('list.unitPrice', 'unitPrice')
        .where('list.id = :listId', { listId })
        .getRawOne()
      if (!totalExistingQuantities || !totalAllowedQuantities) {
        throw new Error('无法获取工程量信息')
      }
      const allowedQuantities = totalAllowedQuantities.quantities || 0
      const alreadyQuantities = totalExistingQuantities.total || 0
      if (allQuantities + alreadyQuantities > allowedQuantities) {
        throw new Error(`填写的工程量超过清单量! 清单量：${allowedQuantities}, 已填写量：${alreadyQuantities}`)
      }

      const num1 = new Decimal(allQuantities)
      const num2 = new Decimal(totalAllowedQuantities.unitPrice)
      const num3 = num1.times(num2)

      return await this.workPlaceListRepository.update(
        { id },
        {
          allQuantities: allQuantities,
          leftQuantities: leftQuantities,
          rightQuantities: rightQuantities,
          combinedPrice: Number(num3),
        },
      )
    } catch (e) {
      if (e instanceof Error) {
        throw new BadRequestException(e.message)
      } else {
        throw new BadRequestException('更新工程量失败')
      }
    }
  }

  /**
   * 获取工点列表，无分页
   * @param sortField
   * @param sortOrder
   * @param userInfo
   */
  async getListNoPage(sortField: string, sortOrder: Order, userInfo: User) {
    const queryBuilder = this.workPlaceRepository
      .createQueryBuilder('workplace')
      .orderBy(`workplace.${sortField}`, sortOrder)
    if (userInfo.tenantId !== ManagementGroup.ID) {
      queryBuilder.where('workplace.tenantId = :tenantId', { tenantId: userInfo.tenantId })
    }
    try {
      return await queryBuilder.getMany()
    } catch (e) {
      throw new BadRequestException('查询工点列表失败')
    }
  }

  /**
   * 查询清单工点列表(汇总)
   * @param userInfo
   */
  async getWorkPlaceRelevanceCollectList(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: string,
    userInfo: User,
  ) {
    try {
      const workPlaceList = await this.workPlaceRepository.find()
      let dynamicColumnsResult = ''

      workPlaceList.forEach((item) => {
        dynamicColumnsResult += `
      MAX(CASE WHEN wp.workplace_code= '${item.workPlaceCode}' THEN wpl.all_quantities ELSE 0 END) as '${item.workPlaceCode}_all_quantities',
      MAX(CASE WHEN wp.workplace_code= '${item.workPlaceCode}' THEN wpl.left_quantities ELSE 0 END) as '${item.workPlaceCode}_left_quantities',
      MAX(CASE WHEN wp.workplace_code= '${item.workPlaceCode}' THEN wpl.right_quantities ELSE 0 END) as '${item.workPlaceCode}_right_quantities',`
      })

      const dynamicColumns = dynamicColumnsResult.slice(0, -1)
      const finalSql = `
          SELECT list.serial_number,
                 list.list_code,
                 list.list_name,
                 list.list_characteristic,
                 list.quantities,
                 list.unit,
                 ${dynamicColumns}
          FROM sc_list AS list
                   LEFT JOIN
               sc_work_place_list AS wpl ON wpl.list_id = list.id and wpl.tenant_id = '${userInfo.tenantId}'
                   LEFT JOIN
               sc_work_place AS wp ON wp.id = wpl.work_placeId and wp.tenant_id = '${userInfo.tenantId}'
          GROUP BY list.list_code
          ORDER BY list.serial_number ASC
          limit ${(current - 1) * pageSize}, ${pageSize}`
      const total = `SELECT COUNT(*) AS total
                     FROM (
                              SELECT list.list_code
                              FROM sc_list AS list
                                       LEFT JOIN sc_work_place_list AS wpl ON wpl.list_id = list.id
                                       LEFT JOIN sc_work_place AS wp ON wp.id = wpl.work_placeId
                              GROUP BY list.list_code
                          ) AS subquery;`
      const totalNumber = await this.workPlaceListRepository.query(total)
      const list = await this.workPlaceListRepository.query(finalSql)
      return {
        results: list,
        current,
        pageSize,
        total: Number(totalNumber[0].total),
      }
    } catch (e) {
      console.log(e)
      throw new BadRequestException('查询工点列表失败')
    }
  }

  /**
   * 删除工点下关联的清单
   */
  async deleteWorkPlaceRelevanceList(ids: string[]) {
    try {
      return await this.workPlaceListRepository
        .createQueryBuilder()
        .delete()
        .from(WorkPlaceList)
        .where('id IN (:...ids)', { ids })
        .execute()
    } catch (e) {
      throw new BadRequestException('删除工点下关联的清单失败')
    }
  }
}
