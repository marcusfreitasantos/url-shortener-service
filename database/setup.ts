import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import { envSchema } from '../src/config/env.schema.js';

const envPath = path.resolve('.env');

if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const env = envSchema.parse(process.env);

async function setup() {
  const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  try {
    const sql = fs.readFileSync(path.resolve('database/init.sql'), 'utf-8');

    await pool.query(sql);

    console.log('Database initialized successfully');
  } finally {
    await pool.end();
  }
}

setup().catch((error) => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});
