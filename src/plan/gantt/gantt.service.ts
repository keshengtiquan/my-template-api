import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { CreateGanttDto } from './dto/create-gantt.dto'
import { UpdateGanttDto } from './dto/update-gantt.dto'
import { User } from '../../sys/user/entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Gantt } from './entities/gantt.entity'
import { Repository } from 'typeorm'
import { MyLoggerService } from '../../common/my-logger/my-logger.service'
import { handleTree } from '../../utils'
import * as dayjs from 'dayjs'
import { GanttList } from './entities/gantt-list.entity'
import { List } from '../../resource/list/entities/list.entity'
import { Order } from '../../types'

@Injectable()
export class GanttService {
  @InjectRepository(Gantt)
  private ganttRepository: Repository<Gantt>
  @InjectRepository(GanttList)
  private ganttListRepository: Repository<GanttList>
  @Inject()
  private loggerService: MyLoggerService

  async create(createGanttDto: CreateGanttDto, userInfo: User) {
    const gantt = new Gantt()
    gantt.text = createGanttDto.text
    gantt.startDate = createGanttDto.startDate
    gantt.duration = createGanttDto.duration
    gantt.endDate = createGanttDto.endDate
    gantt.parent = createGanttDto.parent
    gantt.createBy = userInfo.userName
    gantt.updateBy = userInfo.userName
    gantt.createDept = userInfo.deptId
    gantt.tenantId = userInfo.tenantId
    try {
      return await this.ganttRepository.manager.transaction(async (manager) => {
        const res = await manager.save(gantt)
        const tree = await manager.find(Gantt, {
          where: {
            tenantId: userInfo.tenantId,
          },
        })
        const newTree = handleTree(tree, 'id', 'parent')
        await this.updateDate(newTree)
        return res
      })
    } catch (e) {
      this.loggerService.error(`创建甘特图失败,错误信息：【${e.message}】`, Gantt.name)
      throw new BadRequestException('创建失败')
    }
  }
  /**
   *  获取甘特图(树形)
   */
  async getTree(userInfo: User) {
    try {
      const res = await this.ganttRepository.find({
        where: {
          tenantId: userInfo.tenantId,
        },
      })
      const tree = handleTree(res, 'id', 'parent')
      // await this.updateDate(tree)
      return tree
    } catch (e) {
      this.loggerService.error(`获取树形结构失败：【${e.message}】`, Gantt.name)
      throw new BadRequestException('获取失败')
    }
  }

  /**
   * 更新树形结构的日期和
   * @param data
   */
  async updateDate(data: any) {
    if (!data || data.length === 0) {
      return
    }

    for (const item of data) {
      if (item.children && item.children.length > 0) {
        await this.updateDate(item.children)

        const childEndDates = item.children.map((child) => dayjs(child.endDate))
        const childStartDates = item.children.map((child) => dayjs(child.startDate))

        const maxChildEndDate = new Date(Math.max.apply(null, childEndDates))
        const minChildStartDate = new Date(Math.min.apply(null, childStartDates))

        item.startDate = dayjs(minChildStartDate).format('YYYY-MM-DD')
        item.endDate = dayjs(maxChildEndDate).format('YYYY-MM-DD')

        item.duration = dayjs(maxChildEndDate).diff(dayjs(minChildStartDate), 'day') + 1
        await this.ganttRepository.update(
          { id: item.id },
          {
            startDate: item.startDate,
            endDate: item.endDate,
            duration: item.duration,
          },
        )
      }
    }
  }
  /**
   * 根据ID获取单条
   * @param id
   * @param userInfo
   */
  async getOneById(id: string, userInfo: User) {
    try {
      return await this.ganttRepository.findOne({
        where: {
          id,
          tenantId: userInfo.tenantId,
        },
      })
    } catch (e) {
      this.loggerService.error(`获取任务失败【${e.message}】`, Gantt.name)
      throw new BadRequestException('获取任务失败')
    }
  }

  /**
   *  更新甘特图任务
   * @param updateGanttDto
   * @param userInfo
   */
  async update(updateGanttDto: UpdateGanttDto, userInfo: User) {
    try {
      return await this.ganttRepository.manager.transaction(async (manager) => {
        const res = await manager.update(
          Gantt,
          { id: updateGanttDto.id },
          {
            text: updateGanttDto.text,
            startDate: updateGanttDto.startDate,
            duration: updateGanttDto.duration,
            endDate: updateGanttDto.endDate,
            parent: updateGanttDto.parent,
            updateBy: userInfo.userName,
          },
        )
        const tree = await manager.find(Gantt, {
          where: {
            tenantId: userInfo.tenantId,
          },
        })
        const newTree = handleTree(tree, 'id', 'parent')
        await this.updateDate(newTree)
        return res
      })
    } catch (e) {
      this.loggerService.error(`更新任务失败【${e.message}】`, Gantt.name)
      throw new BadRequestException('更新任务失败')
    }
  }

