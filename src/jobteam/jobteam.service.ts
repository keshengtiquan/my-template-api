import { Injectable } from '@nestjs/common';
import { CreateJobteamDto } from './dto/create-jobteam.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Jobteam } from './entities/jobteam.entity';
import { Repository } from 'typeorm';
import { User } from 'src/sys/user/entities/user.entity';

@Injectable()
export class JobteamService {
  @InjectRepository(Jobteam)
  private readonly jobteamRepository: Repository<Jobteam>;

  async create(createJobteamDto: CreateJobteamDto, userInfo: User) {
    const jobTeam = new Jobteam();
    jobTeam.groupTeamName = createJobteamDto.groupTeamName;
    jobTeam.groupTeamLeader = createJobteamDto.groupTeamLeader;
    jobTeam.jobId = createJobteamDto.jobId;
    jobTeam.createBy = userInfo.userName;
    jobTeam.updateBy = userInfo.userName;
    jobTeam.createDept = userInfo.deptId;
    jobTeam.tenantId = userInfo.tenantId;
    return await this.jobteamRepository.save(jobTeam);
  }
}
