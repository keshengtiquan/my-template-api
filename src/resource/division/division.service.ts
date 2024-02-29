import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { Division } from './entities/division.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../../sys/user/entities/user.entity';
import { handleTree } from '../../utils';
import { AddListDto } from './dto/add-list.dto';
import { List } from '../list/entities/list.entity';
import { MyLoggerService } from '../../common/my-logger/my-logger.service';
import Decimal from 'decimal.js';
import { ImportFileService } from '../../enmus';
import { ExcelService } from '../../excel/excel.service';

@Injectable()
export class DivisionService {
  @InjectRepository(Division)
  private divisionRepository: Repository<Division>;
  @InjectRepository(List)
  private listRepository: Repository<List>;
  @Inject()
  private loggerService: MyLoggerService;
  @Inject()
  private excelService: ExcelService;

  /**
   * 创建分部分项
   * @param createDivisionDto
   * @param userInfo
   */
  async create(createDivisionDto: CreateDivisionDto, userInfo: User) {
    try {
      const findDivision = await this.divisionRepository.findOne({
        where: {
          divisionName: createDivisionDto.divisionName,
          tenantId: userInfo.tenantId,
        },
      });
      if (findDivision) {
        throw new Error('分部分项名称已存在');
      }
      //获取所有父级节点的id
      const divisions = await this.divisionRepository.find({
        where: {
          tenantId: userInfo.tenantId,
        },
      });
      const divisionTree = handleTree(divisions);
      const parentNames = this.getParentNamesById(divisionTree, createDivisionDto.parentId);
      //创建分部分项
      const division = new Division();
      division.parentId = createDivisionDto.parentId;
      division.divisionName = createDivisionDto.divisionName;
      division.divisionType = createDivisionDto.divisionType;
      division.tenantId = userInfo.tenantId;
      division.createBy = userInfo.userName;
      division.updateBy = userInfo.userName;
      division.createDept = userInfo.deptId;
      return await this.divisionRepository.manager.transaction(async (manager) => {
        const divisionRes = await manager.save(division);
        parentNames.push(divisionRes.id);
        divisionRes.parentNames = JSON.stringify(parentNames);
        return await manager.save(divisionRes);
      });
    } catch (e) {
      if (e instanceof Error) {
        throw new BadRequestException(e.message);
      } else {
        throw new BadRequestException('更新工程量失败');
      }
    }
  }

  /**
   * 获取分部分项树
   * @param userInfo
   */
  async getTree(userInfo: User) {
    const queryBuilder = this.divisionRepository
      .createQueryBuilder('d')
      .leftJoin(List, 'list', 'list.current_section = d.id')
      .select([
        'd.division_name as divisionName',
        'd.parent_id as parentId',
        'd.id as id',
        'd.create_time as createTime',
        'd.create_by as createBy',
        'd.update_time as updateTime',
        'd.update_by as updateBy',
        'd.division_type as divisionType',
        'd.parent_names as parentNames',
        'COALESCE(CAST(SUM(list.unit_price * list.quantities)as DECIMAL(18,2)),0) as outputValue',
      ])
      .where('d.tenant_id = :tenantId', { tenantId: userInfo.tenantId })
      .groupBy('d.division_name')
      .addGroupBy('d.id')
      .addGroupBy('d.division_type')
      .addGroupBy('d.parent_id');
    try {
      const res = await queryBuilder.getRawMany();
      const tree = handleTree(res);
      const newTree = this.addTreeLeaf(tree);
      const rootNode = newTree[0];
      if (rootNode) {
        this.calculateOutputValue(rootNode);
      }

      return newTree;
    } catch (e) {
      throw new BadRequestException('获取分部分项树失败');
    }
  }

  /**
   * 根据ID获取分部分项
   * @param id
   * @param userInfo
   */
  async getOne(id: string, userInfo: User) {
    try {
      return await this.divisionRepository.findOne({
        where: {
          id: id,
          tenantId: userInfo.tenantId,
        },
      });
    } catch (e) {
      throw new BadRequestException('获取分部分项失败');
    }
  }

