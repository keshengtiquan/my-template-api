import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('sc_section_division')
export class SectionDivision {
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
  @Column({ type: 'varchar', length: '64', name: 'dept_id' })
  deptId: string

  @Column({ type: 'varchar', default: '', length: '500', name: 'sector', comment: '负责区段' })
  sector: string

  @Column({ type: 'varchar', default: '', length: '64', name: 'principal', comment: '负责人' })
  principal: string

  @Column({ type: 'decimal', default: 0, precision: 18, scale: 2, name: 'output_value', comment: '产值' })
  outputValue: number

  @Column({ type: 'varchar', default: '[]', name: 'list_ids', length: 10000 })
  listIds: string

  @Column({ type: 'varchar', default: '[]', name: 'work_place_ids', length: 1000 })
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
