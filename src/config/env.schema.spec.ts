import { envSchema } from './env.schema.js';

const required = {
  DOMAIN_NAME: 'http://localhost:3000',
  DB_HOST: 'localhost',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'url_shortener',
};

describe('envSchema', () => {
  it('applies defaults and coerces numeric variables', () => {
    expect(envSchema.parse(required)).toMatchObject({
      PORT: 3000,
      DB_PORT: 5432,
      DB_POOL_MAX: 10,
      DOMAIN_NAME: 'http://localhost:3000',
    });

    expect(
      envSchema.parse({
        ...required,
        PORT: '4000',
        DB_PORT: '5433',
        DB_POOL_MAX: '4',
      }),
    ).toMatchObject({
      PORT: 4000,
      DB_PORT: 5433,
      DB_POOL_MAX: 4,
    });
  });

  it('rejects a domain without http or https', () => {
    expect(() =>
      envSchema.parse({ ...required, DOMAIN_NAME: 'localhost:3000' }),
    ).toThrow();
  });

  it('rejects a missing database host', () => {
    expect(() => envSchema.parse({ ...required, DB_HOST: undefined })).toThrow(
      /DB_HOST/,
    );
  });
});
