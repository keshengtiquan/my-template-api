import { Controller, Get, Post, Body, HttpCode, Query, UseInterceptors } from '@nestjs/common'
import { MenuService } from './menu.service'
import { CreateMenuDto } from './dto/create-menu.dto'
import { Auth } from '../auth/decorators/auth.decorators'
import { UserInfo } from '../../decorators/user.dectorator'
import { User } from '../user/entities/user.entity'
import { UpdateMenuDto } from './dto/update-menu.dto'
import { UtcToLocalInterceptor } from '../../interceptor/utc2Local.interceptor'
import { Result } from '../../common/result'

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * 创建菜单
   * @param createMenuDto
   * @param userInfo
   */
  @Post('/create')
  @Auth()
  async create(@Body() createMenuDto: CreateMenuDto, @UserInfo() userInfo: User) {
    return Result.success(await this.menuService.create(createMenuDto, userInfo), '创建成功')
  }

  /**
   * 查询侧边菜单数据
   */
  @Get('/getMenu')
  @Auth()
  @HttpCode(200)
  async getMenu(@UserInfo() userInfo: User) {
    return Result.success(await this.menuService.getMenu(['C', 'M'], ['0'], userInfo), '查询成功')
  }

  /**
   * 查询菜单列表
   */
  @Get('/getMenuList')
  @UseInterceptors(UtcToLocalInterceptor)
  @Auth()
  async getMenuList(@UserInfo() userInfo: User) {
    return Result.success(await this.menuService.getMenu(['C', 'M', 'F'], ['0', '1'], userInfo), '查询成功')
  }

  /**
   * 更新菜单
   * @param updateMenuDto
   */
  @Post('/update')
  @Auth()
  async updateMenu(@Body() updateMenuDto: UpdateMenuDto, @UserInfo() userInfo: User) {
    return Result.success(await this.menuService.update(updateMenuDto, userInfo), '更新成功')
  }

  /**
   * 根据ID查询菜单单条
   * @param id 菜单ID
   */
  @Get('/getOne')
  @Auth()
  async getMenuById(@Query('id') id: string) {
    return Result.success(await this.menuService.getMenuById(id))
  }

  /**
   * 禁用菜单
   * @param id 菜单ID
   * @param ststus 菜单状态 0 启用， 1禁用
   */
  @Post('/forbidden')
  @Auth()
  async forbiddenMenuById(@Body('id') id: string, @Body('status') status: string) {
    return Result.success(await this.menuService.forbidden(id, status), status === '1' ? '禁用成功' : '启用成功')
  }
  /**
   * 删除菜单
   * @param id
   */
  @Post('/delete')
  @Auth()
  async deleteMenuById(@Body('id') id: string) {
    return Result.success(await this.menuService.delete(id), '删除成功')
  }
}
