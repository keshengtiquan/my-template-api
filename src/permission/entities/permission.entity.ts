import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('sys_permission')
export class Permission {
  @PrimaryColumn({ comment: '主键', name: 'id', type: 'bigint' })
  id: string;

  @Column({ comment: '名称', name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ comment: '权限字符串', name: 'code', type: 'varchar', length: 100 })
  key: string;

  @Column({ length: 100, nullable: true })
  desc: string;

  @Column({ nullable: true })
  sort: number;
}
