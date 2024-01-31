import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common'
import { OnlyofficeService } from './onlyoffice.service'
import { DocumentInfoDto } from './dto/documnet.dto'
import { Result } from '../common/result'
import { Auth } from '../sys/auth/decorators/auth.decorators'
import { OnlyofficeCallbackDto } from './dto/callback.dto'

@Controller('onlyoffice')
export class OnlyofficeController {
  constructor(private readonly onlyofficeService: OnlyofficeService) {}

  @Get('/documentInfo')
  @Auth()
  async documentInfo(@Query() query: DocumentInfoDto) {
    return Result.success(await this.onlyofficeService.documentInfo(query))
  }

  @Post('/callback')
  @HttpCode(HttpStatus.OK)
  async callback(@Body() body: OnlyofficeCallbackDto) {
    return await this.onlyofficeService.callback(body)
  }
}
