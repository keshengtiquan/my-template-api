import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('sc_gantt')
export class Gantt {
  @PrimaryColumn({ comment: '主键', name: 'id', type: 'bigint' })
  id: string

  @Column({
    type: 'varchar',
    default: '000000',
    name: 'tenant_id',
    comment: '租户编号',
  })
  tenantId: string

  @Column({ type: 'varchar', nullable: true, name: 'create_dept' })
  createDept: string

  //字段开始
  @Column({ type: 'varchar', name: 'text' })
  text: string

  @Column({ type: 'varchar', name: 'start_date' })
  startDate: string

  @Column({ type: 'int', name: 'duration' })
  duration: number

  @Column({ type: 'varchar', name: 'end_date' })
  endDate: string

  @Column({ type: 'float', name: 'progress', default: 0 })
  progress: number

  @Column({ type: 'varchar', name: 'parent' })
  parent: string
  //字段结束

  @Column({ nullable: true, length: 255, name: 'create_by' })
  createBy: string

  @Column({ nullable: true, length: 255, name: 'update_by' })
  updateBy: string

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date
}
