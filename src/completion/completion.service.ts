import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { WorkPlace } from 'src/resource/workplace/entities/workplace.entity'
import { User } from 'src/sys/user/entities/user.entity'
import { Repository } from 'typeorm'

@Injectable()
export class CompletionService {
  @InjectRepository(WorkPlace)
  private workPlaceRepository: Repository<WorkPlace>

  async getCompletion(userInfo: User) {
    const workPlaceList = await this.workPlaceRepository.find({
      where: {
        tenantId: userInfo.tenantId,
      },
    })
    let allCompletionDynamicColumnsResult = ''
    let allQuantitiesDynamicColumnsResult = ''
    let leftCompletionDynamicColumnsResult = ''
    let leftQuantitiesDynamicColumnsResult = ''
    let rightCompletionDynamicColumnsResult = ''
    let rightQuantitiesDynamicColumnsResult = ''
    workPlaceList.forEach((item: WorkPlace) => {
      //全线
      allCompletionDynamicColumnsResult +=
        `SUM(CASE WHEN wp.workplace_name= '${item.workPlaceName}' THEN ROUND(pld.completion_quantity / t1.` +
        '`' +
        `${item.workPlaceName}` +
        '`, 4)' +
        ` ELSE 0 END) as '${item.workPlaceName}',`
      allQuantitiesDynamicColumnsResult += `CAST(SUM(CASE WHEN wp.workplace_name= '${item.workPlaceName}' THEN wpl.all_quantities ELSE 0 END)AS DECIMAL(18, 2)) as '${item.workPlaceName}',`
      //左线
      leftCompletionDynamicColumnsResult +=
        `SUM(CASE WHEN wp.workplace_name= '${item.workPlaceName}' THEN ROUND(pld.left_quantities / t1.` +
        '`' +
        `${item.workPlaceName}` +
        '`, 4)' +
        ` ELSE 0 END) as '${item.workPlaceName}',`
      leftQuantitiesDynamicColumnsResult += `CAST(SUM(CASE WHEN wp.workplace_name= '${item.workPlaceName}' THEN wpl.left_quantities ELSE 0 END)AS DECIMAL(18, 2)) as '${item.workPlaceName}',`
      //右线
      rightCompletionDynamicColumnsResult +=
        `SUM(CASE WHEN wp.workplace_name= '${item.workPlaceName}' THEN ROUND(pld.right_quantities / t1.` +
        '`' +
        `${item.workPlaceName}` +
        '`, 4)' +
        ` ELSE 0 END) as '${item.workPlaceName}',`
      rightQuantitiesDynamicColumnsResult += `CAST(SUM(CASE WHEN wp.workplace_name= '${item.workPlaceName}' THEN wpl.right_quantities ELSE 0 END)AS DECIMAL(18, 2)) as '${item.workPlaceName}',`
    })
    const allCompletionDynamicColumns = allCompletionDynamicColumnsResult.slice(0, -1)
    const allQuantitiesDynamicColumns = allQuantitiesDynamicColumnsResult.slice(0, -1)
    const leftCompletionDynamicColumns = leftCompletionDynamicColumnsResult.slice(0, -1)
    const leftQuantitiesDynamicColumns = leftQuantitiesDynamicColumnsResult.slice(0, -1)
    const rightCompletionDynamicColumns = rightCompletionDynamicColumnsResult.slice(0, -1)
    const rightQuantitiesDynamicColumns = rightQuantitiesDynamicColumnsResult.slice(0, -1)

    // sql
    const finalSql = `
      select * from (
        SELECT d.id,p.division_name AS parent_name, d.division_name, '全线' AS data_type, ${allCompletionDynamicColumns}
        FROM sc_division d
        LEFT JOIN sc_division p ON d.parent_id = p.id
        LEFT JOIN sc_list list ON list.current_section = d.id and list.tenant_id='${userInfo.tenantId}'
        LEFT JOIN sc_project_log_detail pld ON pld.list_id = list.id and pld.tenant_id='${userInfo.tenantId}'
        LEFT JOIN sc_work_place wp ON wp.id = pld.work_place_id and wp.tenant_id='${userInfo.tenantId}'
        LEFT JOIN (
          SELECT d.id, p.division_name AS parent_name, d.division_name, '全线' AS data_type, ${allQuantitiesDynamicColumns}
          FROM sc_division d
	        LEFT JOIN sc_division p ON d.parent_id = p.id
	        LEFT JOIN sc_list list ON list.current_section = d.id and list.tenant_id='${userInfo.tenantId}'
	        LEFT JOIN sc_work_place_list wpl ON wpl.list_id = list.id and wpl.tenant_id='${userInfo.tenantId}'
	        LEFT JOIN sc_work_place wp ON wp.id = wpl.work_placeId and wp.tenant_id='${userInfo.tenantId}'
          WHERE d.division_type = '分项工程' AND d.tenant_id = '${userInfo.tenantId}' AND (p.division_name = '变电所系统')
	        GROUP BY d.id, parent_name, d.division_name, data_type ) as t1 on t1.id = d.id
        WHERE d.division_type = '分项工程' AND d.tenant_id = '${userInfo.tenantId}' AND (p.division_name = '变电所系统')
        GROUP BY d.id,parent_name, d.division_name,data_type

        UNION ALL

        SELECT d.id,p.division_name AS parent_name, d.division_name, '左线' AS data_type, ${leftCompletionDynamicColumns}
        FROM sc_division d
        LEFT JOIN sc_division p ON d.parent_id = p.id
        LEFT JOIN sc_list list ON list.current_section = d.id and list.tenant_id='${userInfo.tenantId}'
        LEFT JOIN sc_project_log_detail pld ON pld.list_id = list.id and pld.tenant_id='${userInfo.tenantId}'
        LEFT JOIN sc_work_place wp ON wp.id = pld.work_place_id and wp.tenant_id='${userInfo.tenantId}'
        LEFT JOIN (
          SELECT d.id, p.division_name AS parent_name, d.division_name, '左线' AS data_type, ${leftQuantitiesDynamicColumns}
          FROM sc_division d
	        LEFT JOIN sc_division p ON d.parent_id = p.id
	        LEFT JOIN sc_list list ON list.current_section = d.id and list.tenant_id='${userInfo.tenantId}'
	        LEFT JOIN sc_work_place_list wpl ON wpl.list_id = list.id and wpl.tenant_id='${userInfo.tenantId}'
	        LEFT JOIN sc_work_place wp ON wp.id = wpl.work_placeId and wp.tenant_id='${userInfo.tenantId}'
          WHERE d.division_type = '分项工程' AND d.tenant_id = '${userInfo.tenantId}' AND (p.division_name != '变电所系统')
	        GROUP BY d.id, parent_name, d.division_name, data_type ) as t1 on t1.id = d.id
        WHERE d.division_type = '分项工程' AND d.tenant_id = '${userInfo.tenantId}' AND (p.division_name != '变电所系统')
        GROUP BY d.id,parent_name, d.division_name,data_type

        UNION ALL

        SELECT d.id,p.division_name AS parent_name, d.division_name, '右线' AS data_type, ${rightCompletionDynamicColumns}
        FROM sc_division d
        LEFT JOIN sc_division p ON d.parent_id = p.id
        LEFT JOIN sc_list list ON list.current_section = d.id and list.tenant_id='${userInfo.tenantId}'
        LEFT JOIN sc_project_log_detail pld ON pld.list_id = list.id and pld.tenant_id='${userInfo.tenantId}'
        LEFT JOIN sc_work_place wp ON wp.id = pld.work_place_id and wp.tenant_id='${userInfo.tenantId}'
        LEFT JOIN (
          SELECT d.id, p.division_name AS parent_name, d.division_name, '右线' AS data_type, ${rightQuantitiesDynamicColumns}
          FROM sc_division d
	        LEFT JOIN sc_division p ON d.parent_id = p.id
	        LEFT JOIN sc_list list ON list.current_section = d.id and list.tenant_id='${userInfo.tenantId}'
	        LEFT JOIN sc_work_place_list wpl ON wpl.list_id = list.id and wpl.tenant_id='${userInfo.tenantId}'
	        LEFT JOIN sc_work_place wp ON wp.id = wpl.work_placeId and wp.tenant_id='${userInfo.tenantId}'
          WHERE d.division_type = '分项工程' AND d.tenant_id = '${userInfo.tenantId}' AND (p.division_name != '变电所系统')
	        GROUP BY d.id, parent_name, d.division_name, data_type ) as t1 on t1.id = d.id
        WHERE d.division_type = '分项工程' AND d.tenant_id = '${userInfo.tenantId}' AND (p.division_name != '变电所系统')
        GROUP BY d.id,parent_name, d.division_name,data_type
      ) as result ORDER BY result.id
        `
    const data = await this.workPlaceRepository.query(finalSql)
    this.addMergeRow(data, 'parent_name')
    this.addMergeRow(data, 'division_name')
    return data
  }

  addMergeRow(data: any[], field: string) {
    let count = 0 //重复项的第一项
    let indexCount = 1 //下一项
    while (indexCount < data.length) {
      const item = data.slice(count, count + 1)[0] //获取没有比较的第一个对象
      if (!item[`${field}rowSpan`]) {
        item[`${field}rowSpan`] = 1 //初始化为1
      }
      if (item[field] === data[indexCount][field]) {
        //第一个对象与后面的对象相比，有相同项就累加，并且后面相同项设置为0
        item[`${field}rowSpan`] = item[`${field}rowSpan`] + 1
        data[indexCount][`${field}rowSpan`] = 0
      } else {
        count = indexCount
      }
      indexCount++
    }
  }
}
