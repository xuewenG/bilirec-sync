import { ExpressAdapter } from '@bull-board/express'
import { BullBoardModule } from '@bull-board/nestjs'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bull'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TranscodeModule } from '../transcode/transcode.module'
import { PushModule } from '../push/push.module'

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    TranscodeModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          redis: {
            host: configService.get<string>('REDIS_HOST'),
            port: Number(configService.get<string>('REDIS_PORT')),
            password: configService.get<string>('REDIS_PASSWORD'),
          },
        }
      },
    }),
    BullBoardModule.forRoot({
      route: '/bull',
      adapter: ExpressAdapter,
    }),
    PushModule,
  ],
})
export class AppModule {}
