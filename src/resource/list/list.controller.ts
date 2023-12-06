import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ListService } from './list.service'
import { FileInterceptor } from '@nestjs/platform-express'

@Controller('list')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return await this.listService.upload(file)
  }
}
