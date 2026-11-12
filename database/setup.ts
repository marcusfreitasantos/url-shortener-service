import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'node:fs';
import path from 'node:path';

async function setup() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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
