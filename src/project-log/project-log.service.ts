import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { MyLoggerService } from '../common/my-logger/my-logger.service'
import { InjectRepository } from '@nestjs/typeorm'
import { ProjectLog } from './entities/project-log.entity'
import { Repository } from 'typeorm'
import { ProjectLogDetail } from './entities/project-log-detail.entity'
import { Tenant } from '../sys/tenant/entities/tenant.entity'
import * as dayjs from 'dayjs'
import { User } from '../sys/user/entities/user.entity'
import { Order } from '../types'
import { DeptService } from '../sys/dept/dept.service'
import { endOfWeek, format, startOfWeek } from 'date-fns'
import { Issued } from '../plan/issued/entities/issued.entity'
import { Gantt } from '../plan/gantt/entities/gantt.entity'
import { Dept } from 'src/sys/dept/entities/dept.entity'
import { WorkPlace } from 'src/resource/workplace/entities/workplace.entity'
import Decimal from 'decimal.js'
@Injectable()
export class ProjectLogService {
  @Inject()
  private loggerService: MyLoggerService
  @Inject()
  private deptService: DeptService

  @InjectRepository(ProjectLog)
  private readonly projectLogRepository: Repository<ProjectLog>
  @InjectRepository(ProjectLogDetail)
  private readonly projectLogDetailRepository: Repository<ProjectLogDetail>
  @InjectRepository(Tenant)
  private readonly tenantRepository: Repository<Tenant>
  @InjectRepository(Issued)
  private readonly issuedRepository: Repository<Issued>
  @InjectRepository(Gantt)
  private readonly ganttRepository: Repository<Gantt>
  /**
   * 自动生成日志
   */
  async generateLog(date: string) {
    const fillDate = dayjs(date).format('YYYY-MM-DD')
    try {
      const tenants = await this.tenantRepository.find({
        select: ['id'],
      })
      const logs = await this.projectLogRepository.find({
        where: {
          fillDate: fillDate,
        },
      })
      const planDate = await this.ganttRepository
        .createQueryBuilder('g')
        .select(['MIN(g.start_date) as startDate', 'MAX(g.end_date) as endDate', 'g.tenant_id as tenantId'])
        .groupBy('g.tenant_id')
        .getRawMany()
      const data = []
      tenants.forEach((tenant) => {
        const hasLogForTenant = logs.some((log) => log.tenantId === tenant.id)
        const startEndDate = planDate.find((item) => item.tenantId === tenant.id)
        if (
          !hasLogForTenant &&
          startEndDate &&
          this.isInsideTimeRange(startEndDate.startDate, startEndDate.endDate, fillDate)
        ) {
          data.push({
            fillDate: fillDate,
            createBy: 'system',
            updateBy: 'system',
            tenantId: tenant.id,
          })
        }
      })
      if (data.length > 0) {
        await this.projectLogRepository.save(data)
        return '生成日志成功'
      } else {
        return '没有需要生成日志'
      }
    } catch (e) {
      this.loggerService.error(`生成日志失败【${e.message}】`, ProjectLog.name)
    }
  }
  isInsideTimeRange(startDate: string, endDate: string, currentDate: string) {
    const startDateTime = new Date(startDate).getTime()
    const endDateTime = new Date(endDate).getTime()
    const currentDateTime = new Date(currentDate).getTime()
    return currentDateTime >= startDateTime && currentDateTime <= endDateTime
  }
  /**
   * 获取日志列表
   */
  async getLogList(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    fillDate: any,
    fillUser: any,
    userInfo: User,
  ) {
    const workAreaList = await this.deptService.getWorkArea(userInfo)
    const workAreaIds = workAreaList.map((item) => item.id).join(',')
    let dynamicColumnsResult = ''
    if (workAreaList.length === 0) return []

    workAreaList.forEach((item) => {
      dynamicColumnsResult += `CAST(SUM(CASE WHEN pld.work_area_id= '${item.id}' THEN pld.completion_quantity * list.unit_price ELSE 0 END)AS DECIMAL(10, 2)) as '${item.id}',`
    })
    dynamicColumnsResult += `CAST(SUM(CASE WHEN pld.work_area_id IN (${workAreaIds}) THEN pld.completion_quantity * list.unit_price ELSE 0 END)AS DECIMAL(10, 2)) as 'outPutValue'`
    let countSql = `select count(id) as total from sc_project_log where tenant_id = '${userInfo.tenantId}'`
    let listSql = `
        select pl.fill_date   as fillDate,
               pl.fill_user   as fillUser,
               pl.id          as id,
               pl.create_by   as createBy,
               pl.create_time as createTime,
               pl.update_by   as updateBy,
               pl.update_time as updateTime,
               ${dynamicColumnsResult}
        from sc_project_log as pl
                 LEFT JOIN sc_project_log_detail as pld on pl.id = pld.log_id
                 LEFT JOIN sc_list as list on list.id = pld.list_id
        where pl.tenant_id = '${userInfo.tenantId}'`
    if (fillDate) {
      listSql += ` and pl.fill_date = '${fillDate}'`
      countSql += ` and fill_date = '${fillDate}'`
    }
    if (fillUser) {
      listSql += ` and pl.fill_user like '%${fillUser}%'`
      countSql += ` and fill_user like '%${fillUser}%'`
    }
    listSql += `GROUP BY pl.id,pl.fill_date, pl.fill_user, pl.create_by, pl.create_time, pl.update_by, pl.update_time
        ORDER BY pl.${sortField} ${sortOrder}
        limit ${(current - 1) * pageSize}, ${pageSize}`

    try {
      const list = await this.projectLogRepository.query(listSql)
      const [{ total }] = await this.projectLogRepository.query(countSql)
      return {
        results: list,
        total: Number(total),
        current: current,
        pageSize: pageSize,
      }
    } catch (e) {
      this.loggerService.error(`获取日志列表失败【${e.message}】`, ProjectLog.name)
      throw new BadRequestException('获取日志列表失败')
    }
  }

