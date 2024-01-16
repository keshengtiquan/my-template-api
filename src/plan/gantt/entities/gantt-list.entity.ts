import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('sc_gantt_list')
export class GanttList {
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
  @Column({ type: 'varchar', length: 64, name: 'gantt_id' })
  ganttId: string

  @Column({ type: 'varchar', length: 64, name: 'list_id' })
  listId: string

  @Column({ type: 'varchar', default: '', name: 'work_place_ids', length: 1000 })
  workPlaceIds: string
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
