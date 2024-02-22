import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { User } from '../sys/user/entities/user.entity'
import { endOfMonth, endOfWeek, endOfYear, format, startOfMonth, startOfWeek, startOfYear, subMonths } from 'date-fns'
import { InjectRepository } from '@nestjs/typeorm'
import { List } from '../resource/list/entities/list.entity'
import { Repository } from 'typeorm'
import { ProjectLog } from '../project-log/entities/project-log.entity'
import { ProjectLogDetail } from '../project-log/entities/project-log-detail.entity'
import * as dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { WorkPlace } from '../resource/workplace/entities/workplace.entity'
import { Dept } from '../sys/dept/entities/dept.entity'
import { DeptService } from '../sys/dept/dept.service'
import { Order } from '../types'
import { Division } from '../resource/division/entities/division.entity'
import { handleTree } from '../utils'

@Injectable()
export class AnalyseService {
  @Inject()
  private readonly deptService: DeptService
  @InjectRepository(List)
  private readonly listRepository: Repository<List>
  @InjectRepository(ProjectLog)
  private readonly projectLogRepository: Repository<ProjectLog>
  @InjectRepository(ProjectLogDetail)
  private readonly projectLogDetailRepository: Repository<ProjectLogDetail>
  @InjectRepository(WorkPlace)
  private readonly workPlaceRepository: Repository<WorkPlace>
  @InjectRepository(Division)
  private readonly divisionRepository: Repository<Division>

  private readonly sql = `
      SELECT completionOutputValue,
             planOutputValue,
             CAST((completionOutputValue / NULLIF(planOutputValue, 0) * 100) AS DECIMAL(10, 2)) as 'completionRate'
      FROM (SELECT CAST(SUM(CASE
                                WHEN pl.fill_date >= ? and pl.fill_date <= ?
                                    THEN pld.completion_quantity * list.unit_price
                                ELSE 0 END) AS DECIMAL(10, 2)) as 'completionOutputValue'
            FROM sc_project_log pl
                     LEFT JOIN sc_project_log_detail pld ON pld.log_id = pl.id
                     LEFT JOIN sc_list list ON list.id = pld.list_id
            WHERE pl.tenant_id = ?) AS t1
               CROSS JOIN (SELECT CAST(SUM(CASE
                                               WHEN i.start_date >= ? and i.end_date <= ? and i.plan_type = ?
                                                   THEN list.unit_price * i.work_area_quantities
                                               ELSE 0 END) AS DECIMAL(10, 2)) as 'planOutputValue'
                           FROM sc_issued i
                                    LEFT JOIN sc_list list ON list.id = i.list_id
                           WHERE i.tenant_id = ?) AS t2;`

