import { Injectable } from '@nestjs/common';

@Injectable()
export class ShortUrlService {
  getShortUrl(url: string): string {
    return `Short URL: ${url}`;
  }

  createShortUrl(url: string): string {
    return `Create Short URL from: ${url}`;
  }
}
