import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { configureApp } from '../src/configure-app.js';
import { PG_POOL } from '../src/postgres/constants/postgres.constants.js';
import { AppModule } from '../src/app.module.js';
import { ShortCodeCollisionError } from '../src/short-urls/errors/short-code-collision.error.js';
import { ShortUrlsRepository } from '../src/short-urls/repositories/short-urls.repository.js';

const env = {
  PORT: '3000',
  DOMAIN_NAME: 'http://localhost:3000',
  DB_HOST: 'db.internal',
  DB_PORT: '5432',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'url_shortener',
  SHORT_URL_TTL_DAYS: '7',
};

describe('Short URLs (e2e)', () => {
  let app: INestApplication<App>;
  const links = new Map<string, string>();
  const create = vi.fn(async (url: string, code: string, ttlDays: number) => {
    if (links.has(code)) {
      throw new ShortCodeCollisionError();
    }

    links.set(code, url);
    return ttlDays;
  });
  const repository: Pick<ShortUrlsRepository, 'create' | 'get'> = {
    create,
    async get(code: string) {
      const url = links.get(code);

      return url ? { original_url: url } : undefined;
    },
  };

  const previous = new Map<string, string | undefined>();

  beforeAll(async () => {
    for (const [key, value] of Object.entries(env)) {
      previous.set(key, process.env[key]);
      process.env[key] = value;
    }

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PG_POOL)
      .useValue({
        query: vi.fn(),
        end: vi.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(ShortUrlsRepository)
      .useValue(repository)
      .compile();

    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(() => {
    links.clear();
    create.mockClear();
  });

  afterAll(async () => {
    await app?.close();

    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('creates a short url and redirects to the original address', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/short-urls')
      .send({ url: '  https://example.com/docs  ' })
      .expect(201);

    expect(response.body.shortUrl).toMatch(
      /^http:\/\/localhost:3000\/[A-Za-z0-9_-]{12}$/,
    );

    const code = String(response.body.shortUrl).split('/').at(-1);

    expect(create).toHaveBeenCalledWith('https://example.com/docs', code, 7);

    await request(app.getHttpServer())
      .get(`/${code}`)
      .expect(302)
      .expect('Location', 'https://example.com/docs');
  });

  it('rejects a missing url and an address that is not http or https', async () => {
    await request(app.getHttpServer())
      .post('/api/short-urls')
      .send({})
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/short-urls')
      .send({ url: 'javascript:alert(1)' })
      .expect(400);

    expect(create).not.toHaveBeenCalled();
  });

  it('returns 404 when the code does not resolve', async () => {
    await request(app.getHttpServer()).get('/abcdefghij12').expect(404);
  });

  it('returns 400 when the code format is invalid', async () => {
    await request(app.getHttpServer()).get('/not-a-code').expect(400);
  });

  it('keeps link creation under the api prefix', async () => {
    await request(app.getHttpServer())
      .post('/short-urls')
      .send({ url: 'https://example.com/docs' })
      .expect(404);

    expect(create).not.toHaveBeenCalled();
  });
});
