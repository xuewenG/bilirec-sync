import { Module } from '@nestjs/common'
import { FangtangService } from './fangtang/fangtang.service'
import { ConfigModule } from '@nestjs/config'

@Module({
  providers: [FangtangService],
  imports: [ConfigModule.forRoot()],
  exports: [FangtangService],
})
export class PushModule {}
