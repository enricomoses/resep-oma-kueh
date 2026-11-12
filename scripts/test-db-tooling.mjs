import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

import { repositoryRoot, runCli } from './db/cli.mjs';
import { generateTypes } from './db/generate-types.mjs';
import { getLocalHarness, snapshot, sql } from './db/local-harness.mjs';
import {
  referencePlan,
  referenceSnapshotSchema,
  referenceSql,
  validateApply,
} from './db/reference-plan.mjs';

await getLocalHarness();
const directory = new URL(
  `test-results/types-atomic-${randomUUID()}/`,
  repositoryRoot,
);
await mkdir(directory, { recursive: true });
const target = new URL('database.ts', directory);
const original = '// tipe lama — tetap utuh\n';
await writeFile(target, original, 'utf8');
await assert.rejects(
  generateTypes({
    destination: target,
    runner: () => runCli(['gen', 'types', '--lang', 'INVALID-LANGUAGE']),
  }),
);
assert.equal(
  await readFile(target, 'utf8'),
  original,
  'real CLI failure must preserve previous UTF-8 file',
);
assert.ok(
  (await readdir(directory)).every((name) => !name.endsWith('.tmp')),
  'failure must not leave a partial temporary file',
);
await generateTypes({ destination: target });
assert.match(await readFile(target, 'utf8'), /export type Database/);
assert.ok(
  (await readdir(directory)).every((name) => !name.endsWith('.tmp')),
  'success must rename the temporary file',
);
const manifest = JSON.parse(
  await readFile(
    new URL('supabase/seeds/production-reviewed.json', repositoryRoot),
    'utf8',
  ),
);
const projectRef = 'a'.repeat(20);
const plan = referencePlan(
  manifest,
  { branches: [], contacts: null, has_demo: false },
  projectRef,
);
assert.ok(
  referenceSnapshotSchema.safeParse({
    branches: [],
    contacts: null,
    has_demo: false,
  }).success,
  'valid empty reviewed target snapshot is accepted',
);
assert.ok(
  !referenceSnapshotSchema.safeParse({ branches: [], contacts: null }).success,
  'missing DEMO audit result blocks reference apply',
);
assert.throws(
  () => referencePlan(manifest, { branches: [], contacts: null }, projectRef),
  'missing DEMO verdict is never treated as production-safe',
);
assert.equal(
  plan.changes.length,
  3,
  'reviewed manifest only inserts two branches and contacts',
);
assert.throws(() =>
  referencePlan(
    manifest,
    { branches: [], contacts: null, has_demo: true },
    projectRef,
  ),
);
assert.throws(() =>
  validateApply({
    projectRef,
    confirmedRef: 'b'.repeat(20),
    digest: plan.digest,
    approvedDigest: plan.digest,
  }),
);
assert.throws(() =>
  validateApply({
    projectRef,
    confirmedRef: projectRef,
    digest: plan.digest,
    approvedDigest: 'bad',
  }),
);
assert.throws(() =>
  validateApply({
    projectRef,
    confirmedRef: projectRef,
    digest: plan.digest,
    approvedDigest: plan.digest,
    fields: ['products.base_price_idr'],
  }),
);
validateApply({
  projectRef,
  confirmedRef: projectRef,
  digest: plan.digest,
  approvedDigest: plan.digest,
});
assert.ok(
  !/delete|truncate|reset|seed\.sql/i.test(referenceSql(plan)),
  'reviewed reference SQL cannot reset/delete/apply DEMO seed',
);
const offline = spawnSync(process.execPath, ['scripts/seed-reference.mjs'], {
  encoding: 'utf8',
});
assert.ok(
  offline.status === 0 && offline.stdout.includes('OFFLINE DRY RUN'),
  'default must be offline dry-run without credentials',
);
const missing = spawnSync(
  process.execPath,
  ['scripts/seed-reference.mjs', '--apply'],
  { encoding: 'utf8' },
);
assert.equal(missing.status, 1, 'apply without explicit target cannot proceed');
const falseApply = spawnSync(
  process.execPath,
  ['scripts/seed-reference.mjs', '--apply=false'],
  { encoding: 'utf8' },
);
assert.equal(
  falseApply.status,
  1,
  'false-valued apply flag must never be interpreted as approval',
);
const saved = snapshot();
const timestamp = sql(
  "select updated_at from public.branches where code='surabaya';",
);
const changes = {
  changes: [
    {
      table: 'branches',
      key: 'surabaya',
      kind: 'update',
      field: 'name',
      before: { updated_at: timestamp },
      after: 'DEMO $$ maintenance test',
    },
    {
      table: 'branches',
      key: 'surabaya',
      kind: 'update',
      field: 'city',
      before: { updated_at: timestamp },
      after: 'DEMO city test',
    },
  ],
};
const updateSql = referenceSql(changes, ['branches.name', 'branches.city']);
const updated = sql(
  `begin; ${updateSql} select name='DEMO $$ maintenance test' and city='DEMO city test' from public.branches where code='surabaya'; rollback;`,
);
assert.equal(
  updated,
  't',
  'approved fields update together using one expectedUpdatedAt condition',
);
const stale = {
  changes: [
    { ...changes.changes[0], before: { updated_at: '2000-01-01T00:00:00Z' } },
  ],
};
assert.throws(
  () => sql(`begin; ${referenceSql(stale, ['branches.name'])} rollback;`),
  'stale approved plan must rollback',
);
assert.equal(
  snapshot(),
  saved,
  'reference SQL local rollback probes must leave owner data unchanged',
);
for (const script of [
  'scripts/db-local.mjs',
  'scripts/db-types-local.mjs',
  'scripts/test-db.mjs',
]) {
  const args = script.includes('db-local')
    ? [script, 'reset', '--remote=forbidden']
    : [script, '--remote=forbidden'];
  const guard = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(
    guard.status,
    1,
    'local command refuses remote/unknown flags before mutation',
  );
}
console.log(
  'PASS: real CLI generator failure preserved previous UTF-8 types, success atomic rename; offline reference target/digest/field/DEMO guards. Remote reads/apply NOT RUN.',
);
