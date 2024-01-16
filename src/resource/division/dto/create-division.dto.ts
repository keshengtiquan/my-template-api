import { IsNotEmpty, IsOptional } from 'class-validator'

export class CreateDivisionDto {
  @IsOptional()
  parentId: string
  @IsNotEmpty({ message: '分部分项名称不能为空' })
  divisionName: string
  @IsNotEmpty({ message: '分部分项类型不能为空' })
  divisionType: string
}
