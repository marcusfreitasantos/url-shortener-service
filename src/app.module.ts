import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { DatabaseExceptionFilter } from './postgres/filters/database-exception.filter.js';
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
  providers: [
    {
      provide: APP_PIPE,
      useClass: StandardSchemaValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
  ],
})
export class AppModule {}
