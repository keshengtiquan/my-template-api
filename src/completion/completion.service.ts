import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { List } from 'src/resource/list/entities/list.entity';
import { WorkPlace } from 'src/resource/workplace/entities/workplace.entity';
import { User } from 'src/sys/user/entities/user.entity';
import { Order } from 'src/types';
import { Repository } from 'typeorm';

@Injectable()
export class CompletionService {
  @InjectRepository(WorkPlace)
  private workPlaceRepository: Repository<WorkPlace>;
  @InjectRepository(List)
  private listRepository: Repository<List>;

  async getCompletion(userInfo: User) {
    const workPlaceList = await this.workPlaceRepository.find({
      where: {
        tenantId: userInfo.tenantId,
      },
    });
    let allCompletionDynamicColumnsResult = '';
    let allQuantitiesDynamicColumnsResult = '';
    let leftCompletionDynamicColumnsResult = '';
    let leftQuantitiesDynamicColumnsResult = '';
    let rightCompletionDynamicColumnsResult = '';
    let rightQuantitiesDynamicColumnsResult = '';
    workPlaceList.forEach((item: WorkPlace) => {
      //全线
      allCompletionDynamicColumnsResult +=
        `SUM(CASE WHEN wp.workplace_name= '${item.workPlaceName}' THEN ROUND(pld.completion_quantity / t1.` +
        '`' +
        `${item.workPlaceName}` +
        '`, 4)' +
        ` ELSE 0 END) as '${item.workPlaceName}',`;
      allQuantitiesDynamicColumnsResult += `CAST(SUM(CASE WHEN wp.workplace_name= '${item.workPlaceName}' THEN wpl.all_quantities ELSE 0 END)AS DECIMAL(18, 2)) as '${item.workPlaceName}',`;
      //左线
      leftCompletionDynamicColumnsResult +=
        `SUM(CASE WHEN wp.workplace_name= '${item.workPlaceName}' THEN ROUND(pld.left_quantities / t1.` +
        '`' +
        `${item.workPlaceName}` +
        '`, 4)' +
        ` ELSE 0 END) as '${item.workPlaceName}',`;
      leftQuantitiesDynamicColumnsResult += `CAST(SUM(CASE WHEN wp.workplace_name= '${item.workPlaceName}' THEN wpl.left_quantities ELSE 0 END)AS DECIMAL(18, 2)) as '${item.workPlaceName}',`;
      //右线
      rightCompletionDynamicColumnsResult +=
        `SUM(CASE WHEN wp.workplace_name= '${item.workPlaceName}' THEN ROUND(pld.right_quantities / t1.` +
        '`' +
        `${item.workPlaceName}` +
        '`, 4)' +
        ` ELSE 0 END) as '${item.workPlaceName}',`;
      rightQuantitiesDynamicColumnsResult += `CAST(SUM(CASE WHEN wp.workplace_name= '${item.workPlaceName}' THEN wpl.right_quantities ELSE 0 END)AS DECIMAL(18, 2)) as '${item.workPlaceName}',`;
    });
    const allCompletionDynamicColumns = allCompletionDynamicColumnsResult.slice(0, -1);
    const allQuantitiesDynamicColumns = allQuantitiesDynamicColumnsResult.slice(0, -1);
    const leftCompletionDynamicColumns = leftCompletionDynamicColumnsResult.slice(0, -1);
    const leftQuantitiesDynamicColumns = leftQuantitiesDynamicColumnsResult.slice(0, -1);
    const rightCompletionDynamicColumns = rightCompletionDynamicColumnsResult.slice(0, -1);
    const rightQuantitiesDynamicColumns = rightQuantitiesDynamicColumnsResult.slice(0, -1);

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
        `;
    const data = await this.workPlaceRepository.query(finalSql);
    this.addMergeRow(data, 'parent_name');
    this.addMergeRow(data, 'division_name');
    return data;
  }

  addMergeRow(data: any[], field: string) {
    let count = 0; //重复项的第一项
    let indexCount = 1; //下一项
    while (indexCount < data.length) {
      const item = data.slice(count, count + 1)[0]; //获取没有比较的第一个对象
      if (!item[`${field}rowSpan`]) {
        item[`${field}rowSpan`] = 1; //初始化为1
      }
      if (item[field] === data[indexCount][field]) {
        //第一个对象与后面的对象相比，有相同项就累加，并且后面相同项设置为0
        item[`${field}rowSpan`] = item[`${field}rowSpan`] + 1;
        data[indexCount][`${field}rowSpan`] = 0;
      } else {
        count = indexCount;
      }
      indexCount++;
    }
  }

  async getCompletionStatus(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    serialNumber: string,
    listName: string,
    listCharacteristic: string,
    sectionalEntry: string,
    completeStatus: string[],
    status: string[],
    userInfo: User,
  ) {
    let finalSql = `SELECT *,
    Round(tt.completePercentage - tt.planPercentage,2) as deviationdRate
    from (
    SELECT list.tenant_id as tenantId, list.serial_number as serialNumber, list.list_code as listCode, list.list_name as listName, list.list_characteristic as listCharacteristic, list.unit,list.quantities, list.combined_price as combinedPrice,
    g.start_date as startDate, g.end_date as endDate, g.duration,list.sectional_entry as sectionalEntry,
    t1.actualStartDate, 
    t1.actualEndDate,
    t2.planQuantities as planQuantities,
    t3.completeQuantity,
    CASE 
      WHEN ROUND(list.combined_price * (CASE WHEN CURDATE() <= g.start_date THEN 0 WHEN CURDATE() >= g.end_date THEN 1 ELSE ROUND((DATEDIFF(CURDATE(), g.start_date) / g.duration), 2) END),2) = ROUND(t3.completeQuantity * list.unit_price / list.combined_price * 100, 2) THEN '正常'
      WHEN ROUND(list.combined_price * (CASE WHEN CURDATE() <= g.start_date THEN 0 WHEN CURDATE() >= g.end_date THEN 1 ELSE ROUND((DATEDIFF(CURDATE(), g.start_date) / g.duration), 2) END),2) > ROUND(t3.completeQuantity * list.unit_price / list.combined_price * 100, 2) THEN '落后'
      WHEN ROUND(list.combined_price * (CASE WHEN CURDATE() <= g.start_date THEN 0 WHEN CURDATE() >= g.end_date THEN 1 ELSE ROUND((DATEDIFF(CURDATE(), g.start_date) / g.duration), 2) END),2) < ROUND(t3.completeQuantity * list.unit_price / list.combined_price * 100, 2) THEN '超前'
    ELSE '正常' END as status,
    CASE 
      WHEN CURDATE() <= g.start_date THEN 0
      WHEN CURDATE() >= g.end_date THEN 100
      ELSE ROUND((DATEDIFF(CURDATE(), g.start_date) / g.duration) * 100, 2)
    END as planPercentage,
    ROUND(list.combined_price * (CASE 
      WHEN CURDATE() <= g.start_date THEN 0
      WHEN CURDATE() >= g.end_date THEN 1
      ELSE ROUND((DATEDIFF(CURDATE(), g.start_date) / g.duration), 2)
    END),2) as planOutPutValue,
    ROUND(t3.completeQuantity * list.unit_price,2) as completeOutPutValue,
    ROUND(t3.completeQuantity * list.unit_price / list.combined_price * 100, 2) as completePercentage,
    CASE 
      WHEN t3.completeQuantity * list.unit_price <= 0 THEN '未开始'
      WHEN t3.completeQuantity * list.unit_price >= list.combined_price THEN '已完成'
      WHEN t3.completeQuantity * list.unit_price <= list.combined_price THEN '进行中'
      ELSE '未开始'
    END as completeStatus
    from sc_list list 
    LEFT JOIN sc_gantt_list gl on gl.list_id = list.id
    LEFT JOIN sc_gantt g on g.id = gl.gantt_id
    LEFT JOIN (select pld.list_id, MIN(pl.fill_date) as actualStartDate, MAX(pl.fill_date) as actualEndDate
      from sc_project_log_detail pld
      LEFT JOIN sc_project_log pl on pl.id = pld.log_id and pl.tenant_id='${userInfo.tenantId}'
      WHERE pld.tenant_id='${userInfo.tenantId}'
      GROUP BY pld.list_id) as t1 on t1.list_id = list.id 
    LEFT JOIN (select list_id, SUM(all_quantities) as planQuantities
        FROM sc_work_place_list
        WHERE tenant_id='${userInfo.tenantId}'
        GROUP BY list_id) as t2 on t2.list_id = list.id 
    LEFT JOIN (select list_id, Round(sum(completion_quantity),2) as completeQuantity
      from sc_project_log_detail 
      WHERE tenant_id='${userInfo.tenantId}'
      GROUP BY list_id) as t3 on t3.list_id = list.id
    WHERE list.tenant_id='${userInfo.tenantId}' 
    ORDER BY list.${sortField} ${sortOrder}
    ) as tt
    where tt.tenantId='${userInfo.tenantId}'`;
    let totalSql = `SELECT count(*) as total
    from (
    SELECT list.tenant_id as tenantId, list.serial_number as serialNumber, list.list_name as listName, list.list_characteristic as listCharacteristic,  
    list.sectional_entry as sectionalEntry,
		CASE 
      WHEN ROUND(list.combined_price * (CASE WHEN CURDATE() <= g.start_date THEN 0 WHEN CURDATE() >= g.end_date THEN 1 ELSE ROUND((DATEDIFF(CURDATE(), g.start_date) / g.duration), 2) END),2) = ROUND(t3.completeQuantity * list.unit_price / list.combined_price * 100, 2) THEN '正常'
      WHEN ROUND(list.combined_price * (CASE WHEN CURDATE() <= g.start_date THEN 0 WHEN CURDATE() >= g.end_date THEN 1 ELSE ROUND((DATEDIFF(CURDATE(), g.start_date) / g.duration), 2) END),2) > ROUND(t3.completeQuantity * list.unit_price / list.combined_price * 100, 2) THEN '落后'
      WHEN ROUND(list.combined_price * (CASE WHEN CURDATE() <= g.start_date THEN 0 WHEN CURDATE() >= g.end_date THEN 1 ELSE ROUND((DATEDIFF(CURDATE(), g.start_date) / g.duration), 2) END),2) < ROUND(t3.completeQuantity * list.unit_price / list.combined_price * 100, 2) THEN '超前'
    ELSE '正常' END as status,
    CASE 
      WHEN t3.completeQuantity * list.unit_price <= 0 THEN '未开始'
      WHEN t3.completeQuantity * list.unit_price >= list.combined_price THEN '已完成'
      WHEN t3.completeQuantity * list.unit_price <= list.combined_price THEN '进行中'
      ELSE '未开始'
    END as completeStatus
    from sc_list list 
    LEFT JOIN sc_gantt_list gl on gl.list_id = list.id
    LEFT JOIN sc_gantt g on g.id = gl.gantt_id
    LEFT JOIN (select pld.list_id, MIN(pl.fill_date) as actualStartDate, MAX(pl.fill_date) as actualEndDate
      from sc_project_log_detail pld
      LEFT JOIN sc_project_log pl on pl.id = pld.log_id and pl.tenant_id='${userInfo.tenantId}'
      WHERE pld.tenant_id='${userInfo.tenantId}'
      GROUP BY pld.list_id) as t1 on t1.list_id = list.id 
    LEFT JOIN (select list_id, SUM(all_quantities) as planQuantities
        FROM sc_work_place_list
        WHERE tenant_id='${userInfo.tenantId}'
        GROUP BY list_id) as t2 on t2.list_id = list.id 
    LEFT JOIN (select list_id, Round(sum(completion_quantity),2) as completeQuantity
      from sc_project_log_detail 
      WHERE tenant_id='${userInfo.tenantId}'
      GROUP BY list_id) as t3 on t3.list_id = list.id
    WHERE list.tenant_id='${userInfo.tenantId}' 
    ORDER BY list.create_time ASC
    ) as tt
    where tt.tenantId='${userInfo.tenantId}'`;

    if (serialNumber) {
      finalSql += ` and tt.serialNumber='${serialNumber}'`;
      totalSql += ` and tt.serialNumber='${serialNumber}'`;
    }
    if (listName) {
      finalSql += ` and tt.listName like '%${listName}%'`;
      totalSql += ` and tt.listName like '%${listName}%'`;
    }
    if (listCharacteristic) {
      finalSql += ` and tt.listCharacteristic like '%${listCharacteristic}%'`;
      totalSql += ` and tt.listCharacteristic like '%${listCharacteristic}%'`;
    }
    if (sectionalEntry) {
      finalSql += ` and tt.sectionalEntry like '%${sectionalEntry}%'`;
      totalSql += ` and tt.sectionalEntry like '%${sectionalEntry}%'`;
    }
    if (completeStatus && completeStatus.length > 0) {
      finalSql += ` and tt.completeStatus in (${completeStatus.map((item) => `"${item}"`).join(',')})`;
      totalSql += ` and tt.completeStatus in (${completeStatus.map((item) => `"${item}"`).join(',')})`;
    }
    if (status && status.length > 0) {
      finalSql += ` and tt.status in (${status.map((item) => `"${item}"`).join(',')})`;
      totalSql += ` and tt.status in (${status.map((item) => `"${item}"`).join(',')})`;
    }

    finalSql += ` limit ${(current - 1) * pageSize},${pageSize}`;

    const list = await this.listRepository.query(finalSql);
    const [total] = await this.listRepository.query(totalSql);
    return {
      results: list,
      current,
      pageSize,
      total: +total.total,
    };
  }
}
