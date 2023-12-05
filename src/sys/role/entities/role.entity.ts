import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { User } from '../../user/entities/user.entity'
import { Menu } from '../../menu/entities/menu.entity'

@Entity('sys_role')
export class Role {
  @PrimaryColumn({ comment: '主键', name: 'id', type: 'bigint' })
  id: string

  @Column({
    type: 'varchar',
    default: '000000',
    name: 'tenant_id',
    comment: '租户编号',
  })
  tenantId: string

  @Column({
    type: 'varchar',
    length: 30,
    name: 'role_name',
    comment: '角色中文名称',
  })
  roleName: string

  @Column({
    type: 'varchar',
    length: 100,
    name: 'role_key',
    comment: '角色英文名称',
  })
  roleKey: string

  @Column({ type: 'int', name: 'role_sort', comment: '显示顺序' })
  roleSort: number

  @Column({
    type: 'char',
    default: '1',
    length: 1,
    name: 'data_scope',
    comment: '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）',
  })
  dataScope: string

  @Column({
    type: 'char',
    default: '0',
    length: 1,
    comment: '角色状态（0正常 1停用）',
  })
  status: string

  @Column({ type: 'varchar', length: 500, default: null, comment: '备注' })
  remark: string

  @Column({ type: 'varchar', nullable: true, name: 'create_dept' })
  createDept: string

  @JoinTable({
    name: 'sys_user_role',
    joinColumns: [{ name: 'role_id' }],
    inverseJoinColumns: [{ name: 'user_id' }],
  })
  @ManyToMany(() => User, (user) => user.roles)
  users: User[]

  @JoinTable({
    name: 'sys_menu_role',
    joinColumns: [{ name: 'role_id' }],
    inverseJoinColumns: [{ name: 'menu_id' }],
  })
  @ManyToMany(() => Menu, (menu) => menu.roles)
  menus: Menu[]

  @Column({ nullable: true, length: 255, name: 'create_by' })
  createBy: string

  @Column({ nullable: true, length: 255, name: 'update_by' })
  updateBy: string

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date
}
