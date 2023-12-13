import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('sc_list')
export class List {
  @Column({ comment: '主键', name: 'id', type: 'bigint' })
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

  /**
   * 表格字段开始
   */
  @Column({ type: 'int', nullable: true, name: 'serial_number' })
  serialNumber: number

  @PrimaryColumn({ type: 'varchar', length: 64, name: 'list_code' })
  listCode: string

  @Column({ type: 'varchar', length: 64, name: 'list_name' })
  listName: string

  @Column({ type: 'varchar', length: 255, name: 'list_characteristic' })
  listCharacteristic: string

  @Column({ type: 'varchar', length: 10, name: 'unit' })
  unit: string

  @Column({ type: 'int' })
  quantities: number

  @Column({ type: 'float', name: 'unit_price' })
  unitPrice: number

  @Column({ type: 'float', name: 'combined_price' })
  combinedPrice: number
  /**
   * 表格字段结束
   */

  @Column({ nullable: true, length: 255, name: 'create_by' })
  createBy: string

  @Column({ nullable: true, length: 255, name: 'update_by' })
  updateBy: string

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date
}
