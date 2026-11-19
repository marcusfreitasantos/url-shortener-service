import { type INestApplication, RequestMethod } from '@nestjs/common';
import { configureApp } from './configure-app.js';

describe('configureApp', () => {
  it('keeps the short code redirect outside the api prefix', () => {
    const app = { setGlobalPrefix: vi.fn() };

    configureApp(app as unknown as INestApplication);

    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api', {
      exclude: [{ path: ':code', method: RequestMethod.GET }],
    });
  });
});
