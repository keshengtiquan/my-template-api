import { PartialType } from '@nestjs/mapped-types';
import { CreateJobteamDto } from './create-jobteam.dto';

export class UpdateJobteamDto extends PartialType(CreateJobteamDto) {}
