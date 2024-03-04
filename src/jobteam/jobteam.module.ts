import { Module } from '@nestjs/common';
import { JobteamService } from './jobteam.service';
import { JobteamController } from './jobteam.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Jobteam } from './entities/jobteam.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Jobteam])],
  controllers: [JobteamController],
  providers: [JobteamService],
})
export class JobteamModule {}
