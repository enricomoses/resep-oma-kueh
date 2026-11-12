import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getLocalHarness, snapshot } from './db/local-harness.mjs';

const { url, anonKey } = await getLocalHarness();
const before = snapshot();
const env = {
  ...process.env,
  APP_ENV: 'test',
  CHAT_PROVIDER_ENABLED: 'false',
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: anonKey,
  BAKERY_SITE_LOCAL: '1',
};
delete env.SUPABASE_SECRET_KEY;
delete env.SUPABASE_SERVICE_ROLE_KEY;
async function run(relative, args) {
  const code = await new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [fileURLToPath(new URL(relative, import.meta.url)), ...args],
      { env, stdio: 'inherit' },
    );
    child.on('error', () => resolve(1));
    child.on('close', resolve);
  });
  assert.equal(
    code,
    0,
    'Local site check failed; no application credentials were written.',
  );
}
try {
  // Public local anon credential only; no service-role/fixture Auth token enters Next.
  await run('../node_modules/next/dist/bin/next', ['build']);
  await run('../node_modules/@playwright/test/cli.js', ['test']);
} finally {
  assert.equal(
    snapshot(),
    before,
    'Read-only site tests must preserve business/Storage state.',
  );
}
console.log(
  'PASS: production HTTP site/API with real local anon reads; business snapshot unchanged.',
);
