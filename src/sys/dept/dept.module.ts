import { Module } from '@nestjs/common'
import { DeptService } from './dept.service'
import { DeptController } from './dept.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Dept } from './entities/dept.entity'
import { SectionDivision } from '../../resource/section-division/entities/section-division.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Dept, SectionDivision])],
  controllers: [DeptController],
  providers: [DeptService],
  exports: [DeptService],
})
export class DeptModule {}
