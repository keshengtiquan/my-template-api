import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('sc_job_team')
export class Jobteam {
  @PrimaryColumn({ comment: '主键', name: 'id', type: 'bigint' })
  id: string;

  @Column({
    type: 'varchar',
    default: '000000',
    name: 'tenant_id',
    comment: '租户编号',
  })
  tenantId: string;

  @Column({ type: 'varchar', nullable: true, name: 'create_dept' })
  createDept: string;

  @Column({ comment: '班组名称', name: 'job_team_name', type: 'varchar', length: 50 })
  groupTeamName: string;

  @Column({ comment: '班组负责人', name: 'job_team_leader', type: 'varchar', length: 50 })
  groupTeamLeader: string;

  @Column({ comment: '所属作业队', name: 'job_id', type: 'varchar', length: 255 })
  jobId: string;

  @Column({ nullable: true, length: 255, name: 'create_by' })
  createBy: string;

  @Column({ nullable: true, length: 255, name: 'update_by' })
  updateBy: string;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date;
}
