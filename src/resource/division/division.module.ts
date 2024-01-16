import { Module } from '@nestjs/common'
import { DivisionService } from './division.service'
import { DivisionController } from './division.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Division } from './entities/division.entity'
import { List } from '../list/entities/list.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Division, List])],
  controllers: [DivisionController],
  providers: [DivisionService],
})
export class DivisionModule {}
