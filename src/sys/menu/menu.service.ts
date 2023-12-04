import { BadRequestException, Injectable } from '@nestjs/common'
import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Menu } from './entities/menu.entity'
import { Repository } from 'typeorm'
import { ManagementGroup } from '../../enmus'
import { User } from '../user/entities/user.entity'
import { handleTree } from '../../utils'

@Injectable()
export class MenuService {
  @InjectRepository(Menu)
  private menuRepository: Repository<Menu>

  async create(createMenuDto: CreateMenuDto, userInfo: User) {
    const menu = new Menu()
    menu.title = createMenuDto.title
    menu.icon = createMenuDto.icon
    menu.path = createMenuDto.path
    menu.component = createMenuDto.component
    menu.name = createMenuDto.name
    menu.hideInMenu = createMenuDto.hideInMenu
    menu.parentId = createMenuDto.parentId
    menu.isIframe = createMenuDto.isIframe
    menu.url = createMenuDto.url
    menu.affix = createMenuDto.affix
    menu.hideInBreadcrumb = createMenuDto.hideInBreadcrumb
    menu.hideChildrenInMenu = createMenuDto.hideChildrenInMenu
    menu.keepAlive = createMenuDto.keepAlive
    menu.target = createMenuDto.target
    menu.redirect = createMenuDto.redirect
    menu.menuSort = createMenuDto.menuSort
    menu.permission = createMenuDto.permission
    menu.status = createMenuDto.status
    menu.menuType = createMenuDto.menuType
    menu.createBy = userInfo.nickName
    menu.updateBy = userInfo.nickName
    try {
      return await this.menuRepository.save(menu)
    } catch (e) {
      console.log(e)
      throw new BadRequestException('创建菜单失败')
    }
  }

  /**
   * 查询侧边菜单数据
   */
  async getMenu(conditions: string[], status: string[], userInfo: User) {
    //TODO 根据当前用户的租户角色查询
    try {
      const res = await this.menuRepository
        .createQueryBuilder('menu')
        .where('menu.menuType in  (:...type)', { type: conditions })
        .andWhere('menu.status in (:...status)', { status })
        .orderBy('menu.menuSort', 'ASC')
        .getMany()
      return handleTree(res)
    } catch (e) {
      console.log(e)
      throw new BadRequestException('查询菜单失败')
    }
  }
  /**
   * 更新菜单
   * @param updateMenuDto
   */
  async update(updateMenuDto: UpdateMenuDto, userInfo: User) {
    const menu = new Menu()
    menu.id = updateMenuDto.id
    menu.title = updateMenuDto.title
    menu.icon = updateMenuDto.icon
    menu.path = updateMenuDto.path
    menu.component = updateMenuDto.component
    menu.name = updateMenuDto.name
    menu.hideInMenu = updateMenuDto.hideInMenu
    menu.parentId = updateMenuDto.parentId
    menu.isIframe = updateMenuDto.isIframe
    menu.url = updateMenuDto.url
    menu.affix = updateMenuDto.affix
    menu.hideInBreadcrumb = updateMenuDto.hideInBreadcrumb
    menu.hideChildrenInMenu = updateMenuDto.hideChildrenInMenu
    menu.keepAlive = updateMenuDto.keepAlive
    menu.target = updateMenuDto.target
    menu.redirect = updateMenuDto.redirect
    menu.menuSort = updateMenuDto.menuSort
    menu.permission = updateMenuDto.permission
    menu.status = updateMenuDto.status
    menu.menuType = updateMenuDto.menuType
    menu.updateBy = userInfo.nickName
    try {
      return this.menuRepository.save(menu)
    } catch (e) {
      throw new BadRequestException('更新菜单失败')
    }
  }

  /**
   * 根据ID查询菜单单条
   * @param id 菜单ID
   */
  async getMenuById(id: string) {
    try {
      return await this.menuRepository.findOne({
        where: { id },
      })
    } catch (e) {
      throw new BadRequestException(`查询菜单${id}失败`)
    }
  }

  /**
   * 禁用菜单
   * @param id 菜单ID
   * @param ststus 菜单状态 0 启用， 1禁用
   */
  async forbidden(id: string, status: string) {
    try {
      return this.menuRepository.update({ id }, { status })
    } catch (e) {
      throw new BadRequestException('禁用菜单失败')
    }
  }

  /**
   * 删除菜单
   * @param id
   */
  async delete(id: string) {
    try {
      return this.menuRepository.delete(id)
    } catch (e) {
      throw new BadRequestException('删除菜单失败')
    }
  }
}
