export enum EventType {
  SessionStarted = 'SessionStarted',
  FileOpening = 'FileOpening',
  FileClosed = 'FileClosed',
  SessionEnded = 'SessionEnded',
  StreamStarted = 'StreamStarted',
  StreamEnded = 'StreamEnded',
}

interface BaseEventData {
  RoomId: number
  ShortId: number
  Name: string
  Title: string
  AreaNameParent: string
  AreaNameChild: string
  Recording: boolean
  Streaming: boolean
  DanmakuConnected: boolean
}

export interface Event {
  EventType: EventType
  EventTimestamp: number
  EventId: number
  EventData: BaseEventData
}

export interface SegInfo {
  roomId: number
  startTime: number
  cover: string
  video: string
  xml: string
  duration: number
  endTime: number
  liveStartTime: number
}

export interface LiveInfo {
  liveStartTime: number
  segInfoList: SegInfo[]
}

export interface RoomInfo {
  roomId: number
  liveInfoList: LiveInfo[]
}

export interface TranscodeTaskData {
  roomId: number
  liveInfo: LiveInfo
}
