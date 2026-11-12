import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const isolated = process.env.BAKERY_DB_POLICY_TEST === '1';
if (process.env.BAKERY_DB_POLICY_TEST && !isolated)
  throw new Error('Invalid isolated-test selector.');
const projectId = isolated ? 'resep-oma-kueh-policy-test' : 'resep-oma-kueh';
const container = 'supabase_db_' + projectId;
const apiPort = isolated ? '55321' : '54321';
const dbPort = isolated ? '55322' : '54322';
export const businessTables = [
  'branches',
  'business_hours',
  'admin_profiles',
  'categories',
  'products',
  'product_categories',
  'product_variants',
  'product_images',
  'branch_variant_offers',
  'option_groups',
  'option_choices',
  'bundle_fixed_components',
  'dietary_tags',
  'variant_dietary_tags',
  'allergens',
  'variant_allergens',
  'promotions',
  'promotion_branches',
  'promotion_categories',
  'promotion_products',
  'promotion_variants',
  'class_programs',
  'class_sessions',
  'testimonials',
  'faqs',
  'site_content',
];
export async function getLocalHarness() {
  const root = new URL('../../', import.meta.url);
  const workdir = isolated
    ? new URL('test-results/f04-policy-stack/', root)
    : root;
  const config = await readFile(
    new URL('supabase/config.toml', workdir),
    'utf8',
  );
  assert.ok(
    config.split(/\r?\n/).includes('project_id = "' + projectId + '"'),
    'only the bakery project is allowed',
  );
  let inspected;
  let status;
  try {
    inspected = JSON.parse(
      execFileSync('docker', ['inspect', container], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
    status = JSON.parse(
      execFileSync(
        process.execPath,
        [
          fileURLToPath(
            new URL('node_modules/supabase/dist/supabase.js', root),
          ),
          '--workdir',
          fileURLToPath(workdir),
          'status',
          '--output',
          'json',
        ],
        {
          cwd: fileURLToPath(root),
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      ),
    );
  } catch {
    throw new Error(
      'Local bakery container/status unavailable; credential-bearing tool output withheld.',
    );
  }
  assert.ok(
    inspected[0].State.Running && inspected[0].Name === `/${container}`,
    'verified local container required',
  );
  for (const [value, port] of [
    [status.API_URL, apiPort],
    [status.DB_URL, dbPort],
  ]) {
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error('Invalid local target URL; value withheld.');
    }
    assert.ok(
      ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) &&
        url.port === port,
      'loopback bakery ports required',
    );
  }
  assert.ok(
    status.ANON_KEY && status.SERVICE_ROLE_KEY,
    'local test credentials unavailable',
  );
  assert.ok(
    inspected[0].HostConfig.PortBindings['5432/tcp'].some(
      (binding) => binding.HostPort === dbPort,
    ),
    'verified bakery DB port required',
  );
  return {
    container,
    url: status.API_URL,
    anonKey: status.ANON_KEY,
    serviceKey: status.SERVICE_ROLE_KEY,
  };
}
export function sql(statement) {
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      container,
      'psql',
      '-X',
      '-qAt',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-v',
      'VERBOSITY=sqlstate',
    ],
    {
      input: statement,
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  // Never print SQL, stderr, JWT claims, or result data on failure.
  assert.ok(
    result.status === 0,
    'local fixture/audit SQL failed (details withheld)',
  );
  return result.stdout.trim();
}
export function snapshot() {
  const tables = [
    ...businessTables.map((name) => `public.${name}`),
    'storage.objects',
    'storage.buckets',
  ];
  const projection = tables
    .map(
      (table) =>
        `'${table}',(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from ${table} t)`,
    )
    .join(',');
  return createHash('sha256')
    .update(sql(`select jsonb_build_object(${projection});`))
    .digest('hex');
}
export function claimsSql(accessToken, statement) {
  const claims = JSON.parse(
    Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'),
  );
  assert.ok(
    claims.role === 'anon' ||
      (claims.role === 'authenticated' && /^[0-9a-f-]{36}$/.test(claims.sub)),
    'verified local JWT context required',
  );
  // Tokens are issued and checked through local GoTrue before this role-context SQL.
  // SQL cannot verify a JWT signature: direct REST tests remain the cryptographic proof.
  const payload = JSON.stringify(claims).replaceAll("'", "''");
  return sql(
    `begin; set local role ${claims.role}; select set_config('request.jwt.claims','${payload}',true) is not null; ${statement}; rollback;`,
  )
    .split('\n')
    .slice(1)
    .join('\n');
}
