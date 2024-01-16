import { IsArray, IsNotEmpty } from 'class-validator'

export class AddListDto {
  @IsNotEmpty({ message: '分部分项名称不能为空' })
  @IsArray({ message: '分部分项名称必须是数组' })
  parentNames: string[]

  @IsNotEmpty({ message: '清单编码不能为空' })
  @IsArray({ message: '清单编码必须是数组' })
  listIds: string[]
  @IsNotEmpty({ message: '分部分项不能为空' })
  divisionId: string
}
