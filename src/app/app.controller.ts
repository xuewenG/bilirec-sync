import { All, Controller } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @All()
  public running() {
    return this.appService.running()
  }
}
