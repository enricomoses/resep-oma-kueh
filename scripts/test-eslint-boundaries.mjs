import { ESLint } from 'eslint';
import assert from 'node:assert/strict';
const jobs = [];
const it = (name, run) => jobs.push({ name, run });
it.each = (cases) => (name, run) =>
  cases.forEach((args) => it(name, () => run(...args)));
const expect = (actual) => ({
  toBe: (expected) => assert.equal(actual, expected),
});

const eslint = new ESLint();

it.each([
  ['src/components/fixture.tsx', "import {load} from '@/services';"],
  ['src/app/page.tsx', "import {load} from '@/services';"],
  ['src/app/page.tsx', "import {requestApi} from '@/lib/axios';"],
  ['src/app/page.tsx', "fetch('/api/fixture');"],
  [
    'src/services/fixture.service.ts',
    "import {createBrowserAuthClient} from '@/lib/supabase/client';",
  ],
  ['src/hooks/use-fixture.ts', "import '@/config/environment.server';"],
  [
    'src/constants/fixture.constant.ts',
    "import '@/config/environment.server';",
  ],
  ['src/app/page.tsx', "import {createClient} from '@supabase/supabase-js';"],
  ['src/components/fixture.tsx', "import {requestApi} from '@/lib/axios';"],
  ['src/components/fixture.tsx', "import {requestApi} from '../lib/axios';"],
  ['src/hooks/use-fixture.ts', "import axios from 'axios';"],
  ['src/hooks/use-fixture.ts', "import {useFixture} from '@/hooks';"],
  [
    'src/services/fixture.service.ts',
    "import {createClient} from '@supabase/supabase-js';",
  ],
  ['src/config/index.ts', "export * from './environment.server';"],
  [
    'src/components/fixture.tsx',
    "'use client'; import '@/config/environment.server';",
  ],
  ['src/components/fixture.tsx', "import('@/lib/axios');"],
  ['src/components/fixture.tsx', "fetch('/api/fixture');"],
])('rejects forbidden imports/calls in %s', async (filePath, code) => {
  const [result] = await eslint.lintText(code, { filePath });
  expect(
    result.messages.some((message) => message.ruleId === 'bakery/boundaries'),
  ).toBe(true);
});

it('permits a service to use the shared transport and enforces type-only imports', async () => {
  const [allowed] = await eslint.lintText(
    "import {requestApi} from '@/lib/axios'; export {requestApi};",
    { filePath: 'src/services/fixture.service.ts' },
  );
  expect(allowed.errorCount).toBe(0);
  const [types] = await eslint.lintText(
    "import {ApiSuccess} from '@/types'; export type Fixture = ApiSuccess<string>;",
    { filePath: 'src/services/fixture.service.ts' },
  );
  expect(
    types.messages.some(
      (message) =>
        message.ruleId === '@typescript-eslint/consistent-type-imports',
    ),
  ).toBe(true);
});

for (const job of jobs) await job.run();
console.log(
  `PASS: ${jobs.length} ESLint boundary/type-import cases against the actual config.`,
);
