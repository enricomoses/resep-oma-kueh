import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { repositoryRoot } from './db/cli.mjs';
import { getLocalHarness, snapshot, sql } from './db/local-harness.mjs';

await getLocalHarness();
assert.ok(
  sql('select dataset_kind from bakery_private.seed_state where id;') ===
    'local-demo',
  'seed regression only accepts LOCAL DEMO dataset',
);
const seed = await readFile(
  new URL('supabase/seed.sql', repositoryRoot),
  'utf8',
);
assert.ok(
  !/\b(create|alter|drop|grant|revoke|truncate)\b/i.test(
    seed.replace(/^--.*$/gm, ''),
  ),
  'seed must remain data-only',
);
const before = snapshot();
sql(seed);
sql(seed);
assert.equal(
  snapshot(),
  before,
  'running seed twice must not duplicate or overwrite existing data/timestamps',
);
// Owner edit preservation tested inside a rollback transaction, not by rewriting owner data.
sql(`begin; update public.products set name='DEMO owner-edited name' where slug='demo-roti';
  ${seed.replace(/^begin;$/m, '').replace(/^commit;$/m, '')}
  do $$ begin if not exists(select 1 from public.products where slug='demo-roti' and name='DEMO owner-edited name') then raise exception 'seed overwrote owner edit'; end if; end $$;
  rollback;`);
assert.equal(
  snapshot(),
  before,
  'owner-edit preservation probe must rollback exactly',
);
console.log(
  'PASS: seed twice has identical business/Storage snapshot; owner edit preserved; no data/schema changes outside the fixture.',
);
