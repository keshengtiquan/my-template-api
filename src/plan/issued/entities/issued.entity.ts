import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('sc_issued')
export class Issued {
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
  @Column({ type: 'varchar', length: 64, name: 'plan_type' })
  planType: string

  @Column({ type: 'varchar', length: 64, name: 'plan_name' })
  planName: string

  @Column({ type: 'varchar', length: 64, name: 'list_id' })
  listId: string

  @Column({ type: 'varchar', default: '0', length: 64, name: 'work_area_id', comment: '工区' })
  workAreaId: string

  @Column({ type: 'double', default: 0, name: 'work_area_quantities', comment: '工区工程量' })
  workAreaQuantities: number

  @Column({ type: 'varchar', name: 'start_date' })
  startDate: string

  @Column({ type: 'varchar', name: 'end_date' })
  endDate: string

  @Column({ type: 'int', nullable: true, name: 'year' })
  year: number

  @Column({ type: 'int', nullable: true, name: 'quarter' })
  quarter: number

  @Column({ type: 'int', nullable: true, name: 'month' })
  month: number

  @Column({ type: 'int', nullable: true, name: 'week' })
  week: number
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
