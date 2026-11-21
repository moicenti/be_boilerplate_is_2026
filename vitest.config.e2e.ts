import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { testDatabaseUrl } from './test/setup/test-database.js';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/setup/global-setup.ts'],
    // Sin la espera de 5 s de la pasarela de pago simulada (H1).
    // NODE_ENV=test desactiva el rate limit (ver app.module.ts).
    env: { DATABASE_URL: testDatabaseUrl(), PAGO_SIMULADO_ESPERA_MS: '0', NODE_ENV: 'test' },
    fileParallelism: false,
  },
});