  /**
   * 查询日志详细信息
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param userInfo
   */
  async getLogDetailList(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    fillDate: string,
    logId: string,
    workAreaId: string,
    userInfo: User,
  ) {
    const logs = await this.projectLogDetailRepository.find({
      where: {
        logId: logId,
        tenantId: userInfo.tenantId,
      },
    })
    if (logs.length === 0) {
      // 没有日志信息，创建信息
      const date = new Date(fillDate)
      const weekStartDate = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const weekEndDate = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const workAreaData = await this.deptService.getWorkArea(userInfo)
      const finalSql = `select distinct i.list_id, sl.quantities, t1.com
                        from sc_issued i
                        left join sc_list sl on i.list_id = sl.id
                        left join (select list_id, COALESCE(SUM(completion_quantity),0) as com from sc_project_log_detail group by list_id) as t1 on t1.list_id = i.list_id
                        where i.plan_type='week' and i.start_date='${weekStartDate}' and i.end_date='${weekEndDate}' and i.tenant_id='${userInfo.tenantId}'
                        having if(COALESCE(t1.com, 0) < sl.quantities,1,0);`
      const weekPlanList = await this.issuedRepository.query(finalSql)
      const data = []

      workAreaData.forEach((workArea) => {
        weekPlanList.forEach((plan) => {
          data.push({
            logId: logId,
            listId: plan.list_id,
            workAreaId: workArea.id,
            tenantId: userInfo.tenantId,
            createBy: 'system',
            updateBy: 'system',
            createDept: userInfo.deptId,
            completionQuantity: 0,
          })
        })
      })
      await this.projectLogDetailRepository.save(data)
    }
    //查询列表
    let listSql = `SELECT   
                            list.id                                                           as listId,
                            list.serial_number                                                as serialNumber,
                            list.list_code                                                    as listCode,
                            list.list_name                                                    as listName,
                            list.list_characteristic                                          as listCharacteristic,
                            list.unit                                                         as unit,
                            list.quantities                                                   as quantities,
                            list.unit_price                                                   as unitPrice,
                            pld.log_id                                                        as logId,
                            MAX(pld.create_time)                                              as createTime,
                            MAX(pld.update_time)                                              as updateTime,
                            COALESCE(CAST(SUM(pld.completion_quantity) AS DECIMAL(18, 2)), 0) as completionQuantity
                     FROM sc_project_log_detail pld
                              LEFT JOIN sc_list list on pld.list_id = list.id
                     WHERE pld.tenant_id = ${userInfo.tenantId} and pld.log_id=${logId}`
    let totalSql = `SELECT COUNT(DISTINCT list.id) as total
                    FROM sc_project_log_detail pld
                             LEFT JOIN sc_list list on pld.list_id = list.id
                    WHERE pld.tenant_id = ${userInfo.tenantId} and pld.log_id=${logId}`
    const workAreaList = await this.deptService.getWorkArea(userInfo)
    if (workAreaList.length > 0) {
      const workAreaIdList = workAreaList.map((item) => item.id)
      if (workAreaIdList.includes(workAreaId)) {
        listSql += ` and pld.work_area_id = ${workAreaId}`
        totalSql += ` and pld.work_area_id = ${workAreaId}`
      }
    }
    listSql += ` GROUP BY listId, serialNumber, listCode, listName, listCharacteristic, unit, quantities, unitPrice,
                              logId
                     ORDER BY list.serial_number ASC limit ${(current - 1) * pageSize}, ${pageSize}`
    try {
      const list = await this.projectLogDetailRepository.query(listSql)
      const [total] = await this.projectLogDetailRepository.query(totalSql)
      return {
        results: list,
        current,
        total: Number(total.total),
        pageSize,
      }
    } catch (e) {
      this.loggerService.error(`获取日志详细信息失败【${e.message}】`, ProjectLog.name)
      throw new BadRequestException('获取日志详细信息失败')
    }
  }

