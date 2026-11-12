import { Module } from '@nestjs/common';
import { ShortUrlController } from './short-urls.controller.js';
import { ShortUrlService } from './short-urls.service.js';
import { ShortUrlsRepository } from './short-urls.repository.js';

@Module({
  controllers: [ShortUrlController],
  providers: [ShortUrlService, ShortUrlsRepository],
})
export class ShortUrlModule {}
