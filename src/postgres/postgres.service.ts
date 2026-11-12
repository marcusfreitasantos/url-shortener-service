import 'dotenv/config';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 10,
    });
  }

  async query(
    sql: string,
    params: any[] = [],
  ): Promise<QueryResult<QueryResultRow>> {
    return this.pool.query<QueryResultRow>(sql, params);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
