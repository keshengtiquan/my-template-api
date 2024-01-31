import { Module } from '@nestjs/common'
import { OnlyofficeService } from './onlyoffice.service'
import { OnlyofficeController } from './onlyoffice.controller'
import { HttpModule } from '@nestjs/axios'

@Module({
  imports: [HttpModule],
  controllers: [OnlyofficeController],
  providers: [OnlyofficeService],
})
export class OnlyofficeModule {}
