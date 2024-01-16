import { Module } from '@nestjs/common'
import { WorkplaceService } from './workplace.service'
import { WorkplaceController } from './workplace.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkPlace } from './entities/workplace.entity'
import { Excel } from '../../excel/entities/excel.entity'
import { ExcelModule } from '../../excel/excel.module'
import { List } from '../list/entities/list.entity'
import { WorkPlaceList } from './entities/workplace.list.entity'

@Module({
  imports: [TypeOrmModule.forFeature([WorkPlace, Excel, List, WorkPlaceList]), ExcelModule],
  controllers: [WorkplaceController],
  providers: [WorkplaceService],
})
export class WorkplaceModule {}
