import { z } from 'zod';

const port = z.coerce.number().int().min(1).max(65535);

export const envSchema = z.object({
  PORT: port.default(3000),
  DOMAIN_NAME: z.url({ protocol: /^https?$/ }),
  DB_HOST: z.string().min(1),
  DB_PORT: port.default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_POOL_MAX: z.coerce.number().int().min(1).default(10),
  SHORT_URL_TTL_DAYS: z.coerce.number().int().min(1).max(3650).default(7),
});

export type Env = z.infer<typeof envSchema>;
