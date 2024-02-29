import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ExcelService } from '../../excel/excel.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Excel } from '../../excel/entities/excel.entity';
import { Repository } from 'typeorm';
import { List } from './entities/list.entity';
import { User } from '../../sys/user/entities/user.entity';
import { Order } from '../../types';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ExportFileService, ImportFileService, ManagementGroup } from '../../enmus';
import { ExportExcel } from '../../excel/entities/export.excel.entity';
import { WorkPlaceList } from '../workplace/entities/workplace.list.entity';
import { GanttList } from '../../plan/gantt/entities/gantt-list.entity';
import { MyLoggerService } from '../../common/my-logger/my-logger.service';
import { Issued } from '../../plan/issued/entities/issued.entity';
import { ProjectLogDetail } from '../../project-log/entities/project-log-detail.entity';
import { Division } from '../division/entities/division.entity';

@Injectable()
export class ListService {
  @Inject()
  private readonly excelService: ExcelService;
  @Inject()
  private loggerService: MyLoggerService;
  @InjectRepository(Excel)
  private excelRepository: Repository<Excel>;
  @InjectRepository(List)
  private listRepository: Repository<List>;
  @InjectRepository(ExportExcel)
  private exportExcelRepository: Repository<ExportExcel>;
  @InjectRepository(WorkPlaceList)
  private workPlaceListRepository: Repository<WorkPlaceList>;
  @InjectRepository(GanttList)
  private ganttListRepository: Repository<GanttList>;
  @InjectRepository(Issued)
  private issuedRepository: Repository<Issued>;
  @InjectRepository(ProjectLogDetail)
  private projectLogDetailRepository: Repository<ProjectLogDetail>;
  @InjectRepository(Division)
  private divisionRepository: Repository<Division>;

  async upload(file: Express.Multer.File, userInfo: User) {
    function conditionCheckFunc(data) {
      return typeof data.A !== 'number';
    }

    return await this.excelService.excelImport({
      file,
      userInfo,
      serviceName: ImportFileService.PROJECTIMPORT,
      callback: this.create.bind(this),
      conditionCheckFunc: conditionCheckFunc,
    });
  }

  /**
   * 查询清单列表
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param userInfo
   */
  async getlist(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    listCode: string,
    listName: string,
    listCharacteristic: string,
    sectionalEntry: string,
    userInfo: User,
  ) {
    const queryBuilder = this.listRepository
      .createQueryBuilder('list')
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .orderBy(`list.${sortField}`, sortOrder)
      .where('list.tenantId = :tenantId', {
        tenantId: userInfo.tenantId,
      });
    if (listCode) {
      queryBuilder.where('list.listCode = :listCode', { listCode });
    }
    if (listName) {
      queryBuilder.andWhere('list.listName like :listName', { listName: `%${listName}%` });
    }
    if (listCharacteristic) {
      queryBuilder.andWhere('list.listCharacteristic like :listCharacteristic', {
        listCharacteristic: `%${listCharacteristic}%`,
      });
    }
    if (sectionalEntry) {
      queryBuilder.andWhere('list.sectionalEntry like :sectionalEntry', {
        sectionalEntry: `%${sectionalEntry}%`,
      });
    }
    try {
      const [list, total] = await queryBuilder.getManyAndCount();
      return {
        results: list,
        current: current,
        pageSize: pageSize,
        total,
      };
    } catch (e) {
      throw new BadRequestException('查询列表失败');
    }
  }

  /**
   * 获取清单
   * @param id
   */
  async getOneById(id: string) {
    try {
      return await this.listRepository.findOne({
        where: { id },
      });
    } catch (e) {
      throw new BadRequestException('查询清单失败');
    }
  }

