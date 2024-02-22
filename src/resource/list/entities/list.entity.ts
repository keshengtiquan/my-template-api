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

  @PrimaryColumn({ type: 'varchar', length: 64, name: 'list_name' })
  listName: string

  @Column({ type: 'varchar', length: 255, name: 'list_characteristic' })
  listCharacteristic: string

  @Column({ type: 'varchar', length: 10, name: 'unit' })
  unit: string

  @Column({ type: 'double' })
  quantities: number

  @Column({ type: 'decimal', default: 0, precision: 18, scale: 2, name: 'unit_price' })
  unitPrice: number

  @Column({ type: 'decimal', default: 0, precision: 18, scale: 2, name: 'combined_price' })
  combinedPrice: number

  @Column({ type: 'varchar', default: '', length: 1000, name: 'sectional_entry', comment: '分部分项' })
  sectionalEntry: string
  @Column({ type: 'varchar', default: '', length: 1000, name: 'current_section', comment: '当前分项' })
  currentSection: string

  @Column({ type: 'boolean', default: false, name: 'is_focus_list' })
  isFocusList: boolean

  @Column({ type: 'double', name: 'design_quantities' })
  designQuantities: number
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
