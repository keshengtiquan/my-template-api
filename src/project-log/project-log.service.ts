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
import { List } from '../resource/list/entities/list.entity'
import { Dept } from '../sys/dept/entities/dept.entity'
import { WorkPlace } from '../resource/workplace/entities/workplace.entity'
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
  /**
   * 自动生成日志
   */
  async generateLog() {
    const fillDate = dayjs(new Date()).format('YYYY-MM-DD')
    try {
      const tenants = await this.tenantRepository.find({
        select: ['id'],
      })
      const logs = await this.projectLogRepository.find({
        where: {
          fillDate: fillDate,
        },
      })
      const data = []
      tenants.forEach((tenant) => {
        const hasLogForTenant = logs.some((log) => log.tenantId === tenant.id)
        if (!hasLogForTenant) {
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
      console.log(e)
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
      const weekPlanList = await this.issuedRepository.find({
        where: {
          planType: 'week',
          startDate: weekStartDate,
          endDate: weekEndDate,
          tenantId: userInfo.tenantId,
        },
        select: ['listId', 'workAreaId'],
      })
      const data = []
      weekPlanList.forEach((plan) => {
        data.push({
          logId: logId,
          listId: plan.listId,
          workAreaId: plan.workAreaId,
          tenantId: userInfo.tenantId,
          createBy: 'system',
          updateBy: 'system',
          createDept: userInfo.deptId,
        })
      })
      await this.projectLogDetailRepository.save(data)
    }
    //查询列表
    const queryBuilder = this.projectLogDetailRepository
      .createQueryBuilder('pld')
      .select([
        'pld.id as id',
        'pld.id as logDetailId',
        'pld.work_area_id as workAreaId',
        'pld.completion_quantity as quantity',
        'pld.work_place_id as workPlace',
        'pld.left_quantities as leftQuantities',
        'pld.right_quantities as rightQuantities',
        'pld.create_by as createBy',
        'pld.update_by as updateBy',
        'pld.create_time as createTime',
        'pld.update_time as updateTime',
        'wp.workplace_name as workPlaceName',
        'wp.workplace_type as workPlaceType',
        'pl.id as logId',
        'dept.dept_name as workAreaName',
        'list.id as listId',
        'list.serial_number as serialNumber',
        'list.list_code as listCode',
        'list.list_name as listName',
        'list.list_characteristic as listCharacteristic',
        'list.unit as unit',
        'list.quantities as quantities',
        'list.unit_price as unitPrice',
      ])
      .leftJoin(List, 'list', 'list.id = pld.list_id')
      .leftJoin(Dept, 'dept', 'dept.id = pld.work_area_id')
      .leftJoin(ProjectLog, 'pl', 'pl.id = pld.log_id')
      .leftJoin(WorkPlace, 'wp', 'wp.id = pld.work_place_id')
      .where('pld.tenant_id = :tenantId', { tenantId: userInfo.tenantId })
      .andWhere('pld.log_id = :logId', { logId: logId })
      .orderBy(`list.${sortField}`, sortOrder)
      .skip((current - 1) * pageSize)
      .take(pageSize)
    const workAreaList = await this.deptService.getWorkArea(userInfo)
    if (workAreaList.length > 0) {
      const workAreaIdList = workAreaList.map((item) => item.id)
      if (workAreaIdList.includes(workAreaId)) {
        queryBuilder.andWhere('pld.work_area_id = :workAreaId', { workAreaId })
      }
    }
    try {
      const list = await queryBuilder.getRawMany()
      const results = list.map((item) => {
        const { workPlace, workPlaceName, leftQuantities, rightQuantities, ...other } = item
        const newWorkPlace = [workPlace]
        let newWorkPlaceName = workPlaceName
        if (leftQuantities !== 0 && rightQuantities !== 0) {
          newWorkPlace[1] = 'leftQuantities'
        } else if (leftQuantities !== 0) {
          newWorkPlace[1] = 'leftQuantities'
          newWorkPlaceName = workPlaceName + ' / ' + '左线'
        } else if (rightQuantities !== 0) {
          newWorkPlace[1] = 'rightQuantities'
          newWorkPlaceName = workPlaceName + ' / ' + '右线'
        }

        return {
          workPlace: newWorkPlace,
          workPlaceName: newWorkPlaceName,
          leftQuantities,
          rightQuantities,
          ...other,
        }
      })
      return {
        results: results,
        current,
        total: await queryBuilder.getCount(),
        pageSize,
      }
    } catch (e) {
      console.log(e)
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
  async saveLog(logDetailId: string, logId: string, workPlace: string[], quantity: number, userInfo: User) {
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
      // const updateLogDetail = await manager.findOne(ProjectLogDetail, { where: { id: logDetailId } })
      const updateLogDetail = await manager
        .createQueryBuilder()
        .from(ProjectLogDetail, 'pld')
        .leftJoin(WorkPlace, 'wp', 'wp.id = pld.work_place_id')
        .select([
          'pld.id as id',
          'pld.tenant_id as tenantId',
          'pld.create_dept as createDept',
          'pld.log_id as logId',
          'pld.work_area_id as workAreaId',
          'pld.list_id as listId',
          'pld.work_place_id as workPlaceId',
          'pld.completion_quantity as completionQuantity',
          'pld.left_quantities as leftQuantities',
          'pld.right_quantities as rightQuantities',
          'pld.create_by as createBy',
          'pld.update_by as updateBy',
          'pld.create_time as createTime',
          'pld.update_time as updateTime',
          'wp.workplace_type as workPlaceType',
        ])
        .where('pld.id = :id', { id: logDetailId })
        .getRawOne()
      console.log(updateLogDetail)
      updateLogDetail.workPlaceId = workPlace[0]
      updateLogDetail.updateBy = userInfo.userName
      if (updateLogDetail.workPlaceType === 'station') {
        updateLogDetail.completionQuantity = quantity
      } else if (updateLogDetail.workPlaceType === 'section') {
        updateLogDetail[workPlace[1]] = quantity
        updateLogDetail.completionQuantity = updateLogDetail.leftQuantities + updateLogDetail.rightQuantities
      } else {
        if (workPlace.length === 1) {
          updateLogDetail.completionQuantity = quantity
        } else {
          updateLogDetail[workPlace[1]] = quantity
          updateLogDetail.completionQuantity = Number(
            Decimal.add(updateLogDetail.leftQuantities, updateLogDetail.rightQuantities),
          )
        }
      }
      return await this.projectLogDetailRepository.save(updateLogDetail)
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
   * @param id 日志详细信息的ID
   * @param userInfo 当前用户
   * @returns 删除成功
   */
  async deleteList(id: string) {
    try {
      await this.projectLogDetailRepository.delete({ id })
      return '删除成功'
    } catch (error) {
      this.loggerService.error(`删除日志清单失败【${error.message}】`, ProjectLog.name)
      throw new BadRequestException('删除日志清单失败')
    }
  }
}
