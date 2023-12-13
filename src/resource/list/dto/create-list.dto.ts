import { IsNotEmpty } from 'class-validator'

export class CreateListDto {
  @IsNotEmpty()
  serialNumber: number
  @IsNotEmpty()
  listCode: string
  listName: string
  listCharacteristic: string
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
}
