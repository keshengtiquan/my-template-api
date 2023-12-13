import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('sc_export_excel')
export class ExportExcel {
  @PrimaryColumn({ comment: '主键', name: 'id', type: 'bigint' })
  id: string
  @Column({
    type: 'varchar',
    default: '000000',
    name: 'tenant_id',
    comment: '租户编号',
  })
  tenantId: string

  //开始
  @Column({ type: 'varchar', length: '64', name: 'template_name', comment: '文件名称' })
  templateName: string

  @Column({ type: 'varchar', length: '64',default: 'Sheet1', name: 'sheet_name', comment: '页签名称' })
  sheetName: string

  @Column({ type: 'varchar', length: '10', name: 'export_type', comment: '导出文件类型' })
  exportType: string

  @Column({ type: 'varchar', length: '100', name: 'export_service', comment: '导出服务' })
  exportService: string

  @Column({ type: 'varchar', length: '5000', comment: '从第几行开始解析', name: 'export_fields' })
  exportFields: string

  //结束

  @Column({ type: 'varchar', nullable: true, name: 'create_dept' })
  createDept: string

  @Column({ nullable: true, length: 255, name: 'create_by' })
  createBy: string

  @Column({ nullable: true, length: 255, name: 'update_by' })
  updateBy: string

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date
}
