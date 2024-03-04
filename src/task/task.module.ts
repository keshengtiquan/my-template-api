import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { ProjectLogModule } from '../project-log/project-log.module';

@Module({
  imports: [ProjectLogModule],
  providers: [TaskService],
})
export class TaskModule {}
