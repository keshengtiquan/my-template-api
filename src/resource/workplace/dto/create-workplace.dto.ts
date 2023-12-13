import { IsNotEmpty } from 'class-validator'
import { WorkPlaceType } from '../entities/workplace.entity'
import { Type } from 'class-transformer'

export class CreateWorkplaceDto {
  @IsNotEmpty({ message: '工点编码不能为空' })
  workPlaceCode: string
  @IsNotEmpty({ message: '工点名称不能为空' })
  workPlaceName: string
  @IsNotEmpty({ message: '工点类型不能为空' })
  workPlaceType: WorkPlaceType
  @IsNotEmpty({ message: '排序不能为空' })
  @Type(() => Number)
  sortNumber: number
}
