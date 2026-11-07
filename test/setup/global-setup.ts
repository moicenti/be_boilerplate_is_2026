import { execSync } from 'node:child_process';
import pg from 'pg';
import { testDatabaseUrl } from './test-database.js';

export default async function globalSetup(): Promise<void> {
  const url = new URL(testDatabaseUrl());
  const name = url.pathname.replace(/^\//, '');

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  adminUrl.search = '';

  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [name],
    );
    if (!rowCount) {
      await client.query(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await client.end();
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: 'ignore',
  });
}