  /**
   * 保存日志
   * @param logId
   * @param workAreaId
   * @param listId
   * @param workPlace
   * @param completionQuantity
   * @param userInfo
   */
  async saveLog(
    logId: string,
    listId: string,
    workPlaceData: { quantity: number; workPlace: string[]; workAreaId: string }[],
    userInfo: User,
  ) {
    const { fillUser } = await this.projectLogRepository.findOne({
      where: { id: logId },
      select: ['fillUser'],
    })
    const newFillUser = fillUser ? fillUser + ',' + userInfo.nickName : userInfo.nickName
    return await this.projectLogRepository.manager.transaction(async (manager) => {
      await manager.update(
        ProjectLog,
        { id: logId },
        {
          fillUser: [...new Set(newFillUser.split(','))].join(','),
          updateBy: userInfo.userName,
        },
      )
      await this.projectLogDetailRepository.delete({
        logId: logId,
        listId: listId,
        completionQuantity: 0,
      })
      const mergeWorkPlace = []
      workPlaceData.forEach((item) => {
        const index = mergeWorkPlace.findIndex((i) => {
          return i.workAreaId === item.workAreaId && i.workPlace[0] === item.workPlace[0]
        })
        // 没找到
        if (index === -1) {
          mergeWorkPlace.push(item)
        } else {
          mergeWorkPlace[index].quantity = [mergeWorkPlace[index].quantity, item.quantity]
          mergeWorkPlace[index].workPlace.push(item.workPlace[1])
        }
      })
      const createDate = []
      const existLog = await this.projectLogDetailRepository.find({
        where: {
          tenantId: userInfo.tenantId,
          logId: logId,
        },
      })
      mergeWorkPlace.forEach((item) => {
        let obj: any = {}
        const log = existLog.findIndex(
          (i) =>
            i.tenantId === userInfo.tenantId &&
            i.workAreaId === item.workAreaId &&
            i.listId === listId &&
            i.workPlaceId === item.workPlace[0],
        )
        if (log !== -1) {
          obj = existLog[log]
        } else {
          obj = {
            tenantId: userInfo.tenantId,
            createDept: userInfo.deptId,
            createBy: userInfo.userName,
            updateBy: userInfo.userName,
            logId: logId,
            listId: listId,
            workAreaId: item.workAreaId,
            workPlaceId: item.workPlace[0],
          }
        }

        if (item.workPlace.length === 1) {
          obj.completionQuantity = item.quantity
        } else if (item.workPlace.length === 2) {
          if (!obj.leftQuantities && !obj.rightQuantities) {
            obj.completionQuantity = item.quantity
          } else if (obj.leftQuantities) {
            obj.completionQuantity = Number(Decimal.add(obj.leftQuantities, item.quantity))
          } else if (obj.rightQuantities) {
            obj.completionQuantity = Number(Decimal.add(obj.rightQuantities, item.quantity))
          }
          obj[item.workPlace[1]] = item.quantity
        } else if (item.workPlace.length === 3) {
          obj[item.workPlace[1]] = item.quantity[0]
          obj[item.workPlace[2]] = item.quantity[1]
          obj.completionQuantity = Number(Decimal.add(item.quantity[0], item.quantity[1]))
        }
        createDate.push(obj)
      })
      return await this.projectLogDetailRepository.save(createDate)
    })
  }

