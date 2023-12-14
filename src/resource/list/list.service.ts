import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { ExcelService, ExportExcelParamsType } from '../../excel/excel.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Excel } from '../../excel/entities/excel.entity'
import { Repository } from 'typeorm'
import { List } from './entities/list.entity'
import { User } from '../../sys/user/entities/user.entity'
import { Order } from '../../types'
import { CreateListDto } from './dto/create-list.dto'
import { UpdateListDto } from './dto/update-list.dto'
import { ExportFileService, ImportFileService, ManagementGroup } from '../../enmus'
import { ExportExcel } from '../../excel/entities/export.excel.entity'

@Injectable()
export class ListService {
  @Inject()
  private readonly excelService: ExcelService
  @InjectRepository(Excel)
  private excelRepository: Repository<Excel>
  @InjectRepository(List)
  private listRepository: Repository<List>
  @InjectRepository(ExportExcel)
  private exportExcelRepository: Repository<ExportExcel>

  async upload(file: Express.Multer.File, userInfo: User) {
    function conditionCheckFunc(data) {
      return typeof data.A !== 'number'
    }
    return await this.excelService.excelImport(
      file,
      userInfo,
      ImportFileService.PROJECTIMPORT,
      this.create.bind(this),
      conditionCheckFunc,
    )
  }

  test() {
    console.log('测试')
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
    userInfo: User,
  ) {
    const queryBuilder = this.listRepository
      .createQueryBuilder('list')
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .orderBy(`list.${sortField}`, sortOrder)

    if (userInfo.tenantId !== ManagementGroup.ID) {
      queryBuilder.where('list.tenantId = :tenantId', {
        tenantId: userInfo.tenantId,
      })
    }
    if (listCode) {
      queryBuilder.where('list.listCode = :listCode', { listCode })
    }
    if (listName) {
      queryBuilder.andWhere('list.listName like :listName', { listName: `%${listName}%` })
    }
    if (listCharacteristic) {
      queryBuilder.andWhere('list.listCharacteristic like :listCharacteristic', {
        listCharacteristic: `%${listCharacteristic}%`,
      })
    }
    try {
      const [list, total] = await queryBuilder.getManyAndCount()
      return {
        results: list,
        current: current,
        pageSize: pageSize,
        total,
      }
    } catch (e) {
      throw new BadRequestException('查询列表失败')
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
      })
    } catch (e) {
      throw new BadRequestException('查询清单失败')
    }
  }

  /**
   * 创建清单
   * @param createListDto
   * @param userInfo
   */
  async create(createListDto: CreateListDto, userInfo: User) {
    const list = new List()
    list.serialNumber = createListDto.serialNumber
    list.listCode = createListDto.listCode
    list.listName = createListDto.listName
    list.listCharacteristic = createListDto.listCharacteristic
    list.quantities = createListDto.quantities
    list.unitPrice = createListDto.unitPrice
    list.unit = createListDto.unit
    list.combinedPrice = createListDto.combinedPrice
    list.createBy = userInfo.userName
    list.updateBy = userInfo.userName
    list.tenantId = userInfo.tenantId
    list.createDept = userInfo.deptId
    try {
      return await this.listRepository.save(list)
    } catch (e) {
      console.log(e)
      throw new BadRequestException('创建清单失败')
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
      )
    } catch (e) {
      throw new BadRequestException('更新清单失败')
    }
  }

  /**
   * 删除清单
   * @param id
   */
  async delete(id: string) {
    try {
      return await this.listRepository.delete({ id })
    } catch (e) {
      throw new BadRequestException('删除清单失败')
    }
  }

  /**
   * 导出清单
   */
  async export(current: number, pageSize: number) {
    try {
      const excelHeader = await this.exportExcelRepository.findOne({
        where: { exportService: ExportFileService.LISTEXPORT },
      })
      const queryBuilder = this.listRepository.createQueryBuilder('list').orderBy('list.serialNumber', 'ASC')
      if (current && pageSize) {
        queryBuilder.skip((current - 1) * pageSize)
        queryBuilder.take(pageSize)
      }
      const listData = await queryBuilder.getMany()
      const options: ExportExcelParamsType = {
        style: {
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
        },
        headerColumns: JSON.parse(excelHeader.exportFields),
        sheetName: excelHeader.sheetName,
        tableData: listData,
      }
      return options
    } catch (e) {
      console.log(e)
      throw new BadRequestException('导出清单失败')
    }
  }
}
