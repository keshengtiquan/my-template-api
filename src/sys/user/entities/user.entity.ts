import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../role/entities/role.entity';

@Entity('sys_user')
export class User {
  @PrimaryColumn({ comment: '主键', name: 'id', type: 'bigint' })
  id: string;

  @Column({
    type: 'varchar',
    name: 'tenant_id',
    default: '000000',
    comment: '租户编号',
  })
  tenantId: string;

  @Column({ type: 'varchar', name: 'dept_id', default: null, comment: '部门ID' })
  deptId: string;

  @Column({
    type: 'varchar',
    name: 'user_name',
    length: 30,
    nullable: false,
    comment: '用户账号',
  })
  userName: string;

  @Column({
    type: 'varchar',
    name: 'user_type',
    length: 20,
    nullable: true,
    comment: '用户类型',
  })
  userType: string;

  @Column({
    type: 'varchar',
    name: 'nick_name',
    length: 30,
    nullable: false,
    comment: '用户昵称',
  })
  nickName: string;

  @Column({ type: 'varchar', length: 60, default: '', comment: '用户邮箱' })
  email: string;

  @Column({
    type: 'varchar',
    name: 'phone_number',
    length: 11,
    default: '',
    comment: '用户手机号码',
  })
  phoneNumber: string;

  @Column({
    type: 'char',
    length: 1,
    default: '0',
    comment: '用户性别（0未知 1男 2女）',
  })
  gender: string;

  @Column({ type: 'varchar', nullable: true, comment: '头像地址' })
  avatar: string;

  @Column({ type: 'varchar', length: 100, default: '', comment: '密码' })
  password: string;

  @Column({ type: 'char', default: '0', comment: '帐号状态（0正常 1停用）' })
  status: string;

  @Column({ type: 'varchar', length: '500', default: 'null', comment: '备注' })
  remark: string;

  @Column({ type: 'varchar', nullable: true, name: 'create_dept' })
  createDept: string;

  @JoinTable({
    name: 'sys_user_role',
    joinColumns: [{ name: 'user_id' }],
    inverseJoinColumns: [{ name: 'role_id' }],
  })
  @ManyToMany(() => Role, (role) => role.users)
  roles: Role[];

  @Column({ nullable: true, length: 255, name: 'create_by' })
  createBy: string;

  @Column({ nullable: true, length: 255, name: 'update_by' })
  updateBy: string;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date;
}
