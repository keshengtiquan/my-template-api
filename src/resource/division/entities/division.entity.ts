import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('sc_division')
export class Division {
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
  @Column({ type: 'varchar', default: '0', length: 64, name: 'parent_id' })
  parentId: string

  @Column({ type: 'varchar', length: 255, name: 'division_name' })
  divisionName: string

  @Column({ type: 'varchar', length: 64, name: 'division_type' })
  divisionType: string

  @Column({ type: 'varchar', nullable: true, length: 1000, name: 'parent_names' })
  parentNames: string

  @Column({ type: 'decimal', default: 0, precision: 18, scale: 2, name: 'output_value', comment: '产值' })
  outputValue: number
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
