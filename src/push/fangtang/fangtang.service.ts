import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class FangtangService {
  constructor(private configService: ConfigService) {}

  public async send(title: string, detail?: string) {
    const key = this.configService.get<string>('FANGTANG_TOKEN')
    if (!key) {
      Logger.error('invalid Fangtang token')
      return
    }

    const postData = JSON.stringify({ text: title, desp: detail })
    const url = `https://sctapi.ftqq.com/${key}.send`

    Logger.log(`request Fangtang send API, title=${title}, detail=${detail}`)
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: postData,
    })
  }
}
