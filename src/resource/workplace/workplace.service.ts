import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateWorkplaceDto } from './dto/create-workplace.dto';
import { User } from '../../sys/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkPlace, WorkPlaceType } from './entities/workplace.entity';
import { Repository } from 'typeorm';
import { Order } from '../../types';
import { ExportFileService, ImportFileService, ManagementGroup, WorkPlaceTypeEnum } from '../../enmus';
import { UpdateWorkplaceDto } from './dto/update-workplace.dto';
import { Excel } from '../../excel/entities/excel.entity';
import { ExcelService } from '../../excel/excel.service';
import { List } from '../list/entities/list.entity';
import { WorkPlaceList } from './entities/workplace.list.entity';
import Decimal from 'decimal.js';
import { MyLoggerService } from '../../common/my-logger/my-logger.service';
import { ExportExcel } from '../../excel/entities/export.excel.entity';
import { ListService } from '../list/list.service';
import * as Exceljs from 'exceljs';

@Injectable()
export class WorkplaceService {
  @InjectRepository(WorkPlace)
  private workPlaceRepository: Repository<WorkPlace>;
  @InjectRepository(Excel)
  private excelRepository: Repository<Excel>;
  @InjectRepository(List)
  private listRepository: Repository<List>;
  @InjectRepository(WorkPlaceList)
  private workPlaceListRepository: Repository<WorkPlaceList>;
  @Inject()
  private loggerService: MyLoggerService;
  @Inject()
  private excelService: ExcelService;
  @InjectRepository(ExportExcel)
  private exportExcelRepository: Repository<ExportExcel>;
  @Inject()
  private listService: ListService;

  /**
   * 创建工点
   * @param createWorkplaceDto
   */
  async create(createWorkplaceDto: CreateWorkplaceDto, userInfo: User) {
    const workplace = await this.workPlaceRepository.findOne({
      where: { workPlaceName: createWorkplaceDto.workPlaceName, tenantId: userInfo.tenantId },
    });
    if (workplace) {
      throw new BadRequestException('该工点已存在');
    }
    const workPlace = new WorkPlace();
    workPlace.workPlaceCode = createWorkplaceDto.workPlaceCode;
    workPlace.workPlaceName = createWorkplaceDto.workPlaceName;
    workPlace.workPlaceType = createWorkplaceDto.workPlaceType;
    workPlace.sortNumber = createWorkplaceDto.sortNumber;
    workPlace.createBy = userInfo.userName;
    workPlace.updateBy = userInfo.userName;
    workPlace.createDept = userInfo.deptId;
    workPlace.tenantId = userInfo.tenantId;

    const typeMapping: { [key: string]: string } = {
      车站: 'station',
      区间: 'section',
      station: 'station',
      section: 'section',
    };
    workPlace.workPlaceType = typeMapping[createWorkplaceDto.workPlaceType];

    try {
      return await this.workPlaceRepository.save(workPlace);
    } catch (e) {
      throw new BadRequestException(e.message);
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
    // const queryBuilder = this.workPlaceRepository
    //   .createQueryBuilder('wp')
    //   .leftJoin(WorkPlaceList, 'wpl', 'wp.id = wpl.work_placeId')
    //   .select([
    //     'wp.workplace_code as workPlaceCode',
    //     'wp.sort_number as sortNumber',
    //     'wp.workplace_name as workPlaceName',
    //     "CASE WHEN wp.workplace_type = 'station' THEN '车站' WHEN wp.workplace_type = 'section' THEN '区间' ELSE wp.workplace_type END AS workPlaceType",
    //     'wp.create_by as createBy',
    //     'wp.create_time as createTime',
    //     'wp.update_by as updateBy',
    //     'wp.update_time as updateTime',
    //     'wp.id as id',
    //     'CAST(SUM(wpl.combined_price)AS DECIMAL(18, 2)) as outputValue',
    //   ])
    //   .where('wp.tenant_id =:tenantId', { tenantId: userInfo.tenantId })
    //   .groupBy('wp.id')
    //   .addGroupBy('wp.workplace_code')
    //   .addGroupBy('wp.sort_number')
    //   .addGroupBy('wp.workplace_name')
    //   .orderBy(`wp.${sortField}`, sortOrder)
    //
    // if (workPlaceType) {
    //   queryBuilder.andWhere('wp.workplace_type = :workPlaceType', { workPlaceType })
    // }
    const listSql = `SELECT wp.id as id,
                            COALESCE(CAST(SUM(wpl.combined_price) AS DECIMAL(18, 2)),0) as outputValue
                     FROM sc_work_place wp
                              LEFT JOIN sc_work_place_list wpl on wpl.work_placeId = wp.id
                     WHERE wp.tenant_id=${userInfo.tenantId} GROUP BY wp.id`;
    const queryBuilder = this.workPlaceRepository
      .createQueryBuilder('wp')
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .where('wp.tenantId =:tenantId', { tenantId: userInfo.tenantId })
      .orderBy(`wp.${sortField}`, sortOrder);
    if (workPlaceType) {
      queryBuilder.andWhere('wp.workplace_type = :workPlaceType', { workPlaceType });
    }
    try {
      const outputValuelist = await this.workPlaceRepository.query(listSql);
      for (const item of outputValuelist) {
        await this.workPlaceRepository.update(
          { id: item.id },
          {
            outputValue: item.outputValue,
          },
        );
      }
      const [list, total] = await queryBuilder.getManyAndCount();
      return {
        results: list.map((item) => {
          return {
            ...item,
            workPlaceType: item.workPlaceType === 'station' ? '车站' : '区间',
          };
        }),
        current,
        pageSize,
        total: total,
      };
    } catch (e) {
      throw new BadRequestException('查询工点列表失败');
    }
  }

  /**
   * 查询工点
   */
  async getOne(id: string) {
    try {
      return await this.workPlaceRepository.findOne({
        where: { id },
      });
    } catch (e) {
      throw new BadRequestException('查询工点失败');
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
      );
    } catch (e) {
      throw new BadRequestException('更新工点失败');
    }
  }

