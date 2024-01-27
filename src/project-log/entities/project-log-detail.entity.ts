import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('sc_project_log_detail')
export class ProjectLogDetail {
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
  @Column({ type: 'varchar', nullable: true, name: 'log_id' })
  logId: string

  @Column({ type: 'varchar', nullable: true, name: 'work_area_id', comment: '工区作业队ID' })
  workAreaId: string

  @Column({ type: 'varchar', nullable: true, name: 'list_id', comment: '清单ID' })
  listId: string

  @Column({ type: 'varchar', nullable: true, name: 'work_place_id', comment: '工作地点ID' })
  workPlaceId: string

  @Column({ type: 'double', nullable: true, name: 'completion_quantity', comment: '完成数量' })
  completionQuantity: number

  @Column({ type: 'double', default: 0, name: 'left_quantities', comment: '左线工程量' })
  leftQuantities: number

  @Column({ type: 'double', default: 0, name: 'right_quantities', comment: '左线工程量' })
  rightQuantities: number
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
