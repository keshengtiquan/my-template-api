import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { List } from '../../list/entities/list.entity'

export enum WorkPlaceType {
  STATION = 'station', //车站
  SECTION = 'section', //区间
}

@Entity('sc_work_place')
export class WorkPlace {
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
  @Column({ type: 'varchar', nullable: false, length: 100, name: 'workplace_code' })
  workPlaceCode: string

  @Column({ type: 'varchar', nullable: false, length: 100, name: 'workplace_name' })
  workPlaceName: string

  @Column({ type: 'enum', enum: WorkPlaceType, default: WorkPlaceType.STATION, name: 'workplace_type' })
  workPlaceType: string

  @Column({ type: 'int', nullable: false, name: 'sort_number', default: 0 })
  sortNumber: number

  @ManyToMany(() => List)
  @JoinTable({
    name: 'sc_work_list',
    joinColumns: [{ name: 'list_id' }],
    inverseJoinColumns: [{ name: 'work_place_id' }],
  })
  workPlaceList: List[]
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
