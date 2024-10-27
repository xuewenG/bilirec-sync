import * as fs from 'fs'
import * as path from 'path'
import { InjectQueue, Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job, Queue } from 'bull'
import * as moment from 'moment-timezone'

import {
  TZ,
  sourceDir,
  ROOM_DIR_PATTERN,
  SEG_TIME_PATTERN,
} from './transcode.constant'
import { EventType, LiveInfo, RoomInfo, SegInfo } from './transcode.interface'
import {
  timeStrToTimestamp,
  getExtraInfoByFilePath,
  timestampTotimeStr,
  checkVideoTranscoded,
  checkVideoTranscoding,
} from './transcode.util'

@Processor('eventQueue')
export class EventProcessor {
  constructor(@InjectQueue('transcodeQueue') private queue: Queue) {}

  @Process('event')
  async handleEvent(job: Job) {
    const event = job.data
    if (!event) {
      return
    }

    const eventType = event.EventType
    const name = event.EventData.Name
    const eventRoomId = event.EventData.RoomId

    Logger.log(
      `handleEvent, name=${name}, roomId=${eventRoomId}, type=${eventType}`,
    )

    if (eventType !== EventType.StreamEnded) {
      Logger.log(`not stream ended event`)
      return
    }

    Logger.log(`consume StreamEnded event`)

    // 先获取所有的房间目录
    const roomDirList = fs
      .readdirSync(sourceDir)
      .map(dir => path.join(sourceDir, dir))
      .filter(
        dir => fs.statSync(dir).isDirectory() && ROOM_DIR_PATTERN.test(dir),
      )
      .filter(dir => dir.includes(`${eventRoomId}`))

    const roomInfoList = await Promise.all(
      roomDirList.map(async (roomDir): Promise<RoomInfo | undefined> => {
        // 获取当前房间 ID
        const [, roomIdStr] = ROOM_DIR_PATTERN.exec(roomDir) || []
        const roomId = parseInt(roomIdStr, 10)
        if (!roomId) {
          console.log(`目录名格式错误, roomDir=${roomDir}`)
          return
        }

        // 保存当前房间的所有 seg
        const segMapBySegStartTime = new Map<number, SegInfo>()

        // 获取当前房间目录下的所有文件
        const segFilePathList = fs
          .readdirSync(roomDir)
          .map(segFilePath => path.join(roomDir, segFilePath))

        // 将个每个文件组合到对应的 seg
        segFilePathList.forEach(segFilePath => {
          const filename = path.basename(segFilePath)
          const [, timeStr] = SEG_TIME_PATTERN.exec(filename) || []
          if (!timeStr) {
            console.log(`文件名格式错误, segFilePath=${segFilePath}`)
            return
          }

          const startTime = timeStrToTimestamp(timeStr)
          if (
            startTime < moment.tz('202409011700', 'YYYYMMDDHHmm', TZ).valueOf()
          ) {
            return
          }

          const segInfo: SegInfo = segMapBySegStartTime.get(startTime) || {
            roomId,
            startTime,
            cover: '',
            video: '',
            xml: '',
            duration: 0,
            endTime: 0,
            liveStartTime: 0,
          }
          if (
            ['.cover.png', '.cover.jpg', '.cover.jpeg'].some(suffix =>
              segFilePath.endsWith(suffix),
            )
          ) {
            segInfo.cover = segFilePath
          } else if (segFilePath.endsWith('.flv')) {
            segInfo.video = segFilePath
          } else if (segFilePath.endsWith('.xml')) {
            segInfo.xml = segFilePath
          }
          segMapBySegStartTime.set(startTime, segInfo)
        })

        // 将 seg 进行排序
        const segInfoList = (
          await Promise.all(
            [...segMapBySegStartTime.values()].map(async seg => {
              const extraInfo = await getExtraInfoByFilePath(
                seg.video,
                seg.startTime,
              )
              return {
                ...seg,
                ...extraInfo,
              }
            }),
          )
        ).sort((l, r) => l.startTime - r.startTime)

        // 获取 seg 对应的直播的开播时间
        for (let i = 0; i < segInfoList.length; i++) {
          const currentSeg = segInfoList[i]
          // 默认取当前的片段时间
          let liveStartTime = currentSeg.startTime
          const preSeg = segInfoList[i - 1]
          if (preSeg) {
            // 如果当前片段时间没超出上一个片段时间的 5 分钟
            if (currentSeg.startTime - preSeg.endTime < 5 * 60 * 1000) {
              liveStartTime = preSeg.liveStartTime
            }
          }

          currentSeg.liveStartTime = liveStartTime
        }

        // 按照开播时间进行分组
        const segListMapByLiveStartTime = new Map<number, SegInfo[]>()
        for (const seg of segInfoList) {
          const liveStartTime = seg.liveStartTime
          const segListByLiveStartTime =
            segListMapByLiveStartTime.get(liveStartTime) || []
          segListByLiveStartTime.push(seg)
          segListMapByLiveStartTime.set(liveStartTime, segListByLiveStartTime)
        }

        const liveInfoList: LiveInfo[] = [
          ...segListMapByLiveStartTime.entries(),
        ].map(([liveStartTime, segListByLiveStartTime]) => {
          return {
            liveStartTime,
            segInfoList: segListByLiveStartTime,
          }
        })

        return {
          roomId,
          liveInfoList,
        }
      }),
    )

    roomInfoList.forEach(roomInfo => {
      if (!roomInfo) {
        return
      }

      const { roomId, liveInfoList } = roomInfo
      liveInfoList.forEach(liveInfo => {
        Logger.log(
          `roomId=${roomId}, liveTime=${timestampTotimeStr(liveInfo.liveStartTime)}`,
        )

        const segCount = liveInfo.segInfoList.length
        const lastSeg = liveInfo.segInfoList[segCount - 1]
        if (Date.now() - lastSeg.endTime < 6 * 60 * 1000) {
          Logger.log('live is living')
          return
        }

        if (checkVideoTranscoded(roomId, liveInfo)) {
          Logger.log('live has been transcoded')
          return
        }

        if (checkVideoTranscoding(roomId, liveInfo)) {
          Logger.log('live is transcoding')
          return
        }

        Logger.log('add transcode task')
        this.queue.add('doTranscode', {
          roomId,
          liveInfo,
        })
      })
    })
  }
}
