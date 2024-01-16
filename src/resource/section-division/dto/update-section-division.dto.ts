import { IsNotEmpty, IsOptional } from 'class-validator'

export class UpdateSectionDivisionDto {
  @IsNotEmpty({ message: 'id不能为空' })
  id: string
  @IsOptional()
  sector: string
  @IsOptional()
  principal: string
  @IsNotEmpty({ message: 'listIds不能为空' })
  listIds: string[]
  @IsNotEmpty({ message: 'workPlaceIds不能为空' })
  workPlaceIds: string[]
}
