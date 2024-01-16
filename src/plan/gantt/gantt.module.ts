import { Module } from '@nestjs/common'
import { GanttService } from './gantt.service'
import { GanttController } from './gantt.controller'
import { Gantt } from './entities/gantt.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GanttList } from './entities/gantt-list.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Gantt, GanttList])],
  controllers: [GanttController],
  providers: [GanttService],
})
export class GanttModule {}
