import { Module } from '@nestjs/common'
import { ListService } from './list.service'
import { ListController } from './list.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { List } from './entities/list.entity'
import { Excel } from '../../excel/entities/excel.entity'
import { ExcelModule } from '../../excel/excel.module'
import { ExportExcel } from '../../excel/entities/export.excel.entity'

@Module({
  imports: [TypeOrmModule.forFeature([List, Excel, ExportExcel]), ExcelModule],
  controllers: [ListController],
  providers: [ListService],
  exports: [ListService],
})
export class ListModule {}
