import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator'

export class CreateRoleDto {
  @IsNotEmpty({ message: '角色名称不能为空' })
  roleName: string

  @IsNotEmpty({ message: '角色标识不能为空' })
  roleKey: string

  @IsNotEmpty({ message: '角色排序不能为空' })
  @IsInt({ message: '角色排序必须为数字' })
  @Type(() => Number)
  roleSort: number

  @IsOptional()
  remark: string

  @IsOptional()
  menuIds: Array<number>
}
