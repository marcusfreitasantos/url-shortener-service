import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ShortUrlsRepository } from './short-urls.repository.js';
import { randomBytes } from 'crypto';

@Injectable()
export class ShortUrlService {
  constructor(private readonly repository: ShortUrlsRepository) {}

  getShortUrl(url: string): string {
    return `Short URL: ${url}`;
  }

  async createShortUrl(url: string) {
    try {
      const code = randomBytes(5).toString('base64url');
      const shortUrl = `http://localhost:3000/${code}`;

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
    } catch (error) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }
}
