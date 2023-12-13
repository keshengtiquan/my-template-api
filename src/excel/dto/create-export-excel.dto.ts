import {IsNotEmpty, IsOptional} from 'class-validator'

export class CreateExportExcelDto {
  @IsNotEmpty({ message: '模版名称不能为空' })
  templateName: string
  @IsNotEmpty({ message: '文件类型不能为空' })
  exportType: string
  @IsNotEmpty({ message: '解析标签不能为空' })
  exportService: string
  @IsNotEmpty()
  exportFields: string
  @IsOptional()
  sheetName: string
}
