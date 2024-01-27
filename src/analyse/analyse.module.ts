import { Module } from '@nestjs/common'
import { AnalyseService } from './analyse.service'
import { AnalyseController } from './analyse.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { List } from '../resource/list/entities/list.entity'
import { ProjectLog } from '../project-log/entities/project-log.entity'
import { ProjectLogDetail } from '../project-log/entities/project-log-detail.entity'
import { WorkPlace } from '../resource/workplace/entities/workplace.entity'
import { DeptModule } from '../sys/dept/dept.module'
import { Division } from '../resource/division/entities/division.entity'

@Module({
  imports: [TypeOrmModule.forFeature([List, ProjectLog, ProjectLogDetail, WorkPlace, Division]), DeptModule],
  controllers: [AnalyseController],
  providers: [AnalyseService],
})
export class AnalyseModule {}
