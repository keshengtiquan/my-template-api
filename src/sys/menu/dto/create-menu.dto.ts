import { IsNotEmpty, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateMenuDto {
  @IsNotEmpty({ message: '菜单名称不能为空' })
  title: string
  @IsOptional()
  icon: string
  @IsNotEmpty({ message: '路由地址不能为空' })
  path: string
  @IsOptional()
  component: string
  @IsOptional()
  name: string
  @IsOptional()
  hideInMenu: boolean
  @IsOptional()
  parentId: string
  @IsOptional()
  isIframe: boolean
  @IsOptional()
  url: string
  @IsOptional()
  affix: boolean
  @IsOptional()
  hideInBreadcrumb: boolean
  @IsOptional()
  hideChildrenInMenu: boolean
  @IsOptional()
  keepAlive: boolean
  @IsOptional()
  target: string
  @IsOptional()
  redirect: string
  @IsNotEmpty({ message: '排序不能为空' })
  @Type(() => Number)
  menuSort: number
  @IsOptional()
  permission: string
  @IsOptional()
  status: string
  @IsOptional()
  createBy: string
  @IsOptional()
  updateBy: string
  @IsNotEmpty({ message: '菜单类型不能为空' })
  menuType: string
}
