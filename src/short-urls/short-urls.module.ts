import { Module } from '@nestjs/common';
import { ShortUrlController } from './short-urls.controller.js';
import { ShortUrlService } from './short-urls.service.js';

@Module({
  controllers: [ShortUrlController],
  providers: [ShortUrlService],
})
export class ShortUrlModule {}
