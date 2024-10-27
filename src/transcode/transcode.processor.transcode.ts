import { exec } from 'child_process'
import { InjectQueue, Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job, Queue } from 'bull'
import * as fse from 'fs-extra'

import { FangtangService } from '../push/fangtang/fangtang.service'
import { TranscodeTaskData } from './transcode.interface'
import {
  timestampTotimeStr,
  checkVideoTranscoded,
  getVideoListFilePath,
  getVideoTempPath,
  getVideoSavePath,
  getCoverSavePath,
} from './transcode.util'

@Processor('transcodeQueue')
export class TranscodeProcessor {
  constructor(
    private fangtangService: FangtangService,
    @InjectQueue('transcodeQueue') private queue: Queue,
  ) {}

  @Process('doTranscode')
  async handleDoTranscode(job: Job) {
    const data: TranscodeTaskData = job.data
    const { roomId, liveInfo } = data

    Logger.log(
      `handleDoTranscode, roomId=${roomId}, liveInfo=${timestampTotimeStr(liveInfo.liveStartTime)}`,
    )

    if (checkVideoTranscoded(roomId, liveInfo)) {
      Logger.log('video has been transcoded')
      return
    }

    if (checkVideoTranscoded(roomId, liveInfo)) {
      Logger.log('video is transcoding')
      return
    }

    const videoListFilePath = getVideoListFilePath(roomId, liveInfo)
    fse.outputFileSync(
      videoListFilePath,
      liveInfo.segInfoList.map(segInfo => `file ${segInfo.video}`).join('\n'),
    )

    const videoTempPath = getVideoTempPath(roomId, liveInfo)
    const transcodeCommand = `/usr/local/bin/ffmpeg -n -f concat -safe 0 -i ${videoListFilePath} -c copy ${videoTempPath}`
    return new Promise<void>((resolve, reject) => {
      exec(transcodeCommand, (err, stdout, stderr) => {
        if (
          err ||
          [stdout, stderr].some(
            item =>
              item.includes('already exists. Exiting') ||
              item.includes('Error opening output file'),
          )
        ) {
          Logger.log(
            `transcode failed, roomId=${roomId}, liveInfo=${timestampTotimeStr(liveInfo.liveStartTime)}`,
          )
          this.fangtangService.send(
            '转码未完成',
            `直播间ID=${roomId}, 开播时间=${timestampTotimeStr(liveInfo.liveStartTime)}`,
          )
          reject()
          return
        }

        const videoSavePath = getVideoSavePath(roomId, liveInfo)
        fse.moveSync(videoTempPath, videoSavePath, {
          overwrite: true,
        })

        const coverSavePath = getCoverSavePath(roomId, liveInfo)
        fse.copyFileSync(liveInfo.segInfoList[0].cover, coverSavePath)

        Logger.log(
          `transcode finished, roomId=${roomId}, liveInfo=${timestampTotimeStr(liveInfo.liveStartTime)}`,
        )
        this.fangtangService.send(
          '转码已完成',
          `直播间ID=${roomId}, 开播时间=${timestampTotimeStr(liveInfo.liveStartTime)}`,
        )
        resolve()
      })
    })
  }
}
