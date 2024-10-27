import { BullAdapter } from '@bull-board/api/bullAdapter'
import { BullBoardModule } from '@bull-board/nestjs'
import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TranscodeController } from './transcode.controller'
import { EventProcessor } from './transcode.processor.event'
import { TranscodeProcessor } from './transcode.processor.transcode'
import { PushModule } from '../push/push.module'

@Module({
  controllers: [TranscodeController],
  providers: [EventProcessor, TranscodeProcessor],
  imports: [
    BullModule.registerQueue({
      name: 'eventQueue',
    }),
    BullBoardModule.forFeature({
      name: 'eventQueue',
      adapter: BullAdapter,
    }),
    BullModule.registerQueue({
      name: 'transcodeQueue',
    }),
    BullBoardModule.forFeature({
      name: 'transcodeQueue',
      adapter: BullAdapter,
    }),
    ConfigModule,
    PushModule,
  ],
})
export class TranscodeModule {}
