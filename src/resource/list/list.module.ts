import { Module } from '@nestjs/common'
import { ListService } from './list.service'
import { ListController } from './list.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { List } from './entities/list.entity'
import { Excel } from '../../excel/entities/excel.entity'
import { ExcelModule } from '../../excel/excel.module'
import { ExportExcel } from '../../excel/entities/export.excel.entity'
import { WorkPlaceList } from '../workplace/entities/workplace.list.entity'
import { GanttList } from '../../plan/gantt/entities/gantt-list.entity'
import { Issued } from '../../plan/issued/entities/issued.entity'
import { ProjectLogDetail } from '../../project-log/entities/project-log-detail.entity'
import { Division } from '../division/entities/division.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([List, Excel, ExportExcel, WorkPlaceList, GanttList, Issued, ProjectLogDetail, Division]),
    ExcelModule,
  ],
  controllers: [ListController],
  providers: [ListService],
  exports: [ListService],
})
export class ListModule {}
