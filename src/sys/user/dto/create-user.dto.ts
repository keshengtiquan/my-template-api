import { IsMobilePhone, IsNotEmpty, IsOptional } from 'class-validator'

export class CreateUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  userName: string

  @IsNotEmpty({ message: '密码不能为空' })
  password: string

  @IsOptional()
  nickName: string

  @IsOptional()
  email: string

  @IsMobilePhone('zh-CN', {}, { message: '手机号码格式错误' })
  @IsOptional()
  phoneNumber: string
  @IsOptional()
  gender: string
  @IsOptional()
  avatar: string
  @IsOptional()
  status: string
  @IsOptional()
  createDept: string
  @IsOptional()
  remark: string
  @IsOptional()
  tenantId: string
  @IsOptional()
  deptId: string
  @IsOptional()
  roleIds: string[]
}
