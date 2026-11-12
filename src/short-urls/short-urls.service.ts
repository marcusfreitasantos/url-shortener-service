import 'dotenv/config';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ShortUrlsRepository } from './short-urls.repository.js';
import { randomBytes } from 'crypto';

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
    const code = randomBytes(5).toString('base64url');
    const shortUrl = `${process.env.DOMAIN_NAME}/${code}`;

    const result = await this.repository.create(url, code);

    if (!result) {
      throw new HttpException(
        'Failed to create short URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      shortUrl,
    };
  }
}
