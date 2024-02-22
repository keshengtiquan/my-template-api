import { Module } from '@nestjs/common'
import { ProjectLogService } from './project-log.service'
import { ProjectLogController } from './project-log.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectLog } from './entities/project-log.entity'
import { ProjectLogDetail } from './entities/project-log-detail.entity'
import { Tenant } from '../sys/tenant/entities/tenant.entity'
import { DeptModule } from '../sys/dept/dept.module'
import { Issued } from '../plan/issued/entities/issued.entity'
import { Gantt } from '../plan/gantt/entities/gantt.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ProjectLog, ProjectLogDetail, Tenant, Gantt, Issued]), DeptModule],
  controllers: [ProjectLogController],
  providers: [ProjectLogService],
  exports: [ProjectLogService],
})
export class ProjectLogModule {}
