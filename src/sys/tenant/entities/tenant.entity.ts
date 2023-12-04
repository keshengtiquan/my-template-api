import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { Package } from '../../package/entities/package.entity'

@Entity('sys_tenant')
export class Tenant {
  @PrimaryColumn({ comment: '主键', name: 'id', type: 'bigint' })
  id: string

  @Column({ name: 'contact_user_name', length: 20 })
  contactUserName: string

  @Column({ name: 'contact_phone', length: 20 })
  contactPhone: string

  @Column({ name: 'company_name', length: 50 })
  companyName: string

  @Column({ name: 'address', length: 125, nullable: true })
  address: string

  @Column({ default: '0', length: 1 })
  status: string

  @JoinColumn({
    name: 'package_id',
  })
  @ManyToOne(() => Package)
  packageId: Package

  @Column({ nullable: true, length: 255, name: 'create_by' })
  createBy: string

  @Column({ nullable: true, length: 255, name: 'update_by' })
  updateBy: string

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date
}
