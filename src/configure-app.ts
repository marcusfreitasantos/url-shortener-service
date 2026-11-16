import { INestApplication, RequestMethod } from '@nestjs/common';

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api', {
    exclude: [{ path: ':code', method: RequestMethod.GET }],
  });
}
