import { Test } from '@nestjs/testing';
import { PostgresService } from '../../postgres/services/postgres.service.js';
import { ShortCodeCollisionError } from '../errors/short-code-collision.error.js';
import { ShortUrlsRepository } from './short-urls.repository.js';

describe('ShortUrlsRepository', () => {
  let repository: ShortUrlsRepository;
  const database = {
    query: vi.fn(),
  };

  beforeEach(async () => {
    database.query.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        ShortUrlsRepository,
        { provide: PostgresService, useValue: database },
      ],
    }).compile();

    repository = module.get(ShortUrlsRepository);
  });

  it('stores the link with the lifetime received from the caller', async () => {
    database.query.mockResolvedValue({ rows: [] });

    await repository.create('https://example.com/a', 'abcdefghij12', 7);

    const [sql, params] = database.query.mock.calls[0];
    expect(sql).toContain('make_interval(days => $3::int)');
    expect(params).toEqual(['https://example.com/a', 'abcdefghij12', 7]);
  });

  it('turns a code collision into a domain error', async () => {
    database.query.mockRejectedValue({
      code: '23505',
      constraint: 'short_urls_code_key',
      detail: 'Key (code)=(abcdefghij12) already exists.',
    });

    await expect(
      repository.create('https://example.com/a', 'abcdefghij12', 7),
    ).rejects.toBeInstanceOf(ShortCodeCollisionError);
  });

  it('reads only active links that have not expired', async () => {
    database.query.mockResolvedValue({
      rows: [{ original_url: 'https://example.com/a' }],
    });

    await expect(repository.get('abcdefghij12')).resolves.toEqual({
      original_url: 'https://example.com/a',
    });

    const [sql, params] = database.query.mock.calls[0];
    expect(sql).toContain('is_active = TRUE');
    expect(sql).toContain('expires_at IS NULL OR expires_at > NOW()');
    expect(params).toEqual(['abcdefghij12']);
  });

  it('propagates connection failures', async () => {
    const error = Object.assign(new Error('connect ECONNREFUSED'), {
      code: 'ECONNREFUSED',
      detail: 'password=postgres',
    });
    database.query.mockRejectedValue(error);

    await expect(
      repository.create('https://example.com/a', 'abcdefghij12', 7),
    ).rejects.toBe(error);
  });
});
