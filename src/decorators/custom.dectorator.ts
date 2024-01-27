import { SetMetadata } from '@nestjs/common'

export const CustomDecorator = (value: string): MethodDecorator => {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata('customMetadataKey', value)(target, propertyKey, descriptor)
  }
}
