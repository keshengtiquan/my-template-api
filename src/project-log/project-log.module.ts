import { Module } from '@nestjs/common'
import { ProjectLogService } from './project-log.service'
import { ProjectLogController } from './project-log.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectLog } from './entities/project-log.entity'
import { ProjectLogDetail } from './entities/project-log-detail.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ProjectLog, ProjectLogDetail])],
  controllers: [ProjectLogController],
  providers: [ProjectLogService],
  exports: [ProjectLogService],
})
export class ProjectLogModule {}