  /**
   * 更新分部分项
   * @param id
   * @param updateDivisionDto
   */
  async updateById(updateDivisionDto: UpdateDivisionDto, userInfo: User) {
    const division = new Division();
    division.id = updateDivisionDto.id;
    division.divisionName = updateDivisionDto.divisionName;
    division.divisionType = updateDivisionDto.divisionType;
    division.parentId = updateDivisionDto.parentId;
    division.updateBy = userInfo.userName;
    try {
      return await this.divisionRepository.save(division);
    } catch (e) {
      throw new BadRequestException('更新分部分项失败');
    }
  }

  /**
   * 删除分部分项
   * @param id
   * @param userInfo
   */
  async deleteById(id: string, isTreeLeaf: boolean) {
    try {
      if (isTreeLeaf) {
        throw new Error('存在下级节点不能删除');
      }
      await this.listRepository.manager.transaction(async (manager) => {
        await manager
          .createQueryBuilder()
          .update(List)
          .set({ sectionalEntry: '', currentSection: '' })
          .where('currentSection = :id', { id })
          .execute();
        return await this.divisionRepository.delete({ id });
      });
    } catch (e) {
      this.loggerService.error(`删除分部分项失败【${e.message}】`, Division.name);
      if (e instanceof Error) {
        throw new BadRequestException(e.message);
      } else {
        throw new BadRequestException('删除分部分项失败');
      }
    }
  }

  /**
   * 获取树形结构的上级id
   * @param treeData 树形结构数组
   * @param parentId 当前节点的父级ID
   * @param parentIds 上级ID数据，调用时可省略
   */
  getParentNamesById(treeData: any[], parentId: string, parentIds = []) {
    for (const node of treeData) {
      if (node.id === parentId) {
        return [...parentIds, node.id];
      }
      if (node.children && node.children.length > 0) {
        const found = this.getParentNamesById(node.children, parentId, [...parentIds, node.id]);
        if (found.length > 0) {
          return found;
        }
      }
    }
    return [];
  }

  /**
   * 添加isTreeLeaf字段
   * @param data
   */
  addTreeLeaf(data: any[]) {
    return data.map((item) => {
      const obj = { ...item, isTreeLeaf: true };
      if (item.children && item.children.length > 0) {
        obj.children = this.addTreeLeaf(item.children);
      } else {
        obj.isTreeLeaf = false;
      }
      return obj;
    });
  }

  /**
   * 分部分项分配清单
   * @param addListDto
   */
  async addList(addListDto: AddListDto) {
    try {
      const res = await this.listRepository
        .createQueryBuilder()
        .update(List)
        .set({
          sectionalEntry: JSON.stringify(addListDto.parentNames),
          currentSection: addListDto.parentNames[addListDto.parentNames.length - 1],
        })
        .where('id in (:...listIds)', { listIds: addListDto.listIds })
        .execute();
      // await this.updateOutPutValue(addListDto.divisionId, userInfo)
      return res;
    } catch (e) {
      this.loggerService.error(`添加分部分项失败【${e.message}】`, Division.name);
      throw new BadRequestException('添加分部分项失败');
    }
  }

  /**
   * 查询分部分项关联的清单列表
   * @param divisionId 分部分项id
   * @param userInfo
   */
  async getDivisionList(divisionId: string, current: number, pageSize: number, userInfo: User) {
    try {
      const [list, total] = await this.listRepository
        .createQueryBuilder('list')
        .skip((current - 1) * pageSize)
        .take(pageSize)
        .orderBy('list.serialNumber', 'ASC')
        .where('list.sectionalEntry like :divisionId', { divisionId: `%${divisionId}%` })
        .andWhere('list.tenantId= :tenantId', { tenantId: userInfo.tenantId })
        .getManyAndCount();
      return {
        results: list,
        current,
        total,
        pageSize,
      };
    } catch (e) {
      throw new BadRequestException('查询分部分项关联的清单列表失败');
    }
  }

  /**
   * 批量删除分部分项关联的清单
   * @param ids 清单列表的ids
   * @param userInfo
   */
  async deleteDivisionList(ids: string[]) {
    try {
      return await this.listRepository.manager.transaction(async (manager) => {
        const res = await manager
          .createQueryBuilder()
          .update(List)
          .set({ sectionalEntry: '', currentSection: '' })
          .where('id in (:...ids)', { ids })
          .execute();
        // await this.updateOutPutValue(divisionId, userInfo)
        return res;
      });
    } catch (e) {
      throw new BadRequestException('删除分部分项关联的清单失败');
    }
  }

