import { defineConfig, devices } from '@playwright/test';

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 2,
  retries: 0,
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { APP_ENV: 'test', CHAT_PROVIDER_ENABLED: 'false' },
    },
    {
      command: 'node scripts/ui-fixture.mjs',
      url: 'http://127.0.0.1:3101',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
