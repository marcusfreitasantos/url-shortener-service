import { Injectable } from '@nestjs/common';
import { PostgresService } from '../postgres/postgres.service.js';

@Injectable()
export class ShortUrlsRepository {
  constructor(private readonly database: PostgresService) {}

  async create(url: string, code: string) {
    const result = await this.database.query(
      `
            INSERT INTO short_urls (original_url, code, expires_at)
            VALUES ($1, $2, NOW() + INTERVAL '7 days')
            RETURNING *
            `,
      [url, code],
    );

    return result.rows[0];
  }

  async get(code: string) {
    const result = await this.database.query(
      `SELECT * FROM short_urls WHERE code = $1`,
      [code],
    );

    return result.rows[0];
  }
}
