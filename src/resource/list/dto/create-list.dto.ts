import { IsNotEmpty, MaxLength } from 'class-validator'

export class CreateListDto {
  @IsNotEmpty()
  serialNumber: number
  @IsNotEmpty()
  listCode: string
  listName: string
  listCharacteristic: string
  @MaxLength(10, { message: '长度不能超过10' })
  unit: string
  quantities: number
  @IsNotEmpty()
  unitPrice: number
  @IsNotEmpty()
  combinedPrice: number
  tenantId: string
  createBy: string
  updateBy: string
  createDept: string
  currentSection: string
}
