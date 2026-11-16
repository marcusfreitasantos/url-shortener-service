import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../configure-app.js';
import { DatabaseExceptionFilter } from '../postgres/database-exception.filter.js';
import { ShortUrlController } from './short-urls.controller.js';
import { ShortUrlService } from './short-urls.service.js';

describe('ShortUrlController', () => {
  let app: INestApplication;
  const shortUrlService = {
    getShortUrl: vi.fn(),
    createShortUrl: vi.fn(),
  };

  beforeEach(async () => {
    shortUrlService.getShortUrl.mockReset();
    shortUrlService.createShortUrl.mockReset();

    const module = await Test.createTestingModule({
      controllers: [ShortUrlController],
      providers: [
        { provide: ShortUrlService, useValue: shortUrlService },
        { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
        { provide: APP_FILTER, useClass: DatabaseExceptionFilter },
      ],
    }).compile();

    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates a short url from a trimmed http or https address', async () => {
    shortUrlService.createShortUrl.mockResolvedValue({
      shortUrl: 'http://localhost:3000/abcdefghij12',
    });

    await request(app.getHttpServer())
      .post('/api/short-urls')
      .send({ url: '  https://example.com/a  ', extra: true })
      .expect(201)
      .expect({ shortUrl: 'http://localhost:3000/abcdefghij12' });

    expect(shortUrlService.createShortUrl).toHaveBeenCalledWith(
      'https://example.com/a',
    );
  });

  it('rejects a body without a url', async () => {
    await request(app.getHttpServer())
      .post('/api/short-urls')
      .send({})
      .expect(400)
      .expect((response) => {
        expect(response.body.message).toContain(
          'url: O campo "url" é obrigatório.',
        );
      });

    expect(shortUrlService.createShortUrl).not.toHaveBeenCalled();
  });

  it('rejects addresses that are not http or https', async () => {
    await request(app.getHttpServer())
      .post('/api/short-urls')
      .send({ url: 'javascript:alert(1)' })
      .expect(400)
      .expect((response) => {
        expect(response.body.message).toContain(
          'url: O campo "url" deve ser um endereço http ou https.',
        );
      });

    expect(shortUrlService.createShortUrl).not.toHaveBeenCalled();
  });

  it('rejects a short code before querying the database', async () => {
    await request(app.getHttpServer())
      .get('/not-a-code')
      .expect(400)
      .expect((response) => {
        expect(response.body.message).toContain(
          'O código informado é inválido.',
        );
      });

    expect(shortUrlService.getShortUrl).not.toHaveBeenCalled();
  });

  it('redirects a code with the expected format', async () => {
    shortUrlService.getShortUrl.mockResolvedValue({
      originalUrl: 'https://example.com/a',
    });

    await request(app.getHttpServer())
      .get('/abcdefghij12')
      .expect(302)
      .expect('Location', 'https://example.com/a');

    expect(shortUrlService.getShortUrl).toHaveBeenCalledWith('abcdefghij12');
  });

  it('keeps the redirect at the root and the api under the prefix', async () => {
    shortUrlService.getShortUrl.mockResolvedValue({
      originalUrl: 'https://example.com/a',
    });

    await request(app.getHttpServer())
      .post('/short-urls')
      .send({
        url: 'https://example.com/a',
      })
      .expect(404);

    await request(app.getHttpServer()).get('/api/abcdefghij12').expect(404);

    expect(shortUrlService.getShortUrl).not.toHaveBeenCalled();
  });

  it('hides database details from connection failures', async () => {
    shortUrlService.createShortUrl.mockRejectedValue(
      Object.assign(new Error('connect ECONNREFUSED'), {
        code: 'ECONNREFUSED',
        detail: 'password=postgres',
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/api/short-urls')
      .send({ url: 'https://example.com/a' })
      .expect(503);

    expect(response.body.message).toBe('Serviço temporariamente indisponível.');
    expect(JSON.stringify(response.body)).not.toContain('password');
    expect(JSON.stringify(response.body)).not.toContain('ECONNREFUSED');
  });

  it('hides unique constraint details when a collision reaches the filter', async () => {
    shortUrlService.createShortUrl.mockRejectedValue(
      Object.assign(new Error('duplicate key'), {
        code: '23505',
        severity: 'ERROR',
        constraint: 'short_urls_code_key',
        detail: 'Key (code)=(abcdefghij12) already exists.',
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/api/short-urls')
      .send({ url: 'https://example.com/a' })
      .expect(503);

    expect(response.body.message).toBe('Não foi possível gerar o link curto.');
    expect(JSON.stringify(response.body)).not.toContain('short_urls_code_key');
    expect(JSON.stringify(response.body)).not.toContain('already exists');
  });
});