  /**
   * 删除工点
   * @param id
   */
  async delete(id: string) {
    try {
      await this.workPlaceListRepository.delete({ workPlaceId: id });
      await this.workPlaceRepository.delete({ id });
      return '删除成功';
    } catch (e) {
      throw new BadRequestException('删除工点失败');
    }
  }

  /**
   * 上传
   * @param file
   * @param userInfo
   */
  async upload(file: Express.Multer.File, userInfo: User) {
    function conditionCheckFunc(data) {
      return !data.B || !data.C || !data.D;
    }
    return this.excelService.excelImport({
      file,
      userInfo,
      serviceName: ImportFileService.WORKPLACEIMPORT,
      callback: this.create.bind(this),
      conditionCheckFunc: conditionCheckFunc,
    });
  }

  /**
   * 工点关联清单
   * @param id 工点ID
   * @param listIds 清单id
   * @param userInfo
   */
  async relevanceList(id: string, listIds: string[], userInfo: User) {
    if (listIds.length === 0) {
      throw new BadRequestException('请选择清单');
    }
    const data = [];
    listIds.forEach((item) => {
      data.push({
        workPlaceId: id,
        listId: item,
        tenantId: userInfo.tenantId,
        createBy: userInfo.userName,
        updateBy: userInfo.userName,
        createDept: userInfo.deptId,
      });
    });
    try {
      return await this.workPlaceListRepository.save(data);
    } catch (e) {
      throw new BadRequestException('工点关联清单失败');
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
      });
    if (listCode) {
      queryBuilder.andWhere('list.listCode = :listCode', { listCode });
    }
    if (listName) {
      queryBuilder.andWhere('list.listName like :listName', { listName: `%${listName}%` });
    }
    if (listCharacteristic) {
      queryBuilder.andWhere('list.listCharacteristic like :listCharacteristic', {
        listCharacteristic: `%${listCharacteristic}%`,
      });
    }
    try {
      const list = await queryBuilder.getRawMany();
      return {
        results: list,
        current,
        pageSize,
        total: await queryBuilder.getCount(),
      };
    } catch (e) {
      throw new BadRequestException('工点关联清单列表查询失败');
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
      });
      if (!listId) {
        throw new Error('工点关联清单列表查询失败');
      }
      const totalExistingQuantities = await this.workPlaceListRepository
        .createQueryBuilder('wpl')
        .select('SUM(wpl.allQuantities)', 'total')
        .where('wpl.listId = :listId', { listId })
        .andWhere('wpl.id != :id', { id })
        .andWhere('wpl.tenantId = :tenantId', { tenantId: userInfo.tenantId })
        .getRawOne();
      const totalAllowedQuantities = await this.listRepository
        .createQueryBuilder('list')
        .select('list.quantities', 'quantities')
        .addSelect('list.unitPrice', 'unitPrice')
        .where('list.id = :listId', { listId })
        .getRawOne();
      if (!totalExistingQuantities || !totalAllowedQuantities) {
        throw new Error('无法获取工程量信息');
      }
      const allowedQuantities = totalAllowedQuantities.quantities || 0;
      const alreadyQuantities = totalExistingQuantities.total || 0;
      if (allQuantities + alreadyQuantities > allowedQuantities) {
        throw new Error(`填写的工程量超过清单量! 清单量：${allowedQuantities}, 已填写量：${alreadyQuantities}`);
      }

      const num1 = new Decimal(allQuantities);
      const num2 = new Decimal(totalAllowedQuantities.unitPrice);
      const num3 = num1.times(num2);

      return await this.workPlaceListRepository.update(
        { id },
        {
          allQuantities: allQuantities,
          leftQuantities: leftQuantities,
          rightQuantities: rightQuantities,
          combinedPrice: Number(num3),
        },
      );
    } catch (e) {
      if (e instanceof Error) {
        throw new BadRequestException(e.message);
      } else {
        throw new BadRequestException('更新工程量失败');
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
      .orderBy(`workplace.${sortField}`, sortOrder);
    if (userInfo.tenantId !== ManagementGroup.ID) {
      queryBuilder.where('workplace.tenantId = :tenantId', { tenantId: userInfo.tenantId });
    }
    try {
      return await queryBuilder.getMany();
    } catch (e) {
      throw new BadRequestException('查询工点列表失败');
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
    sectionalEntry: string,
    userInfo: User,
  ) {
    try {
      const workPlaceList = await this.workPlaceRepository.find({
        where: {
          tenantId: userInfo.tenantId,
        },
      });
      let dynamicColumnsResult = '';

      workPlaceList.forEach((item) => {
        dynamicColumnsResult += `
      CAST(MAX(CASE WHEN wp.workplace_code= '${item.workPlaceCode}' THEN wpl.all_quantities ELSE 0 END)AS DECIMAL(18, 2)) as '${item.workPlaceCode}_all_quantities',
      CAST(MAX(CASE WHEN wp.workplace_code= '${item.workPlaceCode}' THEN wpl.left_quantities ELSE 0 END)AS DECIMAL(18, 2)) as '${item.workPlaceCode}_left_quantities',
      CAST(MAX(CASE WHEN wp.workplace_code= '${item.workPlaceCode}' THEN wpl.right_quantities ELSE 0 END)AS DECIMAL(18, 2)) as '${item.workPlaceCode}_right_quantities',`;
      });
      const dynamicColumns = dynamicColumnsResult.slice(0, -1);
      const finalSql = `
          SELECT list.serial_number,
                 list.list_code,
                 list.list_name,
                 list.list_characteristic,
                 list.quantities,
                 list.unit,
                 list.unit_price,
                 ${dynamicColumns}
          FROM sc_list AS list
                   LEFT JOIN
               sc_work_place_list AS wpl ON wpl.list_id = list.id and wpl.tenant_id = '${userInfo.tenantId}'
                   LEFT JOIN
               sc_work_place AS wp ON wp.id = wpl.work_placeId and wp.tenant_id = '${userInfo.tenantId}'
          WHERE list.sectional_entry like '%${sectionalEntry}%'
          GROUP BY list.serial_number,
                   list.list_code,
                   list.list_name,
                   list.list_characteristic,
                   list.quantities,
                   list.unit_price,
                   list.unit
          ORDER BY list.serial_number ASC
              limit ${(current - 1) * pageSize}, ${pageSize}`;
      const total = `SELECT count(list.list_code) as total
                     FROM sc_list AS list
                     WHERE list.sectional_entry like '%${sectionalEntry}%'`;
      const totalNumber = await this.workPlaceListRepository.query(total);
      const list = await this.workPlaceListRepository.query(finalSql);
      return {
        results: list.map((item) => {
          let allotQuantities = 0;
          for (const itemKey in item) {
            if (itemKey.endsWith('_quantities')) {
              allotQuantities = Number(Decimal.add(Number(item[itemKey]), allotQuantities));
            }
          }
          return {
            allotQuantities,
            ...item,
          };
        }),
        current,
        pageSize,
        total: Number(totalNumber[0].total),
      };
    } catch (e) {
      throw new BadRequestException('查询工点列表失败');
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
        .execute();
    } catch (e) {
      throw new BadRequestException('删除工点下关联的清单失败');
    }
  }

  /**
   * 根据清单获取工点
   * @param listId
   */
  async getWorkPlaceByListId(current: number, pageSize: number, listId: string, userInfo: User) {
    const queryBuilder = this.workPlaceListRepository
      .createQueryBuilder('wpl')
      .leftJoin(WorkPlace, 'wp', 'wp.id = wpl.work_placeId')
      .select([
        'wpl.work_placeId as workPlaceId',
        'wp.workplace_name as workPlaceName',
        'wp.workplace_type as workPlaceType',
      ])
      .where('wpl.tenantId =:tenantId', { tenantId: userInfo.tenantId })
      .andWhere('wpl.listId =:listId', { listId });
    const workPlaceList = await queryBuilder.getRawMany();
    return workPlaceList.map((item) => {
      const { workPlaceId, workPlaceName, workPlaceType } = item;
      const obj = {
        value: workPlaceId,
        label: workPlaceName,
      };
      if (workPlaceType === 'section') {
        obj['children'] = [
          { value: 'leftQuantities', label: '左线' },
          { value: 'rightQuantities', label: '右线' },
        ];
      }
      return obj;
    });
  }

  /**
   *  导出
   * @param current
   * @param pageSize
   * @param userInfo
   */
  async export(current: number, pageSize: number, userInfo: User) {
    try {
      const tableData = await this.workPlaceRepository.find({
        where: { tenantId: userInfo.tenantId },
      });
      return await this.excelService.exportExcel(
        {
          serviceName: ExportFileService.WORKPLACEEXPORT,
          tableData: tableData,
        },
        userInfo,
      );
    } catch (e) {
      throw new BadRequestException('导出失败');
    }
  }

  /**
   * 上传关联清单
   * @param body
   * @param userInfo
   */
  async uploadRelevance(file: Express.Multer.File, userInfo: User) {
    function conditionCheckFunc(data, importField) {
      const col: number[] = [];
      importField.map((item: any, index: number) => {
        if (item.filed === 'allQuantities' || item.filed === 'listCode' || item.filed === 'workPlaceId') {
          col.push(index);
        }
      });
      const filedArr = Object.keys(data);
      const checkList = col.map((item: any) => data[filedArr[item]]);
      return checkList.some((item) => item === '' || item === undefined || item === null || item === 0);
    }

    return await this.excelService.excelImport({
      file,
      userInfo,
      serviceName: ImportFileService.WORKPLACELISTRELEVANCESERVICE,
      callback: this.uploadRelevanceExcel.bind(this),
      conditionCheckFunc: conditionCheckFunc,
    });
  }

  /**
   * 上传工点清单
   * @param data
   * @param userInfo
   */
  async uploadRelevanceExcel(data: any, userInfo: User) {
    const listId = await this.listService.transitionIdOrName(data.listCode, userInfo);
    const workPlaceId = await this.transitionWorkPlaceIdOrName(data.workPlaceId, userInfo);
    const [relData] = await this.relevanceList(workPlaceId, [listId], userInfo);
    if (relData && relData.id) {
      await this.updateQuantities(relData.id, data.allQuantities, data.leftQuantities, data.rightQuantities, userInfo);
    } else {
      const { id } = await this.workPlaceListRepository.findOne({
        where: {
          workPlaceId: relData.workPlaceId,
          listId: relData.listId,
        },
        select: ['id'],
      });
      await this.updateQuantities(id, data.allQuantities, data.leftQuantities, data.rightQuantities, userInfo);
    }
  }

  /**
   * 工点ID和名称互转
   * @param filed
   * @param userInfo
   */
  async transitionWorkPlaceIdOrName(filed: string, userInfo: User) {
    const id = await this.workPlaceRepository.findOne({
      where: {
        workPlaceName: filed,
        tenantId: userInfo.tenantId,
      },
    });
    if (id) {
      return id.id;
    }
    throw new BadRequestException('请输入正确的工点名称或ID');
  }

  /**
   * 导出汇总excel
   * @param userInfo
   */
  async exportMultilevelHeader(sectionalEntry: string, userInfo: User) {
    //固定列
    const columnsData: any[] = [
      { col: 'A', filed: 'serial_number', excelFiled: '序号', remarks: '', width: 10 },
      { col: 'B', filed: 'list_code', excelFiled: '项目编码', remarks: '', width: 16 },
      { col: 'C', filed: 'list_name', excelFiled: '项目名称', remarks: '', width: 20 },
      { col: 'D', filed: 'list_characteristic', excelFiled: '项目特征', remarks: '', width: 20 },
      { col: 'E', filed: 'unit', excelFiled: '单位', remarks: '', width: 10 },
      { col: 'F', filed: 'unit_price', excelFiled: '单价', remarks: '', width: 10 },
      { col: 'G', filed: 'quantities', excelFiled: '工程量', remarks: '', width: 10 },
      { col: 'H', filed: 'allotQuantities', excelFiled: '合计', remarks: '', width: 10 },
    ];
    const workPlaceList = await this.workPlaceRepository.find({
      where: {
        tenantId: userInfo.tenantId,
      },
      order: {
        sortNumber: 'ASC',
      },
    });
    //动态列
    workPlaceList.forEach((item) => {
      const obj: any = {};
      if (item.workPlaceType === WorkPlaceTypeEnum.STATION) {
        obj.col = this.excelService.columnIndexToColumnLetter(columnsData.length + 1);
        obj.filed = `${item.workPlaceCode}_all_quantities`;
        obj.excelFiled = `${item.workPlaceName}`;
        obj.remarks = '';
        obj.width = 15;
        obj.type = WorkPlaceTypeEnum.STATION;
        columnsData.push(obj);
      } else if (item.workPlaceType === WorkPlaceTypeEnum.SECTION) {
        columnsData.push({
          col: this.excelService.columnIndexToColumnLetter(columnsData.length + 1),
          filed: `${item.workPlaceCode}_left_quantities`,
          excelFiled: [item.workPlaceName, `左线`],
          remarks: '',
          width: 10,
          type: WorkPlaceTypeEnum.SECTION,
        });
        columnsData.push({
          col: this.excelService.columnIndexToColumnLetter(columnsData.length + 1),
          filed: `${item.workPlaceCode}_right_quantities`,
          excelFiled: [item.workPlaceName, `右线`],
          remarks: '',
          width: 10,
          type: WorkPlaceTypeEnum.SECTION,
        });
      }
    });
    // 创建工作簿
    const workbook = new Exceljs.Workbook();
    workbook.creator = userInfo.nickName;
    workbook.created = new Date();
    // 添加工作表
    const worksheet = workbook.addWorksheet('Sheet1');
    const columns: any[] = [];
    //设置表头 合并单元格
    for (let i = 0; i < columnsData.length; i++) {
      columns.push({
        header: columnsData[i].excelFiled,
        key: columnsData[i].filed,
        width: columnsData[i].width,
      });
      if (columnsData[i].type !== WorkPlaceTypeEnum.SECTION) {
        worksheet.mergeCells(`${columnsData[i].col}1: ${columnsData[i].col}2`);
      }
    }
    const mergeCol = columnsData.filter((item) => item.type === WorkPlaceTypeEnum.SECTION);
    for (let i = 0; i < mergeCol.length; i = i + 2) {
      worksheet.mergeCells(`${mergeCol[i].col}1: ${mergeCol[i + 1].col}1`);
    }
    worksheet.columns = columns;

    //设置表头数据
    const total = `SELECT count(list.list_code) as total
                   FROM sc_list AS list
                   WHERE list.sectional_entry like '%${sectionalEntry}%'`;
    const [totalData] = await this.listRepository.query(total);
    const { results } = await this.getWorkPlaceRelevanceCollectList(
      1,
      totalData.total,
      'serialNumber',
      'ASC',
      sectionalEntry,
      userInfo,
    );

    if (results) {
      worksheet.addRows(
        results.map((item) => {
          const {
            serial_number,
            list_code,
            list_characteristic,
            list_name,
            unit,
            quantities,
            allotQuantities,
            ...other
          } = item;
          const obj = { serial_number, list_code, list_characteristic, list_name, unit, quantities, allotQuantities };
          for (const otherKey in other) {
            if (other[otherKey] === '0.00') {
              obj[otherKey] = null;
            } else {
              obj[otherKey] = Number(other[otherKey]);
            }
          }
          return obj;
        }),
      );
    }
    const style = {
      font: {
        size: 10,
        bold: true,
        color: { argb: 'ffffff' },
      },
      alignment: { vertical: 'middle', horizontal: 'center' },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '808080' },
      },
      border: {
        top: { style: 'thin', color: { argb: '9e9e9e' } },
        left: { style: 'thin', color: { argb: '9e9e9e' } },
        bottom: { style: 'thin', color: { argb: '9e9e9e' } },
        right: { style: 'thin', color: { argb: '9e9e9e' } },
      },
    };
    const headerRow = worksheet.getRows(1, 2);
    headerRow!.forEach((row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.style = style as Partial<Exceljs.Style>;
      });
    });

    worksheet.columns.forEach((column) => {
      column.alignment = style.alignment as Partial<Exceljs.Alignment>;
    });
    const dataLength = totalData.total as number;
    const tabeRows = worksheet.getRows(1, Number(dataLength) + 2);
    tabeRows!.forEach((row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = style.border as Partial<Exceljs.Borders>;
      });
    });
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber < 3) {
        return;
      }
      worksheet.getCell(`H${rowNumber}`).value = {
        formula: `SUM(${columnsData[8].col}${rowNumber}: ${columnsData[columnsData.length - 1].col}${rowNumber})`,
      };
      worksheet.getCell(`D${rowNumber}`).alignment = {
        wrapText: true,
        vertical: 'middle',
        horizontal: 'left',
      };
    });

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * 导入关联清单（汇总）
   * @param body
   * @param userInfo
   */
  async uploadRelevanceList(file: Express.Multer.File, userInfo: User) {
    const importField: any[] = [
      { col: 'A', filed: 'serial_number', excelFiled: '序号', remarks: '' },
      { col: 'B', filed: 'list_code', excelFiled: '项目编码', remarks: '' },
      { col: 'C', filed: 'list_name', excelFiled: '项目名称', remarks: '' },
      { col: 'D', filed: 'list_characteristic', excelFiled: '项目特征', remarks: '' },
      { col: 'E', filed: 'unit', excelFiled: '单位', remarks: '' },
      { col: 'F', filed: 'unit_price', excelFiled: '单价', remarks: '' },
      { col: 'G', filed: 'quantities', excelFiled: '工程量', remarks: '' },
      { col: 'H', filed: 'allotQuantities', excelFiled: '合计', remarks: '' },
    ];
    const workPlaceList = await this.workPlaceRepository.find({
      where: {
        tenantId: userInfo.tenantId,
      },
      order: {
        sortNumber: 'ASC',
      },
    });
    workPlaceList.forEach((item) => {
      if (item.workPlaceType === WorkPlaceTypeEnum.STATION) {
        importField.push({
          col: this.excelService.columnIndexToColumnLetter(importField.length + 1),
          filed: `${item.workPlaceCode}-all_quantities`,
          excelFiled: `${item.workPlaceName}`,
          remarks: '',
        });
      } else if (item.workPlaceType === WorkPlaceTypeEnum.SECTION) {
        importField.push({
          col: this.excelService.columnIndexToColumnLetter(importField.length + 1),
          filed: `${item.workPlaceCode}-left_quantities`,
          excelFiled: `${item.workPlaceName}左线`,
          remarks: '',
        });
        importField.push({
          col: this.excelService.columnIndexToColumnLetter(importField.length + 1),
          filed: `${item.workPlaceCode}-right_quantities`,
          excelFiled: `${item.workPlaceName}右线`,
          remarks: '',
        });
      }
    });
    return await this.excelService.excelImport({
      file,
      userInfo,
      callback: this.uploadRelevanceFun.bind(this),
      customOptions: {
        sheetName: 'Sheet1',
        skipRows: 3,
        importField: JSON.stringify(importField),
      },
    });
  }

  async uploadRelevanceFun(data: any, userInfo: User) {
    if (data.quantities < data.allotQuantities) {
      throw new BadRequestException('分配数量不能大于总数量');
    }
    const workPlaceIds = await this.workPlaceRepository.find({
      where: { tenantId: userInfo.tenantId },
      select: ['id', 'workPlaceCode'],
    });
    const createData = [];
    const listId = await this.listService.transitionIdOrName(data.list_code, userInfo);
    const workPlaceKeys = Object.keys(data).filter((item) => item.endsWith('_quantities'));
    const workPlaceData = [];
    workPlaceKeys.forEach((item) => {
      const [workPlaceCode, quantities] = item.split('-');
      const obj = {};
      obj['workPlaceCode'] = workPlaceCode;
      obj['all_quantities'] = quantities === 'all_quantities' ? data[item] : 0;
      obj['left_quantities'] = quantities === 'left_quantities' ? data[item] : 0;
      obj['right_quantities'] = quantities === 'right_quantities' ? data[item] : 0;
      workPlaceData.push(obj);
    });
    const newData = [];
    workPlaceData.forEach((item) => {
      const index = newData.findIndex((i) => i.workPlaceCode === item.workPlaceCode);
      if (index !== -1) {
        const { workPlaceCode, all_quantities, left_quantities, right_quantities } = newData[index];
        newData[index] = {
          workPlaceCode: workPlaceCode,
          all_quantities: all_quantities + item.all_quantities,
          left_quantities: left_quantities + item.left_quantities,
          right_quantities: right_quantities + item.right_quantities,
        };
      } else {
        newData.push(item);
      }
    });
    newData.forEach((item) => {
      const obj = {
        tenantId: userInfo.tenantId,
        createDept: userInfo.deptId,
        createBy: userInfo.userName,
        updateBy: userInfo.userName,
        allQuantities: Number(new Decimal(item.all_quantities).plus(item.left_quantities).plus(item.right_quantities)),
        leftQuantities: item.left_quantities,
        rightQuantities: item.right_quantities,
        workPlaceId: workPlaceIds.find((w) => w.workPlaceCode === item.workPlaceCode).id,
        listId: listId,
        combinedPrice: Number(
          Decimal.mul(
            new Decimal(item.all_quantities).plus(item.left_quantities).plus(item.right_quantities),
            data.unit_price,
          ),
        ),
      };
      if (obj.allQuantities > 0) {
        createData.push(obj);
      }
    });
    await this.workPlaceListRepository.save(createData);
  }
}
