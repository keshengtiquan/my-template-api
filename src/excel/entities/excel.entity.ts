import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('sc_upload_excel')
export class Excel {
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
  @Column({ type: 'varchar', length: '64', name: 'file_name', comment: '文件名称' })
  fileName: string

  @Column({ type: 'varchar', length: '10', name: 'file_type', comment: '上传文件类型' })
  fileType: string

  @Column({ type: 'varchar', length: '100', name: 'sheet_name',  comment: '解析页签名称' })
  sheetName: string

  @Column({ type: 'int', comment: '从第几行开始解析', name: 'skip_rows' })
  skipRows: number

  @Column({ type: 'varchar', length: '100', name: 'service_name', comment: '服务名称' })
  serviceName: string

  @Column({ type: 'varchar', length: '125', name: 'import_template', comment: '导入模版名称' })
  importTemplate: string

  @Column({ type: 'varchar', length: 5000, name: 'import_template_field', comment: '导入模版表头字段' })
  importTemplateField: string

  @Column({ type: 'varchar', length: 5000, name: 'import_field', comment: '导入字段' })
  importField: string
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
