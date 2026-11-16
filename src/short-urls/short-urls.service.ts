import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { ShortUrlsRepository } from './short-urls.repository.js';

const isCodeCollision = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505' &&
    'constraint' in error &&
    error.constraint === 'short_urls_code_key'
  );
};

@Injectable()
export class ShortUrlService {
  constructor(
    private readonly repository: ShortUrlsRepository,
    private readonly config: ConfigService,
  ) {}

  async getShortUrl(code: string): Promise<{
    originalUrl: string;
  }> {
    const result = await this.repository.get(code);
    const isExpired =
      result?.expires_at && new Date(result.expires_at) < new Date();

    if (!result || !result.is_active || isExpired) {
      throw new NotFoundException();
    }

    return {
      originalUrl: result.original_url,
    };
  }

  async createShortUrl(url: string) {
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = randomBytes(9).toString('base64url');

      try {
        await this.repository.create(url, code);

        return {
          shortUrl: `${this.config.getOrThrow<string>('DOMAIN_NAME')}/${code}`,
        };
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts - 1;

        if (!isCodeCollision(error) || isLastAttempt) {
          throw error;
        }
      }
    }

    throw new Error('Could not create short URL');
  }
}