  /**
   * 更新当前分项的产值
   * @param divisionId
   * @param userInfo
   */
  calculateOutputValue(node: any) {
    if (node.children && node.children.length > 0) {
      // 如果当前节点有子节点，对每个子节点进行递归计算
      let sum = 0;
      for (const child of node.children) {
        sum = Number(Decimal.add(sum, this.calculateOutputValue(child)));
      }
      node.outputValue = sum; // 更新当前节点的outputValue为子节点之和
    }
    return parseFloat(node.outputValue); // 返回当前节点的outputValue
  }

  /**
   * 根据类型获取分部分项
   * @param divisionType
   * @param userInfo
   */
  async getSectional(divisionType: string, userInfo: User) {
    return await this.divisionRepository.find({
      where: {
        divisionType,
        tenantId: userInfo.tenantId,
      },
    });
  }

  /**
   * 上传分部分项划分
   * @param file
   * @param userInfo
   */
  async upload(file: Express.Multer.File, userInfo: User) {
    function conditionCheckFunc(data) {
      return !data.A || !data.C;
    }
    return await this.excelService.excelImport({
      file,
      userInfo,
      serviceName: ImportFileService.DIVISIONIMPORT,
      callback: this.uploadFun.bind(this),
      conditionCheckFunc: conditionCheckFunc,
    });
  }

  async uploadFun(data: any, userInfo: User) {
    const insertArr: Division[] = [];
    const { unitProject, subunitProject, segmentProject, subsegmentProject, subitemProject } = data;
    const alreadyExist = await this.divisionRepository.find({
      where: {
        divisionName: In([unitProject, subunitProject, segmentProject, subsegmentProject, subitemProject]),
        tenantId: userInfo.tenantId,
      },
      select: ['divisionName'],
    });
    const alreadyName = alreadyExist.map((item) => item.divisionName);
    //单位工程
    if (unitProject && !alreadyName.includes(unitProject)) {
      const res = await this.create({ divisionName: unitProject, divisionType: '单位工程', parentId: '0' }, userInfo);
      if (res) insertArr.push(res);
    }
    //子单位工程
    if (subunitProject && !alreadyName.includes(subunitProject)) {
      // const superiorsData = insertArr.find((item) => item.divisionName === unitProject)
      const superiorsData = await this.divisionRepository.findOne({
        where: {
          divisionName: unitProject,
          tenantId: userInfo.tenantId,
        },
      });
      const res = await this.create(
        { divisionName: subunitProject, divisionType: '子单位工程', parentId: superiorsData.id },
        userInfo,
      );
      if (res) insertArr.push(res);
    }
    //分部工程
    if (segmentProject && !alreadyName.includes(segmentProject)) {
      const superiorsData = await this.divisionRepository.findOne({
        where: {
          divisionName: subunitProject ? subunitProject : unitProject,
          tenantId: userInfo.tenantId,
        },
      });
      const res = await this.create(
        { divisionName: segmentProject, divisionType: '分部工程', parentId: superiorsData.id },
        userInfo,
      );
      if (res) insertArr.push(res);
    }
    //子分部工程
    if (subsegmentProject && !alreadyName.includes(subsegmentProject)) {
      const superiorsData = await this.divisionRepository.findOne({
        where: {
          divisionName: segmentProject,
          tenantId: userInfo.tenantId,
        },
      });
      const res = await this.create(
        { divisionName: subsegmentProject, divisionType: '子分部工程', parentId: superiorsData.id },
        userInfo,
      );
      if (res) insertArr.push(res);
    }
    //分项工程
    if (subitemProject && !alreadyName.includes(subitemProject)) {
      const superiorsData = await this.divisionRepository.findOne({
        where: {
          divisionName: subsegmentProject ? subsegmentProject : segmentProject,
          tenantId: userInfo.tenantId,
        },
      });
      const res = await this.create(
        { divisionName: subitemProject, divisionType: '分项工程', parentId: superiorsData.id },
        userInfo,
      );
      if (res) insertArr.push(res);
    }
  }
}
