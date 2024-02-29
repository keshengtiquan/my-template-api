import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { User } from '../../sys/user/entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { SectionDivision } from './entities/section-division.entity'
import { Dept } from '../../sys/dept/entities/dept.entity'
import { Order } from '../../types'
import { ManagementGroup } from '../../enmus'
import { UpdateSectionDivisionDto } from './dto/update-section-division.dto'
import { List } from '../list/entities/list.entity'
import { WorkPlaceList } from '../workplace/entities/workplace.list.entity'
import Decimal from 'decimal.js'
import { WorkPlace, WorkPlaceType } from '../workplace/entities/workplace.entity'
import { MyLoggerService } from '../../common/my-logger/my-logger.service'

@Injectable()
export class SectionDivisionService {
  @InjectRepository(SectionDivision)
  private readonly sectionDivisionRepository: Repository<SectionDivision>
  @InjectRepository(List)
  private readonly listRepository: Repository<List>
  @InjectRepository(WorkPlaceList)
  private readonly workPlaceListRepository: Repository<WorkPlaceList>
  @InjectRepository(WorkPlace)
  private readonly workPlaceRepository: Repository<WorkPlace>
  @Inject()
  private loggerService: MyLoggerService

  /**
   * 查询列表
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param userInfo
   */
  async findAll(current: number, pageSize: number, sortField: string, sortOrder: Order, userInfo: User) {
    const queryBuilder = this.sectionDivisionRepository
      .createQueryBuilder('sd')
      .leftJoinAndSelect(Dept, 'dept', 'sd.deptId = dept.id')
      .select([
        'dept.deptName as deptName',
        'sd.createBy as createBy',
        'sd.createTime as createTime',
        'sd.id as id',
        'sd.updateBy as updateBy',
        'sd.updateTime as updateTime',
        'sd.sector as sector',
        'sd.principal as principal',
        'sd.outputValue as outputValue',
        'sd.workPlaceIds as workPlaceIds',
        'sd.listIds as listIds',
      ])
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .orderBy(`sd.${sortField}`, sortOrder)
    if (userInfo.tenantId !== ManagementGroup.ID) {
      queryBuilder.andWhere('sd.tenantId = :tenantId', {
        tenantId: userInfo.tenantId,
      })
    }
    try {
      const list = await queryBuilder.getRawMany()
      return {
        results: list,
        current,
        pageSize,
        total: await queryBuilder.getCount(),
      }
    } catch (e) {
      throw new BadRequestException('查询列表失败')
    }
  }

  /**
   * 更新区段的工点和清单等
   * @param updateSectionDivisionDto
   * @param userInfo
   */
  async update(updateSectionDivisionDto: UpdateSectionDivisionDto, userInfo: User) {
    if (updateSectionDivisionDto.listIds.length === 0) {
      throw new BadRequestException('清单不能为空')
    }
    if (updateSectionDivisionDto.workPlaceIds.length === 0) {
      throw new BadRequestException('工点不能为空')
    }

    try {
      await this.sectionDivisionRepository.manager.transaction(async () => {
        // const oldSectionDivision = await manager.findOne(SectionDivision, {
        //   where: { id: updateSectionDivisionDto.id, tenantId: userInfo.tenantId },
        // })
        // const newListIds = [
        //   ...new Set([...JSON.parse(oldSectionDivision.listIds), ...updateSectionDivisionDto.listIds]),
        // ]
        // const newWorkPlaceIds = [
        //   ...new Set([...JSON.parse(oldSectionDivision.workPlaceIds), ...updateSectionDivisionDto.workPlaceIds]),
        // ]
        return await this.sectionDivisionRepository.update(
          { id: updateSectionDivisionDto.id },
          {
            listIds: JSON.stringify(updateSectionDivisionDto.listIds),
            workPlaceIds: JSON.stringify(updateSectionDivisionDto.workPlaceIds),
            updateBy: userInfo.userName,
          },
        )
      })
    } catch (e) {
      throw new BadRequestException('更新失败')
    }
  }

