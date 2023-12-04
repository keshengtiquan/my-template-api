import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenant/entities/tenant.entity'

@Entity('sys_tenant_package')
export class Package {
  @PrimaryColumn({ comment: '主键', name: 'id', type: 'bigint' })
  id: string

  @Column({ name: 'package_name', length: 20 })
  packageName: string

  @Column({ name: 'remark', length: 1000, nullable: true })
  remark: string

  @Column({ name: 'menu_ids', length: 3000 })
  menuIds: string

  @Column({ type: 'char', default: '0', comment: '帐号状态（0正常 1停用）' })
  status: string

  @Column({ nullable: true, length: 255, name: 'create_by' })
  createBy: string

  @Column({ nullable: true, length: 255, name: 'update_by' })
  updateBy: string

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date

  @OneToMany(() => Tenant, (tenant) => tenant.packageId, {
    cascade: true,
  })
  tenants: Tenant[]
}
