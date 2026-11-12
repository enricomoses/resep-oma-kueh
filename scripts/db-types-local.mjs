import { repositoryRoot } from './db/cli.mjs';
import { generateTypes } from './db/generate-types.mjs';
import { getLocalHarness } from './db/local-harness.mjs';

if (
  process.argv.slice(2).some((flag) => flag !== '--check') ||
  process.env.BAKERY_DB_POLICY_TEST
)
  throw new Error(
    'Only local type generation (optional --check) is supported.',
  );
await getLocalHarness();
await generateTypes({
  destination: new URL('src/types/database.ts', repositoryRoot),
  check: process.argv.includes('--check'),
});
console.log(
  'Actual LOCAL schema types verified (UTF-8, replace only after generator exit 0).',
);
