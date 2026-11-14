import 'dotenv/config';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ShortUrlsRepository } from './short-urls.repository.js';
import { randomBytes } from 'crypto';

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
  constructor(private readonly repository: ShortUrlsRepository) {}

  async getShortUrl(code: string): Promise<string> {
    const result = await this.repository.get(code);

    if (!result) {
      throw new HttpException(
        'Failed to get short URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result.original_url;
  }

  async createShortUrl(url: string) {
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = randomBytes(9).toString('base64url');

      try {
        await this.repository.create(url, code);

        return {
          shortUrl: `${process.env.DOMAIN_NAME}/${code}`,
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
