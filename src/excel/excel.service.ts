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
import { UpdateExportExcelDto } from './dto/update-export-excel.dto'

export interface ExportExcelParamsType {
  style: Record<string, any> //excel表的样式配置
  tableData: any[] //表的数据内容
  headerColumns: { width: number; excelFiled: string; filed: string }[] //表头配置
  sheetName: string //工作表名
}

export interface ExportExcelType {
  serviceName: string
  tableData: any[]
  extraStyle?: {
    col: number
    row: number
    alignment: Partial<Exceljs.Alignment>
  }
}

export interface ExcelImportType {
  file: Express.Multer.File
  userInfo: User
  serviceName?: string
  callback: (...args: any[]) => Promise<any>
  conditionCheckFunc?: (data: object, p?: any[]) => boolean
  customOptions?: { sheetName: string; skipRows: number; importField: string }
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
      const rowData = { rowNumber: rowNumber }
      row.eachCell({ includeEmpty: true }, (cell: any, col) => {
        const key = this.columnIndexToColumnLetter(col)
        switch (cell.type) {
          case 8:
            const value = []
            cell.value.richText.forEach((item) => {
              value.push(item.text)
            })
            rowData[key] = value.join('')
            break
          case 6:
            rowData[key] = cell.value.result
            break
          default:
            rowData[key] = cell.value
            break
        }
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
   * @param callback 创建数据的方法
   * @param conditionCheckFunc 条件校验方法
   */
  async excelImport(params: ExcelImportType) {
    const { file, userInfo, serviceName, callback, conditionCheckFunc, customOptions } = params
    let success = 0
    const failed = []
    let option: { sheetName: string; skipRows: number; importField: string } = {
      sheetName: 'Sheet1',
      skipRows: 1,
      importField: '',
    }
    if (customOptions) {
      option.skipRows = customOptions.skipRows
      option.importField = customOptions.importField
      option.sheetName = customOptions.sheetName
    } else {
      option = await this.excelRepository.findOne({
        where: { serviceName, tenantId: userInfo.tenantId },
      })
    }
    const excelData = await this.parseExcel(file, option.sheetName, option.skipRows)
    const importField = JSON.parse(option.importField)
    for (let i = 0; i < excelData.length; i++) {
      if (conditionCheckFunc && conditionCheckFunc(excelData[i], importField)) {
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
        failed.push({
          row: excelData[i]['rowNumber'],
          data: rowData,
          error: e.message,
        })
      }
    }
    return {
      success,
      fileName: file.originalname,
      failed: failed.length,
      failedList: failed,
    }
  }

  /**
   * 处理列字段 index转ABC
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
      throw new BadRequestException('创建导出模版失败')
    }
  }

  /**
   * 导出Excel
   */
  async exportExcel(options: ExportExcelType, userInfo: User) {
    const { serviceName, tableData, extraStyle } = options
    const excelHeader = await this.exportExcelRepository.findOne({
      where: { exportService: serviceName, tenantId: userInfo.tenantId },
    })
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
    }
    // 创建工作簿
    const workbook = new Exceljs.Workbook()
    workbook.creator = userInfo.nickName
    workbook.created = new Date()
    // 添加工作表
    const worksheet = workbook.addWorksheet(excelHeader.sheetName)
    const headerColumns = JSON.parse(excelHeader.exportFields)
    if (headerColumns.length > 0) {
      // 设置列头
      const columnsData = headerColumns.map((column) => {
        const width = column.width
        return {
          header: column.excelFiled,
          key: column.filed,
          width: width,
        }
      })
      worksheet.columns = columnsData
      // 设置表头样式
      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell) => {
        cell.style = style as Partial<Exceljs.Style>
      })
    }
    console.log(tableData)
    //设置行数据
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
      // 添加行
      if (data) worksheet.addRows(data)
      // 获取每列数据，依次对齐
      worksheet.columns.forEach((column) => {
        column.alignment = style.alignment as Partial<Exceljs.Alignment>
      })
      // 设置每行的边框
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = style.border as Partial<Exceljs.Borders>
          if (extraStyle && colNumber === extraStyle.col && rowNumber >= extraStyle.row) {
            cell.alignment = extraStyle.alignment
          }
        })
      })
    }
    return await workbook.xlsx.writeBuffer()
  }

  /**
   * 导出模版列表
   * @param current
   * @param pageSize
   * @param userInfo
   */
  async getExportList(current: number, pageSize: number, userInfo: User) {
    const queryBuilder = this.exportExcelRepository
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
      throw new BadRequestException('获取模版列表失败')
    }
  }

  /**
   * 导出模版详情
   * @param id
   */
  async getExportOneById(id: string) {
    try {
      return await this.exportExcelRepository.findOne({
        where: { id },
      })
    } catch (e) {
      throw new BadRequestException('获取模版详情失败')
    }
  }

  /**
   * 导出模版更新
   * @param updateExportExcelDto
   * @param userInfo
   */
  async updateExport(updateExportExcelDto: UpdateExportExcelDto, userInfo: User) {
    try {
      return await this.exportExcelRepository.update(
        { id: updateExportExcelDto.id },
        {
          templateName: updateExportExcelDto.templateName,
          exportType: updateExportExcelDto.exportType,
          exportService: updateExportExcelDto.exportService,
          exportFields: updateExportExcelDto.exportFields,
          sheetName: updateExportExcelDto.sheetName,
          updateBy: userInfo.userName,
        },
      )
    } catch (e) {
      throw new BadRequestException('更新模版失败')
    }
  }

  /**
   * 导入模板下载
   * @param userInfo
   */
  async exportTemplate(serviceName: string, removeField: string[], userInfo: User) {
    try {
      const res = await this.excelRepository.findOne({
        where: {
          serviceName: serviceName,
          tenantId: userInfo.tenantId,
        },
        select: ['importField', 'importTemplateField', 'sheetName'],
      })
      let importField: any[] = JSON.parse(res.importField)
      if (removeField && removeField.length > 0) {
        importField = JSON.parse(res.importField).filter((item) => !removeField.includes(item.filed))
      }
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
        headerColumns: importField,
        sheetName: res.sheetName,
        tableData: [],
      }
      return options
    } catch (e) {}
  }
}
