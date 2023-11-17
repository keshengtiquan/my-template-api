import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity {
  @Column({ comment: '创建者', default: null })
  create_by: string;

  @Column({ comment: '更新者', default: null })
  update_by: string;

  @CreateDateColumn()
  create_time: Date;

  @UpdateDateColumn()
  update_time: Date;
}
