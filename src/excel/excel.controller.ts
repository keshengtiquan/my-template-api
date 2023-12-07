import {
  Controller,
  HttpException,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { ExcelService } from './excel.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Express } from 'express'

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Post('/upload/template')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTemplate(
    @UploadedFile(
      new ParseFilePipe({
        exceptionFactory: (err) => {
          throw new HttpException('xxx' + err, HttpStatus.BAD_REQUEST)
        },
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.excelService.parseTemplate(file)
  }
}
