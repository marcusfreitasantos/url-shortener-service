import { Module } from '@nestjs/common';
import { ShortUrlModule } from './short-urls/short-urls.module.js';
import { PostgresService } from './postgres/postgres.service.js';
import { PostgresModule } from './postgres/postgres.module.js';

@Module({
  imports: [ShortUrlModule, PostgresModule],
  providers: [PostgresService],
})
export class AppModule {}
