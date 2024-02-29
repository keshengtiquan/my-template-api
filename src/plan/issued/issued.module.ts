import { Module } from '@nestjs/common'
import { IssuedService } from './issued.service'
import { IssuedController } from './issued.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Issued } from './entities/issued.entity'
import { List } from '../../resource/list/entities/list.entity'
import { Dept } from '../../sys/dept/entities/dept.entity'
import { DeptModule } from '../../sys/dept/dept.module'
import { SectionDivision } from 'src/resource/section-division/entities/section-division.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Issued, List, Dept, SectionDivision]), DeptModule],
  controllers: [IssuedController],
  providers: [IssuedService],
})
export class IssuedModule {}
