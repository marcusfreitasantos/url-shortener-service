import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ShortUrlModule } from './short-urls/short-urls.module.js';
import { PostgresService } from './postgres/postgres.service.js';
import { PostgresModule } from './postgres/postgres.module.js';

@Module({
  imports: [ShortUrlModule, PostgresModule],
  controllers: [AppController],
  providers: [AppService, PostgresService],
})
export class AppModule {}
