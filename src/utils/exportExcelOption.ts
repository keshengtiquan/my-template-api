import { ExportExcelParamsType } from '../excel/excel.service'

export const excelOption = (listData: any[], excelHeader: any) => {
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
  return options // 返回配置项
}
