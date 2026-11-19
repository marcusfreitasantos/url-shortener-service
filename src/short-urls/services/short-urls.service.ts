import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { ShortCodeCollisionError } from '../errors/short-code-collision.error.js';
import { ShortUrlsRepository } from '../repositories/short-urls.repository.js';

const MAX_CODE_ATTEMPTS = 5;

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

    if (!result) {
      throw new NotFoundException();
    }

    return {
      originalUrl: result.original_url,
    };
  }

  async createShortUrl(url: string) {
    const ttlDays = this.config.getOrThrow<number>('SHORT_URL_TTL_DAYS');

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = randomBytes(9).toString('base64url');

      try {
        await this.repository.create(url, code, ttlDays);

        return {
          shortUrl: `${this.config.getOrThrow<string>('DOMAIN_NAME')}/${code}`,
        };
      } catch (error) {
        const canRetry =
          error instanceof ShortCodeCollisionError &&
          attempt < MAX_CODE_ATTEMPTS - 1;

        if (canRetry) {
          continue;
        }

        if (error instanceof ShortCodeCollisionError) {
          throw new ServiceUnavailableException(
            'Não foi possível gerar o link curto.',
          );
        }

        throw error;
      }
    }

    throw new ServiceUnavailableException(
      'Não foi possível gerar o link curto.',
    );
  }
}
