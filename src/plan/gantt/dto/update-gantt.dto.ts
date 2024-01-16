import { PartialType } from '@nestjs/mapped-types'
import { CreateGanttDto } from './create-gantt.dto'

export class UpdateGanttDto extends PartialType(CreateGanttDto) {
  id: string
}
