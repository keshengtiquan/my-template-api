import { IsNotEmpty } from 'class-validator'

export class CreateGanttDto {
  @IsNotEmpty()
  text: string
  @IsNotEmpty()
  startDate: string
  @IsNotEmpty()
  duration: number
  @IsNotEmpty()
  endDate: string
  @IsNotEmpty()
  parent: string
}
