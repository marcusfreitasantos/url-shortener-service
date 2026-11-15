import { Module } from '@nestjs/common';
import { PostgresModule } from '../postgres/postgres.module.js';
import { ShortUrlController } from './short-urls.controller.js';
import { ShortUrlService } from './short-urls.service.js';
import { ShortUrlsRepository } from './short-urls.repository.js';

@Module({
  imports: [PostgresModule],
  controllers: [ShortUrlController],
  providers: [ShortUrlService, ShortUrlsRepository],
})
export class ShortUrlModule {}
