import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { Role } from '../../role/entities/role.entity'

@Entity('sys_menu')
export class Menu {
  @PrimaryColumn({ comment: '主键', name: 'id', type: 'bigint' })
  id: string

  @Column({ length: 50 })
  title: string

  @Column({ nullable: true, length: 100 })
  icon: string

  @Column({ length: 125 })
  path: string

  @Column({ nullable: true, length: 125 })
  component: string

  @Column({ nullable: true, length: 100 })
  name: string

  @Column({ default: false, name: 'hide_in_menu' })
  hideInMenu: boolean

  @Column({ default: 0, name: 'parent_id', type: 'bigint' })
  parentId: string

  @Column({ default: false, name: 'is_iframe' })
  isIframe: boolean

  @Column({ nullable: true, length: 500 })
  url: string

  @Column({ default: false })
  affix: boolean

  @Column({ default: false, name: 'hide_in_breadcrumb' })
  hideInBreadcrumb: boolean

  @Column({ default: false, name: 'hide_children_in_menu' })
  hideChildrenInMenu: boolean

  @Column({ default: false, name: 'keep_alive' })
  keepAlive: boolean

  @Column({ default: '_blank', length: 20 })
  target: string

  @Column({ nullable: true, length: 125 })
  redirect: string

  @Column({ name: 'menu_sort' })
  menuSort: number

  @Column({ nullable: true, length: 100 })
  permission: string

  @Column({ default: '0', length: 1 })
  status: string

  @Column({ nullable: true, length: 1, name: 'menu_type' })
  menuType: string

  @Column({ nullable: true, type: 'varchar', length: 255, name: 'active_menu' })
  activeMenu: string

  @JoinTable({
    name: 'sys_menu_role',
    joinColumns: [{ name: 'menu_id' }],
    inverseJoinColumns: [{ name: 'role_id' }],
  })
  @ManyToMany(() => Role, (role) => role.menus)
  roles: Role[]

  @Column({ nullable: true, length: 255, name: 'create_by' })
  createBy: string

  @Column({ nullable: true, length: 255, name: 'update_by' })
  updateBy: string

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date
}
