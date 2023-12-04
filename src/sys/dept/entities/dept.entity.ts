import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
@Entity('sys_dept')
export class Dept {
  @PrimaryColumn({ comment: '主键', name: 'id', type: 'bigint' })
  id: string

  @Column({
    type: 'varchar',
    default: '000000',
    name: 'tenant_id',
    comment: '租户编号',
  })
  tenantId: string

  @Column({ default: 0, name: 'parent_id', type: 'bigint' })
  parentId: string

  @Column({ name: 'dept_name', type: 'varchar', length: 30 })
  deptName: string

  @Column({ type: 'varchar', nullable: true, length: 11 })
  phone: string

  @Column({ type: 'varchar', nullable: true, length: 50 })
  email: string

  @Column({ default: '0', length: 1 })
  status: string

  @Column({ type: 'varchar', nullable: true })
  leader: string

  @Column({ nullable: true, length: 255, name: 'create_by' })
  createBy: string

  @Column({ nullable: true, length: 255, name: 'update_by' })
  updateBy: string

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date
}
