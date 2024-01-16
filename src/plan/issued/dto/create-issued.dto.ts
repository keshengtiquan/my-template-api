import { IsNotEmpty } from 'class-validator'

export class CreateIssuedDto {
  @IsNotEmpty()
  currentDate: Date
  @IsNotEmpty()
  planType: string
}
