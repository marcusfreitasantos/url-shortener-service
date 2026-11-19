import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ShortCodeCollisionError } from '../errors/short-code-collision.error.js';
import { ShortUrlsRepository } from '../repositories/short-urls.repository.js';
import { ShortUrlService } from './short-urls.service.js';

describe('ShortUrlService', () => {
  let service: ShortUrlService;
  const repository = {
    create: vi.fn(),
    get: vi.fn(),
  };
  const config = {
    getOrThrow: vi.fn((key: string) => {
      const values: Record<string, string | number> = {
        DOMAIN_NAME: 'http://localhost:3000',
        SHORT_URL_TTL_DAYS: 7,
      };

      if (!(key in values)) {
        throw new Error(key);
      }

      return values[key];
    }),
  };

  beforeEach(async () => {
    repository.create.mockReset();
    repository.get.mockReset();
    config.getOrThrow.mockClear();

    const module = await Test.createTestingModule({
      providers: [
        ShortUrlService,
        { provide: ShortUrlsRepository, useValue: repository },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(ShortUrlService);
  });

  it('returns the original url of an active link', async () => {
    repository.get.mockResolvedValue({
      original_url: 'https://example.com/a',
    });

    await expect(service.getShortUrl('abcdefghij12')).resolves.toEqual({
      originalUrl: 'https://example.com/a',
    });
  });

  it('hides missing, inactive, and expired links', async () => {
    repository.get.mockResolvedValue(undefined);

    await expect(service.getShortUrl('abcdefghij12')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('stores the configured lifetime and returns the short url', async () => {
    repository.create.mockResolvedValue(undefined);

    const result = await service.createShortUrl('https://example.com/a');

    expect(repository.create).toHaveBeenCalledWith(
      'https://example.com/a',
      expect.stringMatching(/^[A-Za-z0-9_-]{12}$/),
      7,
    );
    expect(result.shortUrl).toMatch(
      /^http:\/\/localhost:3000\/[A-Za-z0-9_-]{12}$/,
    );
  });

  it('retries when the generated code already exists', async () => {
    repository.create
      .mockRejectedValueOnce(new ShortCodeCollisionError())
      .mockResolvedValueOnce(undefined);

    await expect(
      service.createShortUrl('https://example.com/a'),
    ).resolves.toEqual({
      shortUrl: expect.stringMatching(
        /^http:\/\/localhost:3000\/[A-Za-z0-9_-]{12}$/,
      ),
    });
    expect(repository.create).toHaveBeenCalledTimes(2);
  });

  it('stops retrying after the last code collision', async () => {
    repository.create.mockRejectedValue(new ShortCodeCollisionError());

    await expect(
      service.createShortUrl('https://example.com/a'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.create).toHaveBeenCalledTimes(5);
  });

  it('propagates database errors that are not code collisions', async () => {
    const error = Object.assign(new Error('connect ECONNREFUSED'), {
      code: 'ECONNREFUSED',
    });
    repository.create.mockRejectedValue(error);

    await expect(service.createShortUrl('https://example.com/a')).rejects.toBe(
      error,
    );
    expect(repository.create).toHaveBeenCalledOnce();
  });
});
