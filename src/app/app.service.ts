import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  public running(): string {
    return 'Service is running'
  }
}