  /**
   * 添加清单到日志列表
   * @param logId
   * @param workAreaId
   * @param listId
   * @param userInfo
   */
  async addList(logId: string, workAreaId: string, listIds: string[], userInfo: User) {
    const workAreaList = await this.deptService.getWorkArea(userInfo)
    const workAreaIdList = workAreaList.map((item) => item.id)
    const data = []
    listIds.forEach((listId) => {
      if (workAreaIdList.includes(workAreaId)) {
        data.push({
          logId,
          workAreaId,
          listId,
          createBy: userInfo.userName,
          updateBy: userInfo.userName,
          tenantId: userInfo.tenantId,
          createDept: userInfo.deptId,
        })
      } else {
        workAreaIdList.forEach((workAreaId) => {
          data.push({
            logId,
            workAreaId,
            listId,
            createBy: userInfo.userName,
            updateBy: userInfo.userName,
            tenantId: userInfo.tenantId,
            createDept: userInfo.deptId,
          })
        })
      }
    })

    return await this.projectLogDetailRepository.save(data)
  }

  /**
   * 删除日志的清单
   * @param logId 日志ID
   * @param listId 日志清单的ID
   * @param userInfo 当前用户
   * @returns 删除成功
   */
  async deleteList(logId: string, listId: string) {
    try {
      await this.projectLogDetailRepository
        .createQueryBuilder()
        .delete()
        .from(ProjectLogDetail)
        .where('logId = :logId and listId = :listId', { logId, listId })
        .execute()
      return '删除成功'
    } catch (error) {
      this.loggerService.error(`删除日志清单失败【${error.message}】`, ProjectLog.name)
      throw new BadRequestException('删除日志清单失败')
    }
  }

  /**
   * @description 查询同一清单的完成列表
   * @param listId 清单ID
   * @param logId 日志ID
   * @param userInfo 用户信息
   * @returns 列表
   */
  async getByListId(listId: string, logId: string, mode: string, userInfo: User) {
    if (!listId) {
      throw new BadRequestException('清单ID不能为空')
    }
    if (!logId) {
      throw new BadRequestException('日志ID不能为空')
    }
    const data = await this.projectLogDetailRepository
      .createQueryBuilder('pld')
      .leftJoin(Dept, 'dept', 'dept.id = pld.work_area_id')
      .leftJoin(WorkPlace, 'wp', 'wp.id = pld.work_place_id')
      .select([
        'pld.id as id',
        'pld.work_area_id as workAreaId',
        'pld.work_place_id as workPlaceId',
        'dept.dept_name as deptName',
        'wp.workplace_name as workplaceName',
        'pld.completion_quantity as completionQuantity',
        'pld.right_quantities as rightQuantities',
        'pld.left_quantities as leftQuantities',
      ])
      .where('pld.tenant_id = :tenantId', { tenantId: userInfo.tenantId })
      .andWhere('pld.list_id = :listId', { listId })
      .andWhere('pld.log_id = :logId', { logId })
      .getRawMany()

    if (mode === 'list') {
      return data
    } else {
      const result: { quantity: number; workPlace: string[]; workAreaId: string }[] = []
      data.forEach((item) => {
        if (item.completionQuantity > 0 && item.rightQuantities === 0 && item.rightQuantities === 0) {
          // 车站情况
          result.push({
            quantity: item.completionQuantity,
            workPlace: [item.workPlaceId],
            workAreaId: item.workAreaId,
          })
        } else {
          if (item.rightQuantities > 0) {
            result.push({
              workPlace: [item.workPlaceId, 'rightQuantities'],
              quantity: item.rightQuantities,
              workAreaId: item.workAreaId,
            })
          }
          if (item.leftQuantities > 0) {
            result.push({
              workPlace: [item.workPlaceId, 'leftQuantities'],
              quantity: item.leftQuantities,
              workAreaId: item.workAreaId,
            })
          }
        }
      })
      return result
    }
  }

  /**
   *
   * @param id 日志详情ID
   * @param userInfo 用户信息
   */
  async deleteById(id: string, userInfo: User) {
    return await this.projectLogDetailRepository.delete({
      id,
      tenantId: userInfo.tenantId,
    })
  }
}
