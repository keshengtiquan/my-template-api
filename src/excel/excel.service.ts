import { BadRequestException, Injectable } from '@nestjs/common'
import * as Exceljs from 'exceljs'
import { Express } from 'express'
import { CreateExcelDto } from './dto/create-excel.dto'
import { User } from '../sys/user/entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Excel } from './entities/excel.entity'
import { Repository } from 'typeorm'
import { ManagementGroup } from '../enmus'
import { UpdateExcelDto } from './dto/update-excel.dto'
import { CreateExportExcelDto } from './dto/create-export-excel.dto'
import { ExportExcel } from './entities/export.excel.entity'

export interface ExportExcelParamsType {
  style: Record<string, any> //excel表的样式配置
  tableData: any[] //表的数据内容
  headerColumns: { width: number; excelFiled: string; filed: string }[] //表头配置
  sheetName: string //工作表名
}

@Injectable()
export class ExcelService {
  @InjectRepository(Excel)
  private excelRepository: Repository<Excel>
  @InjectRepository(ExportExcel)
  private exportExcelRepository: Repository<ExportExcel>

  /**
   * 解析Excel文件 单页签
   * @param file 文件
   * @param sheetName 要解析的页签名称
   * @param skipRows 从第几行开始
   */
  async parseExcel(file: any, sheetName: string, skipRows: number) {
    const workbook = new Exceljs.Workbook()
    await workbook.xlsx.load(file.buffer)
    const worksheetNames = []
    //获取表格中所有的sheet名称
    for (const worksheet of workbook.worksheets) {
      worksheetNames.push(worksheet.name)
    }
    const index = worksheetNames.findIndex((item) => item === sheetName)
    //解析对应页签
    const worksheet = workbook.getWorksheet(worksheetNames[index])
    const rows = []

    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber < skipRows) {
        return
      }
      const rowData = {}
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        const key = this.columnIndexToColumnLetter(col)
        rowData[key] = cell.value
      })
      rows.push(rowData)
    })
    return rows
  }

  /**
   * 解析导入表格表头
   * @param file
   */
  async parseTemplate(file: Express.Multer.File) {
    const workbook = new Exceljs.Workbook()
    await workbook.xlsx.load(file.buffer)
    const worksheetNames = []
    //获取表格中所有的sheet名称
    for (const worksheet of workbook.worksheets) {
      worksheetNames.push(worksheet.name)
    }
    const sheetFields: any = {}
    worksheetNames.forEach((sheetName) => {
      const worksheet = workbook.getWorksheet(sheetName)
      const rowDate = []
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell({ includeEmpty: true }, (cell) => {
            rowDate.push(cell.value)
          })
          sheetFields[sheetName] = rowDate
        } else {
          return
        }
      })
    })
    return {
      sheetNames: worksheetNames,
      fileName: file.originalname,
      sheetFields: sheetFields,
    }
  }

  /**
   * excel文件导入
   * @param file
   * @param userInfo
   * @param serviceName
   * @param callback
   * @param conditionCheckFunc
   */
  async excelImport(
    file: Express.Multer.File,
    userInfo: User,
    serviceName: string,
    callback: (...args: any[]) => Promise<any>,
    conditionCheckFunc?: (data: object) => boolean,
  ) {
    let success = 0
    const failed = []
    const option = await this.excelRepository.findOne({
      where: { serviceName },
    })
    const excelData = await this.parseExcel(file, option.sheetName, option.skipRows)
    const importField = JSON.parse(option.importField)

    for (let i = 0; i < excelData.length; i++) {
      if (conditionCheckFunc && conditionCheckFunc(excelData[i])) {
        continue
      }
      const rowData: Record<any, any> = {}
      for (const excelDataKey in excelData[i]) {
        const filedObj = importField.find((item) => item.col === excelDataKey)
        if (filedObj && filedObj.filed) {
          rowData[filedObj.filed] = excelData[i][excelDataKey]
        }
      }
      rowData.tenantId = userInfo.tenantId
      rowData.createBy = userInfo.userName
      rowData.updateBy = userInfo.userName
      rowData.createDept = userInfo.deptId

      try {
        //在这里使用传入的方法并使用rowData
        await callback(rowData, userInfo)
        success++
      } catch (e) {
        console.log(e)
        failed.push({ row: i + 1, data: rowData, error: e.message })
      }
    }
    return {
      success,
      failed: failed.length,
      failedList: failed,
    }
  }

  /**
   * 处理列字段
   * @param index
   */
  columnIndexToColumnLetter(index: number): string {
    let columnLetter = ''
    while (index > 0) {
      const remainder = (index - 1) % 26
      columnLetter = String.fromCharCode(65 + remainder) + columnLetter
      index = Math.floor((index - 1) / 26)
    }
    return columnLetter
  }

  /**
   * 创建导入模版数据
   * @param createExcelDto
   */
  async create(createExcelDto: CreateExcelDto, userInfo: User) {
    const excel = new Excel()
    excel.fileName = createExcelDto.fileName
    excel.serviceName = createExcelDto.serviceName
    excel.skipRows = createExcelDto.skipRows
    excel.sheetName = createExcelDto.sheetName
    excel.fileType = createExcelDto.fileType
    excel.importTemplate = createExcelDto.importTemplate
    excel.importField = JSON.stringify(createExcelDto.importField)
    excel.importTemplateField = JSON.stringify(createExcelDto.importTemplateField)
    excel.tenantId = userInfo.tenantId
    excel.createDept = userInfo.deptId
    excel.updateBy = userInfo.userName
    excel.createBy = userInfo.userName
    try {
      return await this.excelRepository.save(excel)
    } catch (e) {
      console.log(e)
      throw new BadRequestException('模版创建失败')
    }
  }

  /**
   * 查询导入列表
   * @param current
   * @param pageSize
   * @param userInfo
   */
  async getAll(current: number, pageSize: number, userInfo: User) {
    const queryBuilder = this.excelRepository
      .createQueryBuilder('excel')
      .skip((current - 1) * pageSize)
      .take(pageSize)
    if (userInfo.tenantId !== ManagementGroup.ID) {
      queryBuilder.where('excel.tenantId = :tenantId', { tenantId: userInfo.tenantId })
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
   * 查询导入单条
   * @param id
   */
  async getOneById(id: string) {
    try {
      const res = await this.excelRepository.findOne({
        where: { id },
      })
      res.importTemplateField = JSON.parse(res.importTemplateField)
      res.importField = JSON.parse(res.importField)
      return res
    } catch (e) {
      throw new BadRequestException('查询单条失败')
    }
  }

  /**
   * 删除导入单条
   * @param id
   */
  async delete(id: string) {
    try {
      return await this.excelRepository.delete({ id })
    } catch (e) {
      throw new BadRequestException('删除失败')
    }
  }

  /**
   * 更新导入模版
   * @param updateExcelDto
   * @param userInfo
   */
  async update(updateExcelDto: UpdateExcelDto, userInfo: User) {
    try {
      return await this.excelRepository.update(
        { id: updateExcelDto.id },
        {
          fileName: updateExcelDto.fileName,
          serviceName: updateExcelDto.serviceName,
          skipRows: updateExcelDto.skipRows,
          sheetName: updateExcelDto.sheetName,
          fileType: updateExcelDto.fileType,
          importTemplate: updateExcelDto.importTemplate,
          importField: JSON.stringify(updateExcelDto.importField),
          importTemplateField: JSON.stringify(updateExcelDto.importTemplateField),
          updateBy: userInfo.userName,
        },
      )
    } catch (e) {
      console.log(e)
      throw new BadRequestException('更新失败')
    }
  }

  /**
   *  导出模版创建
   * @param createExportExcelDto
   * @param userInfo
   */
  async exportCreate(createExportExcelDto: CreateExportExcelDto, userInfo: User) {
    const exportExcel = new ExportExcel()
    exportExcel.templateName = createExportExcelDto.templateName
    exportExcel.exportType = createExportExcelDto.exportType
    exportExcel.exportService = createExportExcelDto.exportService
    exportExcel.exportFields = createExportExcelDto.exportFields
    exportExcel.sheetName = createExportExcelDto.sheetName
    exportExcel.createDept = userInfo.deptId
    exportExcel.createBy = userInfo.userName
    exportExcel.updateBy = userInfo.userName
    exportExcel.tenantId = userInfo.tenantId
    try {
      return await this.exportExcelRepository.save(exportExcel)
    } catch (e) {
      console.log(e)
      throw new BadRequestException('创建导出模版失败')
    }
  }

  /**
   * 导出Excel
   */
  async exportExcel(options: ExportExcelParamsType, userInfo: User) {
    const { sheetName, style, headerColumns, tableData } = options
    // 创建工作簿
    const workbook = new Exceljs.Workbook()
    workbook.creator = userInfo.nickName
    workbook.created = new Date()
    console.log(sheetName)
    // 添加工作表
    const worksheet = workbook.addWorksheet(sheetName)

    if (headerColumns.length > 0) {
      // 设置列头
      const columnsData = headerColumns.map((column) => {
        const width = column.width
        return {
          header: column.excelFiled,
          key: column.filed,
          width: isNaN(width) ? 20 : width / 10,
        }
      })
      worksheet.columns = columnsData
      // 设置表头样式
      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell) => {
        cell.style = style as Partial<Exceljs.Style>
      })
    }
    // 设置行数据
    if (tableData.length > 0) {
      // 将传入的数据格式化为exceljs可使用的数据格式
      const data = []
      tableData.forEach((table) => {
        const obj = {}
        headerColumns.forEach((header) => {
          obj[header.filed] = table[header.filed]
        })
        data.push(obj)
      })
      console.log(data)
      // 添加行
      if (data) worksheet.addRows(data)

      // 获取每列数据，依次对齐
      worksheet.columns.forEach((column) => {
        column.alignment = style.alignment as Partial<Exceljs.Alignment>
      })
      // 设置每行的边框
      const dataLength = data.length as number
      const tabeRows = worksheet.getRows(2, dataLength + 1)
      tabeRows.forEach((row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = style.border as Partial<Exceljs.Borders>
        })
      })
    }
    return await workbook.xlsx.writeFile('output.xlsx')
  }
}
