import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ShortUrlModule } from './short-urls/short-urls.module.js';

@Module({
  imports: [ShortUrlModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
