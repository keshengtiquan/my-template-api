import { Injectable } from '@nestjs/common'
import * as Excel from 'exceljs'
@Injectable()
export class ExcelService {
  /**
   * 解析Excel文件 单页签
   * @param file 文件
   * @param sheetName 要解析的页签名称
   * @param skipRows 从第几行开始
   */
  async parseExcel(file: any, sheetName: string, skipRows: number) {
    const workbook = new Excel.Workbook()
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

  columnIndexToColumnLetter(index: number): string {
    let columnLetter = ''
    while (index > 0) {
      const remainder = (index - 1) % 26
      columnLetter = String.fromCharCode(65 + remainder) + columnLetter
      index = Math.floor((index - 1) / 26)
    }
    return columnLetter
  }
}
