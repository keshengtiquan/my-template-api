import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { WorkPlace } from '../../resource/workplace/entities/workplace.entity'
import { Injectable } from '@nestjs/common'

@ValidatorConstraint({ async: true })
@Injectable()
export class IsWorkPlaceNameAlreadyExistConstraint implements ValidatorConstraintInterface {
  constructor(@InjectRepository(WorkPlace) private readonly workPlaceRepository: Repository<WorkPlace>) {}

  async validate(workPlaceName: any, args: ValidationArguments) {
    const res = await this.workPlaceRepository.find({
      where: {
        workPlaceName: workPlaceName,
      },
    })
    return null
  }
}

export function IsWorkPlaceNameAlreadyExist(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsWorkPlaceNameAlreadyExistConstraint,
    })
  }
}
