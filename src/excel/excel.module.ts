import { Module } from '@nestjs/common'
import { ExcelService } from './excel.service'
import { ExcelController } from './excel.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Excel } from './entities/excel.entity'
import { ExportExcel } from './entities/export.excel.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Excel, ExportExcel])],
  controllers: [ExcelController],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
