import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { envSchema } from '../config/env.schema.js';
import { PG_POOL } from './postgres.constants.js';
import { PostgresModule } from './postgres.module.js';
import { PostgresService } from './postgres.service.js';

const validEnv = {
  PORT: '3000',
  DOMAIN_NAME: 'http://localhost:3000',
  DB_HOST: 'db.internal',
  DB_PORT: '5432',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'url_shortener',
  DB_POOL_MAX: '4',
};

describe('PostgresService', () => {
  let service: PostgresService;
  const pool = {
    query: vi.fn(),
    end: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    pool.query.mockReset();
    pool.end.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PostgresService, { provide: PG_POOL, useValue: pool }],
    }).compile();

    service = module.get(PostgresService);
  });

  it('delegates queries to the injected pool', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

    await expect(service.query('SELECT 1', ['a'])).resolves.toEqual({
      rows: [{ id: 1 }],
    });
    expect(pool.query).toHaveBeenCalledWith('SELECT 1', ['a']);
  });

  it('closes the pool when the module is destroyed', async () => {
    await service.onModuleDestroy();

    expect(pool.end).toHaveBeenCalledOnce();
  });
});

describe('PostgresModule', () => {
  const envKeys = Object.keys(validEnv);
  const previous = new Map<string, string | undefined>();

  beforeEach(() => {
    for (const key of envKeys) {
      previous.set(key, process.env[key]);
    }
  });

  afterEach(() => {
    for (const key of envKeys) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  async function compileModule() {
    return Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          cache: true,
          validationSchema: envSchema,
        }),
        PostgresModule,
      ],
    }).compile();
  }

  it('builds the pool from the validated configuration', async () => {
    Object.assign(process.env, validEnv);

    const module = await compileModule();
    const pool = module.get<Pool>(PG_POOL);
    const end = vi.spyOn(pool, 'end').mockResolvedValue();

    expect(pool.options).toMatchObject({
      host: 'db.internal',
      port: 5432,
      user: 'postgres',
      database: 'url_shortener',
      max: 4,
    });

    await module.init();
    await module.close();
    expect(end).toHaveBeenCalledOnce();
  });

  it('stops boot when a required variable is missing', async () => {
    Object.assign(process.env, validEnv);
    delete process.env.DB_HOST;

    await expect(compileModule()).rejects.toThrow(/DB_HOST/);
  });
});
