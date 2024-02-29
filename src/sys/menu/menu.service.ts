import { BadRequestException, Injectable } from '@nestjs/common'
import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Menu } from './entities/menu.entity'
import { Repository } from 'typeorm'
import { ManagementGroup, UserType } from '../../enmus'
import { User } from '../user/entities/user.entity'
import { handleTree } from '../../utils'
import { Tenant } from '../tenant/entities/tenant.entity'

@Injectable()
export class MenuService {
  @InjectRepository(Menu)
  private menuRepository: Repository<Menu>
  @InjectRepository(Tenant)
  private tenantRepository: Repository<Tenant>

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
    menu.createBy = userInfo.userName
    menu.updateBy = userInfo.userName
    try {
      const res = await this.menuRepository.save(menu)
      const menus = await this.menuRepository.find()
      res.activeMenu = this.getParentIds(createMenuDto.path, 'path', menus)
      return await this.menuRepository.save(res)
    } catch (e) {
      throw new BadRequestException('创建菜单失败')
    }
  }

  /**
   * 查询侧边菜单数据
   */
  async getMenu(conditions: string[], status: string[], userInfo: User) {
    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .where('menu.menuType in  (:...type)', { type: conditions })
      .andWhere('menu.status in (:...status)', { status })
      .orderBy('menu.menuSort', 'ASC')
    if (userInfo.tenantId !== ManagementGroup.ID) {
      const tenant = await this.tenantRepository.findOne({
        where: { id: userInfo.tenantId },
        relations: { packageId: true },
      })
      const menuIds = tenant.packageId.menuIds.split(',')
      queryBuilder.andWhere('menu.id in (:...menuIds)', { menuIds })
      if (userInfo.userType !== UserType.SYSUSER) {
        const roleIds = userInfo.roles.map((item) => item.id)
        queryBuilder.innerJoin('sys_menu_role', 'rm', 'menu.id = rm.menu_id')
        queryBuilder.andWhere('rm.role_id in (:...roleIds)', { roleIds })
      }
    }
    try {
      const res = await queryBuilder.getMany()
      return handleTree(res)
    } catch (e) {
      throw new BadRequestException('查询菜单失败')
    }
  }

  /**
   * 更新菜单
   * @param updateMenuDto
   */
  async update(updateMenuDto: UpdateMenuDto, userInfo: User) {
    const menus = await this.menuRepository.find()
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
    menu.updateBy = userInfo.userName
    menu.activeMenu = this.getParentIds(updateMenuDto.path, 'path', menus)
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

  getParentIds(parentPath: string, uniqueId: string, tree: any[]): string {
    const deptMap: { [key: string]: string } = {}
    tree.forEach((item) => {
      deptMap[item[uniqueId]] = item.path
    })

    const parentPaths: string[] = []
    let currentPath = parentPath

    while (currentPath !== '/' && deptMap[currentPath]) {
      parentPaths.push(deptMap[currentPath])
      currentPath = currentPath.substring(0, currentPath.lastIndexOf('/'))
    }

    return JSON.stringify(parentPaths.reverse())
  }
}
