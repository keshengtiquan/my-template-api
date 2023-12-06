import { Module } from '@nestjs/common'
import { ListService } from './list.service'
import { ListController } from './list.controller'
import { ExcelModule } from '../../excel/excel.module'

@Module({
  controllers: [ListController],
  providers: [ListService],
  imports: [ExcelModule],
})
export class ListModule {}
