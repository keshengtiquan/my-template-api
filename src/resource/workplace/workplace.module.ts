import { Module } from '@nestjs/common'
import { WorkplaceService } from './workplace.service'
import { WorkplaceController } from './workplace.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkPlace } from './entities/workplace.entity'
import { Excel } from '../../excel/entities/excel.entity'
import { ExcelModule } from '../../excel/excel.module'

@Module({
  imports: [TypeOrmModule.forFeature([WorkPlace, Excel]), ExcelModule],
  controllers: [WorkplaceController],
  providers: [WorkplaceService],
})
export class WorkplaceModule {}
