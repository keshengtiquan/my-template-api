import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectLogDto } from './create-project-log.dto';

export class UpdateProjectLogDto extends PartialType(CreateProjectLogDto) {}