  /**
   * 获取指标卡数据
   * @param userInfo
   */
  async getIntroduce(userInfo: User) {
    const current = new Date()
    const params = this.getStartDateAndEndDate(current)
    try {
      // const dailyIntroduceData = await this.getDailyIntroduce(userInfo, params)
      // const monthIntroduceData = await this.getMonthIntroduce(userInfo, params)
      // const yearIntroduceData = await this.getYearIntroduce(userInfo, params)
      // const totalityIntroduceData = await this.getProgressIntroduce(userInfo)
      const [dailyIntroduceData, monthIntroduceData, yearIntroduceData, totalityIntroduceData] = await Promise.all([
        this.getDailyIntroduce(userInfo, params),
        this.getMonthIntroduce(userInfo, params),
        this.getYearIntroduce(userInfo, params),
        this.getProgressIntroduce(userInfo),
      ])
      return { dailyIntroduceData, monthIntroduceData, yearIntroduceData, totalityIntroduceData }
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * 获取日指标卡数据
   * @param userInfo
   * @param params
   */
  async getDailyIntroduce(userInfo: User, params: any) {
    try {
      return await this.projectLogRepository
        .createQueryBuilder('pl')
        .leftJoin(ProjectLogDetail, 'pld', 'pld.log_id = pl.id')
        .leftJoin(List, 'list', 'list.id = pld.list_id')
        .select([
          `CAST(SUM(CASE WHEN pl.fill_date = '${params.today}' THEN pld.completion_quantity * list.unit_price ELSE 0 END) AS DECIMAL(10, 2)) as dailyOutputValue`,
          `CAST(SUM(CASE WHEN pl.fill_date >= '${params.weekStartDate}' and pl.fill_date <= '${params.weekEndDate}' THEN pld.completion_quantity * list.unit_price ELSE 0 END) AS DECIMAL(10, 2)) as weekOutputValue`,
          `CAST(
                (SUM(CASE WHEN pl.fill_date >= '${params.weekStartDate}' and pl.fill_date <= '${params.weekEndDate}' THEN pld.completion_quantity * list.unit_price ELSE 0 END) -
                SUM(CASE WHEN pl.fill_date >= '${params.lastWeekStartDate}' and pl.fill_date <= '${params.lastWeekEndDate}' THEN pld.completion_quantity * list.unit_price ELSE 0 END)) /
                NULLIF(SUM(CASE WHEN pl.fill_date >= '${params.lastWeekStartDate}' and pl.fill_date <= '${params.lastWeekEndDate}' THEN pld.completion_quantity * list.unit_price ELSE 0 END), 1) * 100
                AS DECIMAL(10, 2)) as weekRate`,
          `CAST(
                (SUM(CASE WHEN pl.fill_date = '${params.today}' THEN pld.completion_quantity * list.unit_price ELSE 0 END) -
                SUM(CASE WHEN pl.fill_date = '${params.yesterday}' THEN pld.completion_quantity * list.unit_price ELSE 0 END)) /
                NULLIF(SUM(CASE WHEN pl.fill_date = '${params.yesterday}' THEN pld.completion_quantity * list.unit_price ELSE 0 END), 1) * 100
                AS DECIMAL(10, 2)) as dayRate`,
        ])
        .where('pl.tenant_id = :tenantId', { tenantId: userInfo.tenantId })
        .getRawOne()
    } catch (e) {
      console.log(e)
      throw new BadRequestException('获取日指标卡失败')
    }
  }

  /**
   * 获取月指标卡
   * @param userInfo
   * @param params
   */
  async getMonthIntroduce(userInfo: User, params: any) {
    const queryBuilder = this.projectLogRepository
      .createQueryBuilder('pl')
      .leftJoin(ProjectLogDetail, 'pld', 'pld.log_id = pl.id')
      .leftJoin(List, 'list', 'list.id = pld.list_id')
      .select(['pl.fill_date', 'CAST(SUM(list.unit_price * pld.completion_quantity)AS DECIMAL(10, 2)) AS totalValue'])
      .where('pl.tenant_id = :tenantId', { tenantId: userInfo.tenantId })
      .andWhere('pl.fill_date >= :monthStartDate', { monthStartDate: params.monthStartDate })
      .andWhere('pl.fill_date <= :monthEndDate', { monthEndDate: params.monthEndDate })
      .groupBy('pl.fill_date')
    const data = await this.projectLogRepository.query(this.sql, [
      params.monthStartDate,
      params.monthEndDate,
      userInfo.tenantId,
      params.monthStartDate,
      params.monthEndDate,
      'month',
      userInfo.tenantId,
    ])
    const chart = await queryBuilder.getRawMany()
    const diff = dayjs(params.monthEndDate).diff(dayjs(params.monthStartDate), 'day')
    const chartData = []
    for (let i = 0; i <= diff; i++) {
      const date = dayjs(params.monthStartDate).add(i, 'day').format('YYYY-MM-DD')
      if (chart.findIndex((item) => item.fill_date === date) !== -1) {
        chartData.push({ x: date, y: Number(chart.find((item) => item.fill_date === date).totalValue) })
      } else {
        chartData.push({ x: date, y: 0 })
      }
    }
    return {
      data: data[0],
      chartData,
    }
  }

  /**
   * 获取年度指标
   * @param userInfo
   * @param params
   */
  async getYearIntroduce(userInfo: User, params: any) {
    const data = await this.projectLogRepository.query(this.sql, [
      params.yearStartDate,
      params.yearEndDate,
      userInfo.tenantId,
      params.yearStartDate,
      params.yearEndDate,
      'year',
      userInfo.tenantId,
    ])
    const queryBuilder = this.projectLogRepository
      .createQueryBuilder('pl')
      .leftJoin(ProjectLogDetail, 'pld', 'pld.log_id = pl.id')
      .leftJoin(List, 'list', 'list.id = pld.list_id')
      .select([
        "CONCAT(YEAR(pl.fill_date), '年', MONTH(pl.fill_date), '月') AS monthYear",
        'MONTH(pl.fill_date) AS monthNumber',
        'CAST(SUM(list.unit_price * pld.completion_quantity) AS DECIMAL(10, 2)) AS monthlyTotalValue',
      ])
      .where('pl.tenant_id = :tenantId', { tenantId: userInfo.tenantId })
      .andWhere('pl.fill_date >= :yearStartDate', { yearStartDate: params.yearStartDate })
      .andWhere('pl.fill_date <= :yearEndDate', { yearEndDate: params.yearEndDate })
      .groupBy('monthYear')
      .addGroupBy('monthNumber')
    const chart = await queryBuilder.getRawMany()
    const chartData = []
    for (let i = 1; i <= 12; i++) {
      const chartItem = chart.find((item) => item.monthNumber === i)
      if (chartItem) {
        chartData.push({
          x: chartItem.monthYear,
          y: Number(chartItem.monthlyTotalValue),
        })
      } else {
        chartData.push({
          x: `${params.yearStartDate.substring(0, 4)}年${i}月`,
          y: 0,
        })
      }
    }
    return { data: data[0], chartData }
  }

  /**
   * 获取项目进度指标
   * @param userInfo
   * @param params
   */
  async getProgressIntroduce(userInfo: User) {
    const queryBuilder = this.projectLogDetailRepository
      .createQueryBuilder('pld')
      .leftJoin(List, 'list', 'list.id = pld.list_id')
      .leftJoin(ProjectLog, 'pl', 'pl.id = pld.log_id')
      .select([
        'CAST(SUM(list.combined_price)AS DECIMAL(18, 2)) as total',
        'CAST(SUM(pld.completion_quantity * list.unit_price)AS DECIMAL(18, 2)) as complete',
        'CAST(SUM(CASE WHEN pl.fill_date < :lastMonthEndDate THEN list.unit_price * pld.completion_quantity ELSE NULL END) AS DECIMAL(18, 2)) AS lastMonthComplete',
      ])
      .where('pld.tenant_id= :tenantId', { tenantId: userInfo.tenantId })
      .setParameter('lastMonthEndDate', format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'))
    try {
      const [data] = await queryBuilder.getRawMany()
      return {
        progress: Number(Decimal.div(data.complete, data.total)),
        progressText: (Number(Decimal.div(data.complete, data.total)) * 100).toFixed(2),
        lastProgress: (
          Number(
            Decimal.sub(
              Decimal.div(data.complete, data.total),
              Decimal.div(data.lastMonthComplete ? data.lastMonthComplete : 0, data.total),
            ),
          ) * 100
        ).toFixed(2),
      }
    } catch (e) {
      throw new BadRequestException('数据异常')
    }
  }

  getStartDateAndEndDate(date: Date) {
    const log = format(date, 'yyyy')
    const yearStartDate = format(startOfYear(new Date(parseInt(log), 0)), 'yyyy-MM-dd')
    const yearEndDate = format(endOfYear(new Date(parseInt(log), 0)), 'yyyy-MM-dd')
    const monthStartDate = format(startOfMonth(date), 'yyyy-MM-dd')
    const monthEndDate = format(endOfMonth(date), 'yyyy-MM-dd')
    const weekStartDate = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const weekEndDate = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const today = dayjs(date).format('YYYY-MM-DD')
    const yesterday = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD')
    const lastWeekStartDate = dayjs(weekStartDate).subtract(1, 'week').format('YYYY-MM-DD')
    const lastWeekEndDate = dayjs(weekEndDate).subtract(1, 'week').format('YYYY-MM-DD')
    return {
      yearStartDate,
      yearEndDate,
      monthStartDate,
      monthEndDate,
      weekStartDate,
      weekEndDate,
      lastWeekStartDate,
      lastWeekEndDate,
      today,
      yesterday,
    }
  }

  /**
   * 获取各个工点的完成清空
   * @param workPlaceType
   * @param userInfo
   */
  async getWorkPlaceOutputValue(workPlaceType: string, userInfo: User) {
    const queryBuilder = this.workPlaceRepository
      .createQueryBuilder('wp')
      .leftJoin(ProjectLogDetail, 'pld', 'pld.work_place_id = wp.id')
      .leftJoin(List, 'list', 'list.id = pld.list_id')
      .select([
        'wp.workplace_name as workplaceName',
        'wp.output_value as outPutValue',
        'COALESCE(CAST(SUM(pld.completion_quantity * list.unit_price)AS DECIMAL(10, 2)),0) as completePutValue',
      ])
      .where('wp.tenant_id= :tenantId', { tenantId: userInfo.tenantId })
      .andWhere('wp.workplace_type = :workPlaceType', { workPlaceType })
      .groupBy('wp.workplace_name')
      .addGroupBy('wp.output_value')
    try {
      const list = await queryBuilder.getRawMany()
      const results = []
      list.forEach((item) => {
        results.push({
          workplaceName: item.workplaceName,
          value: Number(Decimal.sub(item.outPutValue, item.completePutValue)),
          type: '剩余量',
        })
        results.push({
          workplaceName: item.workplaceName,
          value: Number(item.completePutValue),
          type: '完成量',
        })
      })
      return results
    } catch (e) {
      throw new BadRequestException('获取各个工点的完成清空失败')
    }
  }

  /**
   * 获取工区的完成产值
   */
  async getWorkAreaOutPutValue(time: string[], userInfo: User) {
    const queryBuilder = this.projectLogDetailRepository
      .createQueryBuilder('pld')
      .leftJoin(ProjectLog, 'pl', 'pl.id = pld.log_id')
      .leftJoin(List, 'list', 'list.id = pld.list_id')
      .leftJoin(Dept, 'dept', 'pld.work_area_id = dept.id')
      .select([
        'dept.dept_name as workAreaName',
        'dept.id as deptId',
        'COALESCE(CAST(SUM(list.unit_price * pld.completion_quantity)AS DECIMAL(10, 2)),0) as outputValue',
      ])
      .where('pld.tenant_id = :tenantId', { tenantId: userInfo.tenantId })
      .groupBy('pld.work_area_id')
      .addGroupBy('dept.id')
    if (time && time.length > 0) {
      queryBuilder.andWhere('pl.fill_date >= :startTime', { startTime: time[0] })
      queryBuilder.andWhere('pl.fill_date <= :endTime', { endTime: time[1] })
    }
    try {
      const data = await queryBuilder.getRawMany()
      const dept = await this.deptService.getWorkArea(userInfo)
      const results = []
      dept.forEach((workArea) => {
        const row = data.find((item) => item.deptId === workArea.id)
        if (row) {
          results.push({
            workAreaName: workArea.deptName,
            outputValue: row.outputValue,
          })
        } else {
          results.push({
            workAreaName: workArea.deptName,
            outputValue: 0,
          })
        }
      })
      return results.sort((a, b) => b.outputValue - a.outputValue)
    } catch (e) {
      console.log(e)
      throw new BadRequestException('获取工区的完成产值失败')
    }
  }

  /**
   * 获取关注列表
   * @param userInfo
   */
  async getFocusList(current: number, pageSize: number, sortField: string, sortOrder: Order, userInfo: User) {
    console.log('current', current, pageSize)
    const queryBuilder = this.listRepository
      .createQueryBuilder('list')
      .leftJoin(ProjectLogDetail, 'pld', 'pld.list_id = list.id')
      .select([
        'list.serial_number as serialNumber',
        'list.list_name as listName',
        'list.quantities as quantities',
        'COALESCE(CAST(SUM(pld.completion_quantity) as DECIMAL(18,2)),0) as complete',
      ])
      .orderBy(`list.${sortField}`, sortOrder)
      .where('list.tenant_id= :tenantId', { tenantId: userInfo.tenantId })
      .andWhere('list.is_focus_list = :isFocusList', { isFocusList: true })
      .groupBy('list.serial_number')
      .addGroupBy('list.list_name')
      .addGroupBy('list.quantities')

    try {
      const list = await queryBuilder
        .skip((current - 1) * pageSize)
        .take(pageSize)
        .getRawMany()
      const total = await queryBuilder.getCount()
      console.log(total)
      return {
        results: list,
        current: current,
        pageSize: pageSize,
        total: total,
      }
    } catch (e) {
      console.log(e)
      throw new BadRequestException('获取关注列表失败')
    }
  }

  /**
   * 获取分项占比
   * @param userInfo
   */
  async getProportion(userInfo: User) {
    const sql = `
        SELECT t1.id,
               t1.division_name as name,
               t1.parent_id as parentId,
               COALESCE(CAST(SUM(t1.output)  as DECIMAL(18,2)),0)as value,
               COALESCE(CAST(SUM(t1.finish)as DECIMAL(18,2)),0) as finish
        FROM (SELECT id,
                     division_name,
                     parent_id,
                     list_id, output, SUM (CASE WHEN id = current_section THEN unit_price * completion_quantity ELSE 0 END) as finish
              FROM
                  (SELECT
                  DISTINCT d.id, list.id as list_id, d.division_name, d.parent_id, (list.unit_price * list.quantities) as output, d.id as current_section, list.unit_price, pld.completion_quantity
                  FROM
                  sc_division d
                  LEFT JOIN
                  sc_list list ON list.current_section = d.id
                  LEFT JOIN
                  sc_project_log_detail pld ON pld.list_id = list.id
                  WHERE
                  d.tenant_id = ?
                  ) AS subquery
              GROUP BY
                  id, division_name, parent_id, output, list_id) AS t1
        GROUP BY t1.id, t1.division_name, t1.parent_id;`
    // const sql2 = `SELECT list.list_name as name,
    //                      list.current_section,
    //                      CAST(list.unit_price * list.quantities as DECIMAL(10, 2)) as value, CAST(sum(list.unit_price * pld.completion_quantity)as DECIMAL(10,2)) as finish
    //               from sc_list list
    //                   LEFT JOIN sc_project_log_detail pld
    //               on pld.list_id = list.id
    //               WHERE list.tenant_id = ?
    //               GROUP BY list.list_name, list.current_section, value`
    try {
      const res = await this.divisionRepository.query(sql, [userInfo.tenantId])
      const tree = handleTree(res)
      this.calculateOutputValue(tree[0], 'finish')
      return tree
    } catch (e) {
      throw new BadRequestException('获取分项占比失败')
    }
  }
  calculateOutputValue(node: any, filed: string) {
    if (node.children && node.children.length > 0) {
      // 如果当前节点有子节点，对每个子节点进行递归计算
      let sum = 0
      for (const child of node.children) {
        sum = Number(Decimal.add(sum, this.calculateOutputValue(child, filed)))
      }
      node[filed] = sum // 更新当前节点的outputValue为子节点之和
    }
    return node[filed] // 返回当前节点的outputValue
  }
}
