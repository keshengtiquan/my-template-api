import { Module } from '@nestjs/common'
import { CompletionService } from './completion.service'
import { CompletionController } from './completion.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkPlace } from 'src/resource/workplace/entities/workplace.entity'

@Module({
  imports: [TypeOrmModule.forFeature([WorkPlace])],
  controllers: [CompletionController],
  providers: [CompletionService],
})
export class CompletionModule {}
