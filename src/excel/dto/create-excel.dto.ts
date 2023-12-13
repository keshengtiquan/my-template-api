import { IsNotEmpty } from 'class-validator'

export class CreateExcelDto {
  @IsNotEmpty({ message: '模版名称不能为空' })
  fileName: string
  @IsNotEmpty({ message: '文件类型不能为空' })
  fileType: string
  @IsNotEmpty({ message: '解析标签不能为空' })
  sheetName: string
  @IsNotEmpty({ message: '' })
  skipRows: number
  @IsNotEmpty({ message: '' })
  serviceName: string
  @IsNotEmpty({ message: '' })
  importTemplate: string
  @IsNotEmpty({ message: '' })
  importField: string
  @IsNotEmpty({ message: '' })
  importTemplateField: string
}
