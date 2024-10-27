import * as fs from 'fs'
import * as path from 'path'
import * as moment from 'moment-timezone'

import { TZ, targetDir, tempDir } from './transcode.constant'
import { LiveInfo } from './transcode.interface'

export const timeStrToTimestamp = (timeStr: string) =>
  moment.tz(`${timeStr}`, 'YYYYMMDD-HHmmss-SSS', TZ).valueOf()

export const timestampTotimeStr = (timestamp: number) =>
  moment.tz(timestamp, TZ).format('YYYY-MMDD-HHmm')

export const getExtraInfoByFilePath = async (
  filePath: string,
  startTime: number,
) => {
  const stat = await fs.promises.stat(filePath)

  const endTime = Math.floor(stat.ctimeMs)
  const duration = endTime - startTime

  return { duration, startTime, endTime }
}

export const getVideoListFilePath = (roomId: number, liveInfo: LiveInfo) =>
  path.join(tempDir, `${roomId}`, `${liveInfo.liveStartTime}.txt`)

export const getCoverExt = (liveInfo: LiveInfo) =>
  path.extname(liveInfo.segInfoList[0].cover)

export const getVideoTempPath = (roomId: number, liveInfo: LiveInfo) =>
  path.join(
    tempDir,
    `${roomId}`,
    `${timestampTotimeStr(liveInfo.liveStartTime)}.mp4`,
  )

export const getVideoSavePath = (roomId: number, liveInfo: LiveInfo) =>
  path.join(
    targetDir,
    `${roomId}`,
    `${timestampTotimeStr(liveInfo.liveStartTime)}.mp4`,
  )

export const getCoverSavePath = (roomId: number, liveInfo: LiveInfo) => {
  const ext = getCoverExt(liveInfo)
  return path.join(
    targetDir,
    `${roomId}`,
    `${timestampTotimeStr(liveInfo.liveStartTime)}${ext}`,
  )
}

export const checkVideoTranscoded = (roomId: number, liveInfo: LiveInfo) => {
  const videoSavePath = getVideoSavePath(roomId, liveInfo)
  return fs.existsSync(videoSavePath)
}

export const checkVideoTranscoding = (roomId: number, liveInfo: LiveInfo) => {
  const videoTempPath = getVideoTempPath(roomId, liveInfo)
  return fs.existsSync(videoTempPath)
}

// const FFPROBE = "/usr/local/bin/ffprobe";
// const getExtraInfoByFilePath = (filePath) => {
//   return new Promise((resolve) => {
//     const p = execFile(
//       `${FFPROBE}`,
//       ["-v", "quiet", "-print_format", "json", "-show_format", filePath],
//       {
//         stdio: ["ignore", "pipe", "ignore"],
//       }
//     );

//     let output = "";
//     p.stdout.on("data", (data) => {
//       output += data.toString();
//     });
//     p.stdout.on("close", () => {
//       const info = JSON.parse(output);

//       const duration = info.format.duration * 1000;
//       const startTime = new Date(info.format.tags.StartTime).getTime();
//       const endTime = startTime + duration;

//       resolve({ duration, startTime, endTime });
//     });
//   });
// };
