import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('sc_project_log')
export class ProjectLog {
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
  @Column({ type: 'varchar', length: 64, name: 'fill_date', comment: '填报日期' })
  fillDate: string

  @Column({ type: 'varchar', length: 64, default: '', name: 'fill_user', comment: '填报人' })
  fillUser: string

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'work_people_number', comment: '施工人数' })
  workPeopleNumber: number
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
