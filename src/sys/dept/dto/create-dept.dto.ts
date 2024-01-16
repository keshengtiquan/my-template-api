import { IsNotEmpty, IsOptional } from 'class-validator'

export class CreateDeptDto {
  @IsOptional()
  tenantId: number
  @IsOptional()
  parentId: string
  @IsNotEmpty({ message: 'deptName不能为空' })
  deptName: string
  @IsOptional()
  leader: string
  phone: string
  @IsOptional()
  email: string
  @IsOptional()
  status: string
  @IsOptional()
  deptType: string
  @IsOptional()
  remarks: string
}