  /**
   * 创建清单
   * @param createListDto
   * @param userInfo
   */
  async create(createListDto: CreateListDto, userInfo: User) {
    const list = new List();
    list.serialNumber = createListDto.serialNumber;
    list.listCode = createListDto.listCode;
    list.listName = createListDto.listName;
    list.listCharacteristic = createListDto.listCharacteristic;
    list.quantities = createListDto.quantities;
    list.unitPrice = createListDto.unitPrice;
    list.unit = createListDto.unit;
    list.combinedPrice = createListDto.combinedPrice;
    list.createBy = userInfo.userName;
    list.updateBy = userInfo.userName;
    list.tenantId = userInfo.tenantId;
    list.createDept = userInfo.deptId;
    list.designQuantities = createListDto.quantities;
    if (createListDto.currentSection) {
      const division = await this.divisionRepository.findOne({
        where: { divisionName: createListDto.currentSection, tenantId: userInfo.tenantId },
        select: ['id', 'parentNames'],
      });
      list.currentSection = division.id;
      list.sectionalEntry = division.parentNames;
    }
    try {
      return await this.listRepository.save(list);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * 更新列表
   * @param updateListDto
   * @param userInfo
   */
  async update(updateListDto: UpdateListDto, userInfo: User) {
    try {
      return await this.listRepository.update(
        { id: updateListDto.id },
        {
          serialNumber: updateListDto.serialNumber,
          listCode: updateListDto.listCode,
          listName: updateListDto.listName,
          listCharacteristic: updateListDto.listCharacteristic,
          quantities: updateListDto.quantities,
          unitPrice: updateListDto.unitPrice,
          unit: updateListDto.unit,
          combinedPrice: updateListDto.combinedPrice,
          updateBy: userInfo.userName,
        },
      );
    } catch (e) {
      throw new BadRequestException('更新清单失败');
    }
  }

  /**
   * 删除清单
   * @param id
   */
  async delete(id: string) {
    try {
      return await this.listRepository.delete({ id });
    } catch (e) {
      throw new BadRequestException('删除清单失败');
    }
  }

  /**
   * 导出清单
   */
  async export(sectionalEntry: string, userInfo: User) {
    const tableData = await this.exportListFun(sectionalEntry, userInfo);
    try {
      return await this.excelService.exportExcel(
        {
          serviceName: ExportFileService.LISTEXPORT,
          tableData,
          extraStyle: {
            col: 4,
            row: 2,
            alignment: {
              wrapText: true,
              vertical: 'middle',
              horizontal: 'left',
            },
          },
        },
        userInfo,
      );
    } catch (e) {
      throw new BadRequestException('导出清单失败');
    }
  }

  async exportListFun(sectionalEntry: string, userInfo: User) {
    const queryBuilder = this.listRepository
      .createQueryBuilder('list')
      .orderBy(`list.serialNumber`, 'ASC')
      .where('list.tenantId = :tenantId', {
        tenantId: userInfo.tenantId,
      });
    if (sectionalEntry) {
      queryBuilder.andWhere('list.sectionalEntry like :sectionalEntry', {
        sectionalEntry: `%${sectionalEntry}%`,
      });
    }
    try {
      return await queryBuilder.getMany();
    } catch (e) {
      throw new BadRequestException('查询列表失败');
    }
  }

  /**
   * 查询排除后的列表（工点）
   * @param current
   * @param pageSize
   * @param workplaceId
   * @param sortField
   * @param sortOrder
   * @param userInfo
   */
  async getlistExclude(
    current: number,
    pageSize: number,
    workPlaceId: string,
    sortField: string,
    sortOrder: Order,
    userInfo: User,
  ) {
    const queryBuilder = this.listRepository
      .createQueryBuilder('list')
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .orderBy(`list.${sortField}`, sortOrder);
    if (userInfo.tenantId !== ManagementGroup.ID) {
      queryBuilder.where('list.tenantId = :tenantId', {
        tenantId: userInfo.tenantId,
      });
    }
    try {
      const workPlaceLists = await this.workPlaceListRepository.find({
        where: { workPlaceId, tenantId: userInfo.tenantId },
      });
      const ids = workPlaceLists.map((w) => w.listId);
      if (ids.length > 0) {
        queryBuilder.andWhere('list.id NOT IN (:...ids)', { ids });
      }
      const [list, total] = await queryBuilder.getManyAndCount();
      return {
        results: list,
        current: current,
        pageSize: pageSize,
        total,
      };
    } catch (e) {
      throw new BadRequestException('获取清单失败');
    }
  }

  /**
   * 查询排除后的列表（分部分项）
   * @param current
   * @param pageSize
   * @param listCode
   * @param listName
   * @param listCharacteristic
   * @param userInfo
   */
  async getlistDivisionExclude(
    current: number,
    pageSize: number,
    listCode: string,
    listName: string,
    listCharacteristic: string,
    userInfo: User,
  ) {
    const queryBuilder = this.listRepository
      .createQueryBuilder('list')
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .orderBy('list.serialNumber', 'ASC')
      .where('list.sectionalEntry = :sectionalEntry', { sectionalEntry: '' });

    queryBuilder.andWhere('list.tenantId = :tenantId', {
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
      const [list, total] = await queryBuilder.getManyAndCount();
      return {
        results: list,
        current: current,
        pageSize: pageSize,
        total,
      };
    } catch (e) {
      throw new BadRequestException('查询列表失败');
    }
  }

  /**
   * 查询排除后的列表（甘特图）
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param listCode
   * @param listName
   * @param listCharacteristic
   * @param sectionalEntry
   * @param userInfo
   */
  async getGanttExclude(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    listCode: string,
    listName: string,
    listCharacteristic: string,
    sectionalEntry: string,
    userInfo: User,
  ) {
    const queryBuilder = this.listRepository
      .createQueryBuilder('list')
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .orderBy(`list.${sortField}`, sortOrder)
      .where('list.tenantId = :tenantId', {
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
    if (sectionalEntry) {
      queryBuilder.andWhere('list.sectionalEntry like :sectionalEntry', {
        sectionalEntry: `%${sectionalEntry}%`,
      });
    }
    try {
      const lists = await this.ganttListRepository.find({
        where: {
          // ganttId: ganttId,
          tenantId: userInfo.tenantId,
        },
        select: ['listId'],
      });
      const listIds = lists.map((item) => item.listId);
      if (listIds.length > 0) {
        queryBuilder.andWhere('list.id NOT IN (:...listIds)', { listIds });
      }
      const [list, total] = await queryBuilder.getManyAndCount();
      return {
        results: list,
        current: current,
        pageSize: pageSize,
        total,
      };
    } catch (e) {
      this.loggerService.error(`获取甘特图排除清单失败${e.message}`, List.name);
      throw new BadRequestException('获取列表失败');
    }
  }

  /**
   * 查询排除后的列表（计划）
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param planName
   * @param listCode
   * @param listName
   * @param listCharacteristic
   * @param sectionalEntry
   * @param userInfo
   */
  async getPlanExclude(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    planName: string,
    listCode: string,
    listName: string,
    listCharacteristic: string,
    sectionalEntry: string,
    userInfo: User,
  ) {
    try {
      const plans = await this.issuedRepository.find({
        where: {
          planName: planName,
          tenantId: userInfo.tenantId,
        },
        select: ['listId'],
      });

      const listIds = plans.map((item) => item.listId);
      const queryBuilder = this.listRepository
        .createQueryBuilder('list')
        .skip((current - 1) * pageSize)
        .take(pageSize)
        .orderBy(`list.${sortField}`, sortOrder)
        .where('list.tenantId = :tenantId', {
          tenantId: userInfo.tenantId,
        })
        .andWhere('list.id NOT IN (:...listIds)', { listIds });
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
      if (sectionalEntry) {
        queryBuilder.andWhere('list.sectionalEntry like :sectionalEntry', {
          sectionalEntry: `%${sectionalEntry}%`,
        });
      }
      const [list, total] = await queryBuilder.getManyAndCount();

      return {
        results: list,
        current,
        total,
        pageSize,
      };
    } catch (e) {
      this.loggerService.error(`获取甘特图排除清单失败${e.message}`, List.name);
      throw new BadRequestException('获取列表失败');
    }
  }

  /**
   * 获取日志列表（排除已关联的日志）
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param logId
   * @param listCode
   * @param listName
   * @param listCharacteristic
   * @param sectionalEntry
   * @param userInfo
   */
  async getLogExclude(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    logId: string,
    listCode: string,
    listName: string,
    listCharacteristic: string,
    sectionalEntry: string,
    userInfo: User,
  ) {
    const lists = await this.projectLogDetailRepository.find({
      where: {
        logId: logId,
        tenantId: userInfo.tenantId,
      },
      select: ['listId'],
    });
    const listIds = lists.map((item) => item.listId);
    const queryBuilder = this.listRepository
      .createQueryBuilder('list')
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .orderBy(`list.${sortField}`, sortOrder)
      .where('list.tenantId = :tenantId', {
        tenantId: userInfo.tenantId,
      });
    if (listIds.length > 0) {
      queryBuilder.andWhere('list.id NOT IN (:...listIds)', { listIds });
    }
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
    if (sectionalEntry) {
      queryBuilder.andWhere('list.sectionalEntry like :sectionalEntry', {
        sectionalEntry: `%${sectionalEntry}%`,
      });
    }
    const [list, total] = await queryBuilder.getManyAndCount();

    return {
      results: list,
      current,
      total,
      pageSize,
    };
  }

  /**
   * 设置清单为重点关注清单
   * @param id
   * @param userInfo
   */
  async setFocus(id: string, isFocusList: boolean, userInfo: User) {
    return await this.listRepository.update(
      { id },
      {
        isFocusList: isFocusList,
        updateBy: userInfo.userName,
      },
    );
  }

  /**
   * 清单名称和id互转
   * @param filed
   * @param userInfo
   */
  async transitionIdOrName(filed: string, userInfo: User) {
    // const name = await this.listRepository.findOne({
    //   where: {
    //     id: filed,
    //     tenantId: userInfo.tenantId,
    //   },
    // })
    // if (name) {
    //   return name.listCode
    // }
    const id = await this.listRepository.findOne({
      where: {
        listCode: filed,
        tenantId: userInfo.tenantId,
      },
    });
    if (id) {
      return id.id;
    }
    throw new BadRequestException('请输入正确的名称或ID');
  }

  /**
   * 批量删除清单
   * @param ids
   * @param userInfo
   */
  async batchDelete(ids: string[], userInfo: User) {
    await this.listRepository
      .createQueryBuilder()
      .delete()
      .from(List)
      .where('id in (:...ids)', { ids })
      .andWhere('tenantId = :tenantId', { tenantId: userInfo.tenantId })
      .execute();
  }

  /**
   * 获取三量对比表
   * @param current 当前页
   * @param pageSize 页面大小
   * @param sortField 排序字段
   * @param sortOrder 排序方式
   * @param listCode 项目编码
   * @param listName 项目名称
   * @param listCharacteristic 项目特征
   * @param sectionalEntry 分部分项
   * @param userInfo 用户信息
   * @returns 清单列表
   */
  async listCompare(
    current: number,
    pageSize: number,
    sortField: string,
    sortOrder: Order,
    listCode: string,
    listName: string,
    listCharacteristic: string,
    sectionalEntry: string,
    userInfo: User,
  ) {
    const queryBuilder = this.listRepository
      .createQueryBuilder('list')
      .leftJoin(ProjectLogDetail, 'pld', 'pld.list_id = list.id')
      .select([
        'list.id as id',
        'list.serial_number as serialNumber',
        'list.list_code as listCode',
        'list.list_name as listName',
        'list.list_characteristic as listCharacteristic',
        'list.unit as unit',
        'list.quantities as quantities',
        'list.design_quantities as designQuantities',
        'CAST(SUM(pld.completion_quantity)AS DECIMAL(18, 2)) as completionQuantities',
      ])
      .orderBy(`list.${sortField}`, sortOrder)
      .where('list.tenant_id = :tenantId', { tenantId: userInfo.tenantId })
      .groupBy('list.id')
      .addGroupBy('list.serial_number')
      .addGroupBy('list.list_code')
      .addGroupBy('list.list_name')
      .addGroupBy('list.list_characteristic')
      .addGroupBy('list.unit')
      .addGroupBy('list.quantities')
      .addGroupBy('list.design_quantities')
      .offset((current - 1) * pageSize)
      .limit(pageSize);
    if (listCode) {
      queryBuilder.andWhere('list.list_code like :listCode', { listCode: `%${listCode}%` });
    }
    if (listName) {
      queryBuilder.andWhere('list.list_name like :listName', { listName: `%${listName}%` });
    }
    if (listCharacteristic) {
      queryBuilder.andWhere('list.list_characteristic like :listCharacteristic', {
        listCharacteristic: `%${listCharacteristic}%`,
      });
    }
    if (sectionalEntry) {
      queryBuilder.andWhere('list.sectionalEntry like :sectionalEntry', {
        sectionalEntry: `%${sectionalEntry}%`,
      });
    }

    const data = await queryBuilder.getRawMany();

    return {
      results: data,
      current,
      pageSize,
      total: await queryBuilder.getCount(),
    };
  }

  /**
   * 更新图纸量
   * @param id
   * @param designQuantities
   */
  async updateListCompare(id: string, designQuantities: number) {
    return await this.listRepository.update(
      { id },
      {
        designQuantities,
      },
    );
  }
}
