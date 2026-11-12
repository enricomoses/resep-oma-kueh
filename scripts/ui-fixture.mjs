import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

// Test-only local origin. No route is added to the production Next application.
const server = await createServer({
  configFile: false,
  envDir: false,
  root: fileURLToPath(new URL('../tests/fixtures/ui/', import.meta.url)),
  resolve: {
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  },
  oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
  server: {
    host: '127.0.0.1',
    port: 3101,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] },
    proxy: { '/_next': { target: 'http://127.0.0.1:3100' } },
  },
});
await server.listen();
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    void server.close().then(() => process.exit(0));
  });
