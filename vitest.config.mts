import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const sourceAlias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
  test: {
    pool: 'threads',
    maxWorkers: 1,
    fileParallelism: false,
    projects: [
      {
        extends: true,
        resolve: { alias: sourceAlias },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.{ts,mjs}'],
        },
      },
      {
        extends: true,
        // Only the explicitly server-side project uses the real package's empty entry.
        // Browser boundary enforcement is tested separately with actual next build.
        resolve: {
          alias: {
            ...sourceAlias,
            'server-only': fileURLToPath(
              new URL('./node_modules/server-only/empty.js', import.meta.url),
            ),
          },
        },
        test: {
          name: 'server',
          environment: 'node',
          include: ['tests/server/**/*.test.ts'],
          restoreMocks: true,
          unstubEnvs: true,
          unstubGlobals: true,
        },
      },
      {
        extends: true,
        resolve: { alias: sourceAlias },
        test: {
          name: 'dom',
          environment: 'jsdom',
          setupFiles: ['tests/setup-dom.ts'],
          include: ['tests/dom/**/*.test.tsx'],
        },
      },
    ],
  },
});
