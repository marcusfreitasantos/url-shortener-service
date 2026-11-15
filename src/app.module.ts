import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.schema.js';
import { PostgresModule } from './postgres/postgres.module.js';
import { ShortUrlModule } from './short-urls/short-urls.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envSchema,
    }),
    PostgresModule,
    ShortUrlModule,
  ],
})
export class AppModule {}
