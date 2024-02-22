import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { CreateIssuedDto } from './dto/create-issued.dto'
import { MyLoggerService } from '../../common/my-logger/my-logger.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Issued } from './entities/issued.entity'
import { Repository } from 'typeorm'
import { List } from '../../resource/list/entities/list.entity'
import { GanttList } from '../gantt/entities/gantt-list.entity'
import { Gantt } from '../gantt/entities/gantt.entity'
import { User } from '../../sys/user/entities/user.entity'
import {
  format,
  getQuarter,
  getWeek,
  getMonth,
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { Dept } from '../../sys/dept/entities/dept.entity'
import { DeptTypeEnum } from '../../enmus'
import { Order } from '../../types'
import { DeptService } from '../../sys/dept/dept.service'
import { ProjectLogDetail } from '../../project-log/entities/project-log-detail.entity'

@Injectable()
export class IssuedService {
  @Inject()
  private loggerService: MyLoggerService
  @Inject()
  private deptService: DeptService

  @InjectRepository(Issued)
  private issuedRepository: Repository<Issued>
  @InjectRepository(List)
  private listRepository: Repository<List>
  @InjectRepository(Dept)
  private deptRepository: Repository<Dept>

  /**
   * 生成计划
   * 生成要判断任务是否已经完成，完成的不生成
   * @param createIssuedDto
   */
  async generatePlan(createIssuedDto: CreateIssuedDto, userInfo: User) {
    const planTime = this.getNameFromDateAndType(createIssuedDto.currentDate, createIssuedDto.planType)
    const listQueryBuilder = this.listRepository
      .createQueryBuilder('list')
      .leftJoin(GanttList, 'gl', 'gl.listId = list.id')
      .leftJoin(Gantt, 'g', 'g.id = gl.ganttId')
      .leftJoin(ProjectLogDetail, 'pld', 'pld.list_id = list.id')
      .select([
        'list.id as listId',
        'list.quantities as quantities',
        'COALESCE(CAST(SUM(pld.completion_quantity)AS DECIMAL(18, 2)),0) as completionQuantity',
      ])
      .where('(g.start_date BETWEEN :startDate AND :endDate)', {
        startDate: planTime.startDate,
        endDate: planTime.endDate,
      })
      .orWhere('(g.end_date BETWEEN :startDate AND :endDate)', {
        startDate: planTime.startDate,
        endDate: planTime.endDate,
      })
      .orWhere(':startDate BETWEEN g.start_date AND g.end_date', { startDate: planTime.startDate })
      .andWhere('list.tenantId =:tenantId', { tenantId: userInfo.tenantId })
      .groupBy('list.id')
      .addGroupBy('list.quantities')
    const workAreaQueryBuilder = this.deptRepository
      .createQueryBuilder('dept')
      .select('dept.id', 'workAreaId')
      .where('dept.tenantId=:tenantId', { tenantId: userInfo.tenantId })
      .andWhere('dept.deptType =:deptType', { deptType: DeptTypeEnum.TEAM })

    try {
      const listIds = await listQueryBuilder.getRawMany()
      const workAreaIds = await workAreaQueryBuilder.getRawMany()
      const data: any[] = []
      console.log(listIds)
      listIds
        .filter((item) => {
          return item.quantities > item.completionQuantity
        })
        .forEach((listId) => {
          workAreaIds.forEach((workAreaId) => {
            data.push({
              planType: createIssuedDto.planType,
              planName: planTime.name,
              listId: listId.listId,
              workAreaId: workAreaId.workAreaId,
              year: planTime.year,
              quarter: planTime.quarter,
              month: planTime.month,
              week: planTime.week,
              startDate: planTime.startDate,
              endDate: planTime.endDate,
              createBy: userInfo.userName,
              updateBy: userInfo.userName,
              createDept: userInfo.deptId,
              tenantId: userInfo.tenantId,
            })
          })
        })
      return await this.issuedRepository.manager.transaction(async (manager) => {
        await this.issuedRepository.delete({
          tenantId: userInfo.tenantId,
          planType: createIssuedDto.planType,
          ...(planTime.year && { year: planTime.year }),
          ...(planTime.quarter && { quarter: planTime.quarter }),
          ...(planTime.month && { month: planTime.month }),
          ...(planTime.week && { week: planTime.week }),
        })
        return await manager.save(Issued, data)
      })
      // const result = await this.issuedRepository.save(data)
    } catch (e) {
      this.loggerService.error(`生成计划失败【${e.message}】`, Issued.name)
      throw new BadRequestException('生成计划失败')
    }
  }

  /**
   * 生成计划的事件范围
   * @param date
   * @param type
   */
  getNameFromDateAndType(date: Date, type: string) {
    if (type === 'year') {
      const yearName = format(date, 'yyyy年计划')
      const log = format(date, 'yyyy')
      const yearStartDate = format(startOfYear(new Date(parseInt(log), 0)), 'yyyy-MM-dd')
      const yearEndOfYear = format(endOfYear(new Date(parseInt(log), 0)), 'yyyy-MM-dd')
      return { name: yearName, type: 'year', year: Number(log), startDate: yearStartDate, endDate: yearEndOfYear }
    } else if (type === 'quarter') {
      const quarter = getQuarter(date)
      const quarterName = `第${quarter}季度`
      const quarterStartDate = format(startOfQuarter(date), 'yyyy-MM-dd')
      const quarterEndDate = format(endOfQuarter(date), 'yyyy-MM-dd')
      const year = Number(format(date, 'yyyy'))
      return {
        name: `${format(date, 'yyyy年')}${quarterName}计划`,
        type: 'quarter',
        year: year,
        quarter: quarter,
        startDate: quarterStartDate,
        endDate: quarterEndDate,
      }
    } else if (type === 'month') {
      const year = Number(format(date, 'yyyy'))
      const quarter = getQuarter(date)
      const month = getMonth(date)
      const monthName = `${month + 1}月`
      const monthStartDate = format(startOfMonth(date), 'yyyy-MM-dd')
      const monthEndDate = format(endOfMonth(date), 'yyyy-MM-dd')
      return {
        name: `${format(date, 'yyyy年')}${monthName}计划`,
        year,
        quarter,
        month: month + 1,
        type: 'month',
        startDate: monthStartDate,
        endDate: monthEndDate,
      }
    } else if (type === 'week') {
      const year = Number(format(date, 'yyyy'))
      const quarter = getQuarter(date)
      const month = getMonth(date)
      const week = getWeek(date)
      const weekStartDate = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const weekEndDate = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      return {
        name: `${format(date, 'yyyy年')}第${week}周计划(${month + 1}月)`,
        year,
        quarter,
        month: month + 1,
        week: week,
        type: 'week',
        startDate: weekStartDate,
        endDate: weekEndDate,
      }
    }
  }
  /**
   * 查询是否有重复的计划
   * @param createIssuedDto
   * @param userInfo
   */
  async hasRepeat(createIssuedDto: CreateIssuedDto, userInfo: User) {
    const planTime = this.getNameFromDateAndType(createIssuedDto.currentDate, createIssuedDto.planType)
    try {
      const res = await this.issuedRepository.findOne({
        where: {
          planType: planTime.type,
          planName: planTime.name,
          ...(planTime.year && { year: planTime.year }),
          ...(planTime.quarter && { quarter: planTime.quarter }),
          ...(planTime.month && { month: planTime.month }),
          ...(planTime.week && { week: planTime.week }),
          tenantId: userInfo.tenantId,
        },
      })
      return res ? true : false
    } catch (e) {
      this.loggerService.error(`查询重复计划失败【${e.message}】`, Issued.name)
      throw new BadRequestException('查询重复计划失败')
    }
  }
  /**
   * 查询计划列表
   * @param createIssuedDto
   * @param userInfo
   */
  async getPlanList(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    planType: string,
    planName: string,
    userInfo: User,
  ) {
    // const queryBuilder = this.issuedRepository
    //   .createQueryBuilder('issued')
    //   .skip((current - 1) * pageSize)
    //   .take(pageSize)
    //   .orderBy(`issued.${sortField}`, sortOrder)
    //   .where('issued.tenantId =:tenantId', { tenantId: userInfo.tenantId })
    // if (planType) {
    //   queryBuilder.andWhere('issued.planType = :planType', { planType })
    // }
    // if (planName) {
    //   queryBuilder.andWhere('issued.planName like :planName', { planName: `%${planName}%` })
    // }
    const queryBuilder = this.issuedRepository
      .createQueryBuilder('i')
      .select([
        'i.plan_name as planName',
        'i.plan_type as planType',
        'i.start_date as startDate',
        'i.end_date as endDate',
        'i.year as year',
        'CAST(SUM(CASE WHEN i.plan_type = :planType THEN list.unit_price * i.work_area_quantities ELSE NULL END) AS DECIMAL(10, 2)) AS planOutPutValue',
      ])
      .leftJoin(List, 'list', 'list.id = i.list_id')
      .where('i.tenant_id = :tenantId', { tenantId: userInfo.tenantId })
      .groupBy('i.plan_name')
      .addGroupBy('i.plan_type')
      .addGroupBy('i.start_date')
      .addGroupBy('i.end_date')
      .addGroupBy('i.year')
      .orderBy(`i.${sortField}`, sortOrder)
      .skip((current - 1) * pageSize)
      .take(pageSize)
    const totalQueryBuilder = this.issuedRepository
      .createQueryBuilder('i')
      .select(['COUNT(DISTINCT plan_name) AS rowCount'])
      .where('i.plan_type = :planType', { planType })
      .andWhere('i.tenant_id = :tenantId', { tenantId: userInfo.tenantId })
      .skip((current - 1) * pageSize)
      .take(pageSize)
    if (planType) {
      queryBuilder.andWhere('i.planType = :planType', { planType })
      totalQueryBuilder.andWhere('i.planType = :planType', { planType })
    }
    if (planName) {
      queryBuilder.andWhere('i.planName like :planName', { planName: `%${planName}%` })
      totalQueryBuilder.andWhere('i.planName like :planName', { planName: `%${planName}%` })
    }
    try {
      const list = await queryBuilder.getRawMany()
      const [total] = await totalQueryBuilder.getRawMany()
      return {
        results: list,
        current,
        pageSize,
        total: Number(total.rowCount),
      }
    } catch (e) {
      this.loggerService.error(`查询计划列表失败【${e.message}】`, Issued.name)
      throw new BadRequestException('查询计划列表失败')
    }
  }

  /**
   * 查询计划详情
   * @constructor
   */
  async getPlanDetail(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    planName: string,
    listCode: string,
    listName: string,
    listCharacteristic: string,
    userInfo: User,
  ) {
    const workAreaQueryBuilder = this.deptRepository
      .createQueryBuilder('dept')
      .select(['dept.id as id', 'dept.deptName as deptName'])
      .where('dept.tenantId=:tenantId', { tenantId: userInfo.tenantId })
      .andWhere('dept.deptType =:deptType', { deptType: DeptTypeEnum.TEAM })
    try {
      const workArea = await workAreaQueryBuilder.getRawMany()
      let dynamicColumnsResult = ''
      workArea.forEach((item) => {
        dynamicColumnsResult += `MAX(CASE WHEN i.work_area_id= '${item.id}' THEN i.work_area_quantities ELSE 0 END) as '${item.id}',`
      })
      const dynamicColumns = dynamicColumnsResult.slice(0, -1)
      let countSql = `
        select
        COUNT(DISTINCT i.list_id) as total
        from sc_issued i
        left join sc_list list on list.id = i.list_id
        where i.tenant_id = '${userInfo.tenantId}' and i.plan_name = '${planName}'
      `
      let listSql = `select
        list.list_code as listCode,list.serial_number as serialNumber,list.list_name as listName,
        list.list_characteristic as listCharacteristic,list.unit as unit,list.quantities as quantities,
        list.id as id,list.unit_price as unitPrice,
        ${dynamicColumns}
        from sc_list list
        left join sc_issued i on i.list_id = list.id
        where i.tenant_id = '${userInfo.tenantId}' and i.plan_name = '${planName}'`
      if (listCode) {
        listSql += ` and list.list_code = '${listCode}'`
        countSql += ` and list.list_code = '${listCode}'`
      }
      if (listName) {
        listSql += ` and list.list_name like '%${listName}%'`
        countSql += ` and list.list_name like '%${listName}%'`
      }
      if (listCharacteristic) {
        listSql += ` and list.list_characteristic like '%${listName}%'`
        countSql += ` and list.list_characteristic like '%${listName}%'`
      }
      listSql += `
        group by list.list_code,list.serial_number,list.list_name,list.list_characteristic,list.unit,list.quantities,list.id,list.unit_price
        ORDER BY list.${sortField} ${sortOrder}
        limit ${(current - 1) * pageSize}, ${pageSize}`
      const list = await this.listRepository.query(listSql)
      const [total] = await this.issuedRepository.query(countSql)
      return { results: list, current, pageSize, total: Number(total.total) }
    } catch (e) {
      this.loggerService.error(`查询计划详情失败【${e.message}】`, Issued.name)
      throw new BadRequestException('查询计划详情失败')
    }
  }

  /**
   * 更新计划详情
   * @param listId
   * @param workAreaId
   * @param workAreaQuantities
   * @param planName
   * @param userInfo
   */
  async updatePlanDetail(listId: string, planQuantities: Record<string, number>, planName: string, userInfo: User) {
    try {
      const issuedList = await this.issuedRepository.find({
        where: {
          planName: planName,
          listId: listId,
          tenantId: userInfo.tenantId,
        },
      })
      issuedList.forEach((item) => {
        item.workAreaQuantities = planQuantities[item.workAreaId]
      })
      return await this.issuedRepository.save(issuedList)
    } catch (e) {
      this.loggerService.error(`更新计划详情失败【${e.message}】`, Issued.name)
      throw new BadRequestException('更新计划详情失败')
    }
  }

  /**
   * 删除计划详情
   * @param planName
   * @param listId
   * @param userInfo
   */
  async deletePlanDetail(planName: string, listId: string, userInfo: User) {
    try {
      return await this.issuedRepository
        .createQueryBuilder()
        .delete()
        .from(Issued)
        .where('planName = :planName', { planName: planName })
        .andWhere('listId = :listId', { listId: listId })
        .andWhere('tenantId = :tenantId', { tenantId: userInfo.tenantId })
        .execute()
    } catch (e) {
      this.loggerService.error(`删除计划详情失败【${e.message}】`, Issued.name)
      throw new BadRequestException('删除计划详情失败')
    }
  }

  /**
   * 添加计划详情
   * @param listIds
   * @param planName
   */
  async addList(listIds: string[], planName: string, userInfo: User) {
    try {
      const alreadyExist = await this.issuedRepository.findOne({
        where: { planName: planName },
        select: ['planType', 'planName', 'startDate', 'endDate', 'year', 'quarter', 'month', 'week'],
      })
      const workAreas = await this.deptService.getWorkArea(userInfo)
      const data: any[] = []
      listIds.forEach((listId) => {
        workAreas.forEach((workArea) => {
          data.push({
            planType: alreadyExist.planType,
            planName: alreadyExist.planName,
            listId: listId,
            workAreaId: workArea.id,
            year: alreadyExist.year,
            quarter: alreadyExist.quarter,
            month: alreadyExist.month,
            week: alreadyExist.week,
            startDate: alreadyExist.startDate,
            endDate: alreadyExist.endDate,
            createBy: userInfo.userName,
            updateBy: userInfo.userName,
            createDept: userInfo.deptId,
            tenantId: userInfo.tenantId,
          })
        })
      })
      return await this.issuedRepository.save(data)
    } catch (e) {
      this.loggerService.error(`添加计划详情失败【${e.message}】`, Issued.name)
      throw new BadRequestException('添加计划详情失败')
    }
  }
}
