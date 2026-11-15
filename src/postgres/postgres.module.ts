import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PG_POOL } from './postgres.constants.js';
import { PostgresService } from './postgres.service.js';

const createPgPool = (config: ConfigService): Pool =>
  new Pool({
    host: config.getOrThrow<string>('DB_HOST'),
    port: config.getOrThrow<number>('DB_PORT'),
    user: config.getOrThrow<string>('DB_USER'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    database: config.getOrThrow<string>('DB_NAME'),
    max: config.getOrThrow<number>('DB_POOL_MAX'),
  });

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: createPgPool,
    },
    PostgresService,
  ],
  exports: [PostgresService],
})
export class PostgresModule {}
