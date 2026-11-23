import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './test/setup/test-database.js';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/setup/global-setup.ts'],
    env: {
      DATABASE_URL: testDatabaseUrl(),
      PAGO_SIMULADO_ESPERA_MS: '0',
      NODE_ENV: 'test',
    },
    fileParallelism: false,
  },
});