import { Module } from '@nestjs/common'
import { SectionDivisionService } from './section-division.service'
import { SectionDivisionController } from './section-division.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SectionDivision } from './entities/section-division.entity'
import { List } from '../list/entities/list.entity'
import { WorkPlaceList } from '../workplace/entities/workplace.list.entity'
import { WorkPlace } from '../workplace/entities/workplace.entity'

@Module({
  imports: [TypeOrmModule.forFeature([SectionDivision, List, WorkPlaceList, WorkPlace])],
  controllers: [SectionDivisionController],
  providers: [SectionDivisionService],
})
export class SectionDivisionModule {}
