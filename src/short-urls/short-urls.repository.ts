import { Injectable } from '@nestjs/common';
import { PostgresService } from '../postgres/postgres.service.js';
import { isUniqueViolation } from '../postgres/database-error.js';
import { ShortCodeCollisionError } from './short-code-collision.error.js';

export type ActiveShortUrl = {
  original_url: string;
};

@Injectable()
export class ShortUrlsRepository {
  constructor(private readonly database: PostgresService) {}

  async create(url: string, code: string, ttlDays: number) {
    try {
      await this.database.query(
        `
        INSERT INTO short_urls (original_url, code, expires_at)
        VALUES ($1, $2, NOW() + make_interval(days => $3::int))
        `,
        [url, code, ttlDays],
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ShortCodeCollisionError();
      }

      throw error;
    }
  }

  async get(code: string): Promise<ActiveShortUrl | undefined> {
    const result = await this.database.query<ActiveShortUrl>(
      `
      SELECT original_url
      FROM short_urls
      WHERE code = $1
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
      `,
      [code],
    );

    return result.rows[0];
  }
}
