import 'dotenv/config';

export function testDatabaseUrl(): string {
  const base = process.env.DATABASE_URL;
  if (!base) {
    throw new Error(
      'Falta DATABASE_URL en .env para derivar la base de pruebas.',
    );
  }
  const url = new URL(base);
  const name = url.pathname.replace(/^\//, '');
  url.pathname = `/${name.endsWith('_test') ? name : `${name}_test`}`;
  return url.toString();
}
