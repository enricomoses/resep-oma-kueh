import { readFile } from 'node:fs/promises';

import { repositoryRoot, requireCli } from './db/cli.mjs';
import { uploadDemoAssets } from './db/local-data.mjs';
import { businessTables, getLocalHarness, sql } from './db/local-harness.mjs';

const [action, ...flags] = process.argv.slice(2);
let demoReady = true;
if (
  !['start', 'reset'].includes(action) ||
  flags.length ||
  process.env.BAKERY_DB_POLICY_TEST
)
  throw new Error(
    'Only bakery local start/reset without extra flags is allowed.',
  );
if (action === 'start') {
  console.log('Starting bakery LOCAL stack; credential output withheld.');
  await requireCli([
    'start',
    '--exclude',
    'realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor',
  ]);
  await getLocalHarness();
  await requireCli(['migration', 'up']);
  demoReady =
    sql(
      `select exists(select 1 from bakery_private.seed_state) or (${businessTables.map((table) => `(select count(*) from public.${table})`).join('+')}=0);`,
    ) === 't';
  if (demoReady)
    sql(await readFile(new URL('supabase/seed.sql', repositoryRoot), 'utf8'));
} else {
  await getLocalHarness();
  console.log(
    'RESET LOCAL ONLY 127.0.0.1:54322: deletes all bakery local database data and reapplies migrations + DEMO seed. No hosted target.',
  );
  await requireCli(['db', 'reset']);
}
if (demoReady) {
  await uploadDemoAssets();
  console.log('Bakery LOCAL data ready; DEMO is not a production catalog.');
} else
  console.log(
    'Existing non-DEMO local data preserved; no DEMO seed inserted. Reset remains an explicit separate command.',
  );
