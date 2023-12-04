import { IsNotEmpty, IsOptional } from 'class-validator'

export class CreatePackageDto {
  @IsNotEmpty({ message: '套餐名称不能为空' })
  packageName: string

  @IsOptional()
  remark: string

  @IsNotEmpty({ message: '关联的菜单不能为空' })
  menuIds: string
}
