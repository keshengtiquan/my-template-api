import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './filter/http-exception.filter'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IS_DEV } from './utils'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'debug', 'error', 'warn'],
  })
  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalFilters(new HttpExceptionFilter())
  // app.useLogger(app.get(WINSTON_LOGGER_TOKEN))

  const configService = app.get(ConfigService)
  await app.listen(configService.get('nest_server_port'))
}
bootstrap().then(() => {
  console.log(`启动成功`)
})
