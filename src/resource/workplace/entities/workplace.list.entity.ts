import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('sc_work_place_list')
export class WorkPlaceList {
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
  @Column({ type: 'float', default: 0, name: 'all_quantities', comment: '总工程量' })
  allQuantities: number

  @Column({ type: 'float', default: 0, name: 'left_quantities', comment: '左线工程量' })
  leftQuantities: number

  @Column({ type: 'float', default: 0, name: 'right_quantities', comment: '左线工程量' })
  rightQuantities: number

  @Column({ name: 'work_placeId' })
  workPlaceId: string

  @Column({ name: 'list_id' })
  listId: string

  @Column({ type: 'decimal', default: 0, precision: 18, scale: 2, name: 'combined_price' })
  combinedPrice: number
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
