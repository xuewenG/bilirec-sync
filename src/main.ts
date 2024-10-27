import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  const contextPath = configService.get<string>('CONTEXT_PATH')
  if (contextPath && contextPath != '/') {
    app.setGlobalPrefix(contextPath)
  }

  const corsOrigin = configService.get<string>('CORS_ORIGIN')
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin.split(',').filter(origin => !!origin),
    })
  }

  const port = configService.get<string>('PORT') || 8080
  Logger.log(`Server port: ${port}`)
  await app.listen(port, () => {
    process.on('SIGTERM', () => {
      app.close()
    })
  })
}

bootstrap()
