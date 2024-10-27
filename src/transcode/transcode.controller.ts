import { InjectQueue } from '@nestjs/bull'
import { All, Body, Controller, Logger, Query } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue } from 'bull'
import { Event } from './transcode.interface'
import { ResultUtil } from '../util/result'

@Controller('/transcode')
export class TranscodeController {
  constructor(
    private configService: ConfigService,
    @InjectQueue('eventQueue') private queue: Queue,
  ) {}

  @All('/webhook')
  public async webhook(@Query('token') token: string, @Body() event: Event) {
    if (token !== this.configService.get('WEBHOOK_TOKEN')) {
      return ResultUtil.error('invalid token')
    }

    const { EventId, EventType } = event
    if (!EventId || !EventType) {
      return ResultUtil.error('invalid event')
    }

    const { RoomId, Name } = event.EventData
    Logger.log(
      `receive event , roomId=${RoomId}, name=${Name}, type=${EventType}`,
    )

    if (RoomId !== Number(this.configService.get('ROOM_ID'))) {
      Logger.log('not target room')
      return
    }

    this.queue.add('event', event, {
      delay: 7 * 60 * 1000,
    })
  }
}
