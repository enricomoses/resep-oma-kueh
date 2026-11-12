import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { repositoryRoot, requireCli } from './db/cli.mjs';
import { getLocalHarness, snapshot } from './db/local-harness.mjs';

if (process.argv.length > 2 || process.env.BAKERY_DB_POLICY_TEST)
  throw new Error(
    'Policy runner accepts no external target/recursive test flags.',
  );

const workdir = new URL('test-results/f04-policy-stack/', repositoryRoot);
assert.ok(
  fileURLToPath(workdir).startsWith(fileURLToPath(repositoryRoot)),
  'test workspace must stay within bakery',
);
await mkdir(new URL('supabase/', workdir), { recursive: true });
let config = await readFile(
  new URL('supabase/config.toml', repositoryRoot),
  'utf8',
);
config = config
  .replace(
    'project_id = "resep-oma-kueh"',
    'project_id = "resep-oma-kueh-policy-test"',
  )
  .replace(/54(32\d)/g, '55$1')
  .replace(
    /\[db.seed\]\s*[\s\S]*?(?=\n\[)/,
    '[db.seed]\nenabled = false\nsql_paths = []\n',
  );
await writeFile(new URL('supabase/config.toml', workdir), config);
await cp(
  new URL('supabase/migrations/', repositoryRoot),
  new URL('supabase/migrations/', workdir),
  { recursive: true },
);
await cp(
  new URL('supabase/tests/', repositoryRoot),
  new URL('supabase/tests/', workdir),
  { recursive: true },
);
const options = { workdir };
let normalSnapshot;
try {
  await getLocalHarness();
  normalSnapshot = snapshot();
} catch {
  console.log(
    'Normal dataset snapshot check NOT RUN: normal local stack is not ready; only disposable test project will be used.',
  );
}
const excluded =
  'realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor';
console.log(
  'Policy tests use disposable bakery LOCAL test stack 127.0.0.1:55321/55322; normal demo DB is preserved.',
);
async function nodeScript(args) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: fileURLToPath(repositoryRoot),
      env: { ...process.env, BAKERY_DB_POLICY_TEST: '1' },
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', resolve);
  });
  assert.ok(code === 0, 'isolated policy suite failed');
}
try {
  await requireCli(['start', '--exclude', excluded], options);
  // Disposable project only; no demo or owner data is reset.
  await requireCli(['db', 'reset', '--no-seed'], options);
  const output = await requireCli(['test', 'db'], options);
  console.log(output);
  await nodeScript(['scripts/test-db-concurrency.mjs']);
  await nodeScript([
    '--conditions=react-server',
    '--import',
    'tsx',
    'scripts/test-db-permissions.mjs',
  ]);
} finally {
  await requireCli(
    ['stop', '--project-id', 'resep-oma-kueh-policy-test', '--no-backup'],
    options,
  );
  if (normalSnapshot !== undefined) {
    await getLocalHarness();
    assert.equal(
      snapshot(),
      normalSnapshot,
      'normal DEMO/owner dataset must remain identical across isolated policy tests',
    );
    console.log(
      'PASS: normal bakery business/Storage snapshot preserved across isolated policy suite.',
    );
  }
}
