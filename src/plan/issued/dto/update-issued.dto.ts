import { PartialType } from '@nestjs/mapped-types';
import { CreateIssuedDto } from './create-issued.dto';

export class UpdateIssuedDto extends PartialType(CreateIssuedDto) {}
