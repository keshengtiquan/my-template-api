import { PipeTransform, Injectable } from '@nestjs/common'
@Injectable()
export class FileNameEncodePipe implements PipeTransform {
  transform(value: Express.Multer.File) {
    if (!/[^\u0000-\u00ff]/.test(value.originalname)) {
      value.originalname = Buffer.from(value.originalname, 'latin1').toString('utf8')
    }
    return value
  }
}