  /**
   * 获取区段的清单列表
   */
  async getSectionDivisionList(current: number, pageSize: number, id: string, userInfo: User) {
    try {
      const sectionDivision = await this.sectionDivisionRepository.findOne({
        where: { id: id, tenantId: userInfo.tenantId },
      })
      if (!sectionDivision || !sectionDivision.listIds || JSON.parse(sectionDivision.listIds).length === 0) {
        // throw new Error('该区段没有清单')
        return []
      }
      if (!sectionDivision.workPlaceIds || JSON.parse(sectionDivision.workPlaceIds).length === 0) {
        return []
      }
      const listIds = JSON.parse(sectionDivision.listIds)
      const workPlaceIds = JSON.parse(sectionDivision.workPlaceIds)

      const queryBuilder = this.listRepository
        .createQueryBuilder('list')
        .select([
          'list.serial_number as serialNumber',
          'list.list_name as listName',
          'list.unit as unit',
          'SUM(wpl.all_quantities) as totalQuantities',
          'list.unit_price as unitPrice',
          'list.list_characteristic as listCharacteristic',
          'list.list_code as listCode',
          'list.id as id',
        ])
        .leftJoin(
          (subQuery) =>
            subQuery
              .select('*')
              .from(WorkPlaceList, 'wpl')
              .where('wpl.work_placeId IN (:...workPlaceIds)', { workPlaceIds })
              .andWhere('wpl.tenantId= :tenantId', { tenantId: userInfo.tenantId }),
          'wpl',
          'wpl.list_id = list.id',
        )
        .where('list.id IN (:...listIds)', { listIds })
        .groupBy(
          'list.serial_number, list.id, list.list_name, list.unit,list.unit_price,list.list_characteristic,list.list_code',
        )

      const list = await queryBuilder
        .skip((current - 1) * pageSize)
        .take(pageSize)
        .orderBy('list.serial_number', 'ASC')
        .getRawMany()
      const results = list.map((item: any) => {
        const { unitPrice } = item
        let { totalQuantities } = item
        if (totalQuantities === null) {
          totalQuantities = 0
        }
        const unitPrice1 = new Decimal(unitPrice)
        const totalQuantities1 = new Decimal(totalQuantities)
        const totalPrice = unitPrice1.times(totalQuantities1)
        return {
          ...item,
          totalPrice,
        }
      })
      // 更新产值
      const outputValue = results.reduce((total, item) => {
        return total + parseFloat(item.totalPrice)
      }, 0)
      await this.sectionDivisionRepository.update(id, {
        outputValue: outputValue,
      })
      return {
        results: results,
        current,
        pageSize,
        total: await queryBuilder.getCount(),
      }
    } catch (e) {
      if (e instanceof Error) {
        throw new BadRequestException(e.message)
      } else {
        throw new BadRequestException('更新工程量失败')
      }
    }
  }

  /**
   * 删除区段中已选择的清单
   * @param listId 清单的ID
   * @param id 区段ID
   * @param userInfo
   */
  async deleteSectionDivisionList(listId: string, id: string, userInfo: User) {
    try {
      await this.sectionDivisionRepository.manager.transaction(async (manager) => {
        const sectionDivision = await manager.findOne(SectionDivision, {
          where: {
            id,
            tenantId: userInfo.tenantId,
          },
        })
        if (!JSON.parse(sectionDivision.listIds).includes(listId)) {
          return
        }
        const newListIds = JSON.parse(sectionDivision.listIds).filter((item: string) => item !== listId)
        await manager.update(SectionDivision, { id }, { listIds: JSON.stringify(newListIds) })
      })
    } catch (e) {
      throw new BadRequestException('删除清单失败')
    }
  }

  /**
   * 获取区段中的工点名称
   * @param id
   * @param userInfo
   */
  async getSectionDivisionWorkPlaceName(id: string, userInfo: User) {
    try {
      const res = await this.workPlaceRepository.manager.transaction(async (manager) => {
        const sectionDivision = await this.sectionDivisionRepository.findOne({
          where: { id: id, tenantId: userInfo.tenantId },
        })
        if (!sectionDivision || sectionDivision.workPlaceIds === '[]') {
          return null
        }
        const workPlaceIds = JSON.parse(sectionDivision.workPlaceIds)

        const workplace = await manager
          .createQueryBuilder()
          .from(WorkPlace, 'wp')
          .where('wp.id IN (:...ids)', { ids: workPlaceIds })
          .getRawMany()
        return workplace
      })
      return res
    } catch (e) {
      throw new BadRequestException('获取工点名称失败')
    }
  }

  /**
   * 更新责任区段和责任人
   * @param id
   * @param sector
   * @param principal
   * @param userInfo
   */
  async updateSectorAndPrincipal(id: string, sector: string, principal: string, userInfo: User) {
    try {
      return await this.sectionDivisionRepository.update(
        { id: id },
        {
          sector: sector,
          principal: principal,
          updateBy: userInfo.userName,
        },
      )
    } catch (e) {
      throw new BadRequestException('更新责任区段和责任人失败')
    }
  }

  /**
   * 获取区段中的清单id和工点id
   * @param id
   * @param userInfo
   */
  async getListsAndWorkplace(id: string, userInfo: User) {
    try {
      const sectionDivision = await this.sectionDivisionRepository.findOne({
        where: {
          id: id,
          tenantId: userInfo.tenantId,
        },
        select: ['listIds', 'workPlaceIds'],
      })
      const wpIds: string[] = JSON.parse(sectionDivision.workPlaceIds)
      const workplace = await this.workPlaceRepository.find({
        where: {
          id: In(wpIds),
        },
        select: ['id', 'workPlaceType'],
      })
      return {
        listIds: JSON.parse(sectionDivision.listIds),
        stationList: workplace.filter((item) => item.workPlaceType === WorkPlaceType.STATION).map((item) => item.id),
        sectionList: workplace.filter((item) => item.workPlaceType === WorkPlaceType.SECTION).map((item) => item.id),
      }
    } catch (e) {
      this.loggerService.error(`获取区段中的清单id和工点id失败-【${e.message}】`, SectionDivision.name)
      throw new BadRequestException('获取区段中的清单id和工点id失败')
    }
  }
}