  /**
   *  删除甘特图任务
   * @param id
   * @param userInfo
   */
  async delete(id: string, userInfo: User) {
    try {
      return await this.ganttRepository.manager.transaction(async (manager) => {
        await manager.delete(Gantt, id)
        const tree = await manager.find(Gantt, {
          where: {
            tenantId: userInfo.tenantId,
          },
        })
        await this.ganttListRepository.delete({ ganttId: id })
        const newTree = handleTree(tree, 'id', 'parent')
        await this.updateDate(newTree)
        return '删除成功'
      })
    } catch (e) {
      this.loggerService.error(`删除任务失败【${e.message}】`, Gantt.name)
      throw new BadRequestException('删除任务失败')
    }
  }
  /**
   * 获取甘特图(列表)
   * @param userInfo
   */
  async getAll(userInfo: User) {
    try {
      const res = await this.ganttRepository
        .createQueryBuilder('gantt')
        .select([
          'gantt.id as id',
          'gantt.text as text',
          'gantt.startDate as start_date',
          'gantt.duration as duration',
          'gantt.parent as parent',
          'gantt.progress as progress',
          'gantt.endDate as end_date',
        ])
        .where('gantt.tenantId = :tenantId', { tenantId: userInfo.tenantId })
        .getRawMany()
      return res.map((item) => {
        item.end_date = dayjs(item.end_date).add(1, 'day').format('YYYY-MM-DD')
        return item
      })
    } catch (e) {
      this.loggerService.error(`获取甘特图失败【${e.message}】`, Gantt.name)
      throw new BadRequestException('获取甘特图失败')
    }
  }

  /**
   * 关联任务清单
   * @param ganttId
   * @param listIds
   * @param userInfo
   */
  async relevanceList(ganttId: string, listIds: string[], userInfo: User) {
    const data = listIds.map((item) => {
      return {
        tenantId: userInfo.tenantId,
        createDept: userInfo.deptId,
        createBy: userInfo.userName,
        updateBy: userInfo.userName,
        ganttId,
        listId: item,
      }
    })
    try {
      return await this.ganttListRepository.manager.transaction(async (manager) => {
        // await manager.delete(GanttList, { ganttId })
        return await manager.save(GanttList, data)
      })
    } catch (e) {
      this.loggerService.error(`关联任务清单失败【${e.message}】`, Gantt.name)
      throw new BadRequestException('关联任务清单失败')
    }
  }

  /**
   *  获取关联的任务ID(暂时弃用2024-01-11)
   * @param id
   * @param userInfo
   */
  async getRelevanceIds(id: string, userInfo: User) {
    try {
      const res = await this.ganttListRepository.find({
        where: {
          ganttId: id,
          tenantId: userInfo.tenantId,
        },
        select: ['listId'],
      })
      return res.map((item) => {
        return item.listId
      })
    } catch (e) {
      this.loggerService.error(`获取关联的任务ID失败【${e.message}】`, Gantt.name)
      throw new BadRequestException('获取关联的任务ID失败')
    }
  }
  /**
   * 根据甘特图的任务ID获取已关联的清单
   * @param ganttId
   * @param userInfo
   */
  async getRelevanceList(
    ganttId: string,
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    userInfo: User,
  ) {
    const queryBuilder = this.ganttListRepository
      .createQueryBuilder('gl')
      .leftJoinAndSelect(List, 'list', 'gl.listId = list.id')
      .select([
        'list.serialNumber as serialNumber',
        'list.listCode as listCode',
        'list.listName as listName',
        'list.listCharacteristic as listCharacteristic',
        'list.unit as unit',
        'gl.id as id',
      ])
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .orderBy(`list.${sortField}`, sortOrder)
      .where('gl.tenantId = :tenantId', { tenantId: userInfo.tenantId })
      .andWhere('gl.ganttId = :ganttId', { ganttId: ganttId })
    try {
      const list = await queryBuilder.getRawMany()
      return {
        results: list,
        current,
        pageSize,
        total: await queryBuilder.getCount(),
      }
    } catch (e) {
      this.loggerService.error(`根据甘特图的任务ID获取已关联的清单失败【${e.message}】`, Gantt.name)
      throw new BadRequestException('根据甘特图的任务ID获取已关联的清单失败')
    }
  }

  /**
   * 删除关联清单
   * @param id
   * @param userInfo
   */
  async deleteRelevanceList(id: string, userInfo: User) {
    try {
      return await this.ganttListRepository.delete({ id, tenantId: userInfo.tenantId })
    } catch (e) {
      this.loggerService.error(`删除关联清单失败【${e.message}】`, Gantt.name)
      throw new BadRequestException('删除关联清单失败')
    }
  }
}
