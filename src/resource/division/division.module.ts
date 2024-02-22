import { Module } from '@nestjs/common'
import { DivisionService } from './division.service'
import { DivisionController } from './division.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Division } from './entities/division.entity'
import { List } from '../list/entities/list.entity'
import { ExcelModule } from '../../excel/excel.module'

@Module({
  imports: [TypeOrmModule.forFeature([Division, List]), ExcelModule],
  controllers: [DivisionController],
  providers: [DivisionService],
  exports: [DivisionService],
})
export class DivisionModule {}
