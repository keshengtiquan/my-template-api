import { IsNotEmpty, IsOptional } from 'class-validator'

export class CreateTenantDto {
  @IsNotEmpty({ message: '联系人不能为空' })
  contactUserName: string
  @IsNotEmpty({ message: '联系电话不能为空' })
  contactPhone: string
  @IsNotEmpty({ message: '公司名称不能为空' })
  companyName: string
  @IsOptional()
  address: string
  @IsOptional()
  status: string
  @IsOptional()
  packageId: string

  @IsNotEmpty({ message: '用户名不能为空' })
  userName: string

  @IsNotEmpty({ message: '密码不能为空' })
  password: string
}
