import { Module } from '@nestjs/common';
import { PostgresModule } from '../postgres/postgres.module.js';
import { ShortUrlController } from './controllers/short-urls.controller.js';
import { ShortUrlsRepository } from './repositories/short-urls.repository.js';
import { ShortUrlService } from './services/short-urls.service.js';

@Module({
  imports: [PostgresModule],
  controllers: [ShortUrlController],
  providers: [ShortUrlService, ShortUrlsRepository],
})
export class ShortUrlModule {}
