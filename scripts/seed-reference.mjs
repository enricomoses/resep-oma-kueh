import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import {
  referencePlan,
  referenceSnapshotSchema,
  referenceSql,
  reviewedSchema,
  validateApply,
} from './db/reference-plan.mjs';

const flags = {};
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const [key, inline] = args[i].split('=');
  if (['--apply', '--dry-run'].includes(key) && inline !== undefined)
    throw new Error(
      'Boolean apply/dry-run flags must be bare flags, never inline values.',
    );
  if (
    ![
      '--apply',
      '--dry-run',
      '--project-ref',
      '--confirm-project-ref',
      '--approve-digest',
      '--update-fields',
    ].includes(key) ||
    key in flags
  )
    throw new Error('Unknown/duplicate reference flag.');
  flags[key] = ['--apply', '--dry-run'].includes(key)
    ? true
    : (inline ?? args[++i]);
}
if (flags['--apply'] && flags['--dry-run'])
  throw new Error('Choose apply or dry-run.');
const parsed = reviewedSchema.safeParse(
  JSON.parse(
    await readFile(
      new URL('../supabase/seeds/production-reviewed.json', import.meta.url),
      'utf8',
    ),
  ),
);
if (!parsed.success)
  throw new Error('Reviewed manifest schema invalid; values withheld.');
const manifest = parsed.data;
const ref = flags['--project-ref'];
if (!ref) {
  if (flags['--apply'])
    throw new Error(
      'Apply requires an explicit hosted project and reviewed dry-run digest.',
    );
  console.log(
    'OFFLINE DRY RUN: reviewed manifest has two confirmed branches and contacts only. No product/price/stock/promo/class/fulfillment claim. No network request or mutation.',
  );
} else {
  if (!/^[a-z0-9]{20}$/.test(ref))
    throw new Error('Invalid explicit project ref.');
  if (
    flags['--apply'] &&
    (flags['--confirm-project-ref'] !== ref ||
      !/^([a-f0-9]{64})$/.test(flags['--approve-digest'] ?? ''))
  )
    throw new Error(
      'Apply requires explicit project confirmation and a reviewed digest before connecting.',
    );
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token)
    throw new Error(
      'Maintenance token must be configured outside application env; no remote request made.',
    );
  async function management(path, body) {
    const response = await fetch('https://api.supabase.com/v1/' + path, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(
        `Management request failed (${response.status}); response/credential withheld.`,
      );
    return response.json();
  }
  const projects = await management('projects');
  if (
    !Array.isArray(projects) ||
    !projects.some(
      (p) => (p.id === ref || p.ref === ref) && p.name === manifest.projectName,
    )
  )
    throw new Error('Hosted target name/ref mismatch.');
  const query = `select jsonb_build_object('branches',(select coalesce(jsonb_agg(jsonb_build_object('code',b.code,'name',b.name,'city',b.city,'whatsapp_number',b.whatsapp_number,'address',b.address,'updated_at',b.updated_at) order by b.code),'[]') from public.branches b),
    'contacts',(select jsonb_build_object('key',c.key,'content_json',c.content_json,'updated_at',c.updated_at) from public.site_content c where key='business.contacts'),
    'has_demo',exists(select 1 from bakery_private.seed_state) or exists(select 1 from public.products where slug like 'demo-%' or name like 'DEMO%' or (status='published' and needs_owner_review))) as snapshot;`;
  const result = await management(`projects/${ref}/database/query`, {
    query,
    read_only: true,
  });
  const parsedSnapshot = referenceSnapshotSchema.safeParse(
    Array.isArray(result) ? result[0]?.snapshot : undefined,
  );
  if (!parsedSnapshot.success)
    throw new Error('Unexpected hosted snapshot; apply blocked.');
  const current = parsedSnapshot.data;
  const plan = referencePlan(manifest, current, ref);
  const reviewDirectory = new URL(
    '../test-results/reference-review/',
    import.meta.url,
  );
  await mkdir(reviewDirectory, { recursive: true });
  const reviewFile = new URL(`plan-${ref}.json`, reviewDirectory);
  await writeFile(
    reviewFile,
    JSON.stringify(
      { projectRef: ref, projectName: manifest.projectName, ...plan },
      null,
      2,
    ) + '\n',
    { encoding: 'utf8', mode: 0o600 },
  );
  console.log(
    `Private, Git-ignored before/after review file: ${fileURLToPath(reviewFile)} (no credentials/admin evidence).`,
  );
  console.log(
    JSON.stringify({
      mode: flags['--apply'] ? 'EXPLICIT APPLY' : 'DRY RUN',
      digest: plan.digest,
      changes: plan.changes.map((c) => ({
        table: c.table,
        key: c.key,
        kind: c.kind,
        field: c.field ?? 'insert missing',
      })),
    }),
  );
  if (flags['--apply']) {
    const fields = flags['--update-fields']
      ? flags['--update-fields'].split(',')
      : [];
    validateApply({
      projectRef: ref,
      confirmedRef: flags['--confirm-project-ref'],
      digest: plan.digest,
      approvedDigest: flags['--approve-digest'],
      fields,
    });
    if (
      plan.changes.some(
        (c) => c.kind === 'insert' || fields.includes(`${c.table}.${c.field}`),
      )
    )
      await management(`projects/${ref}/database/query`, {
        query: referenceSql(plan, fields),
        read_only: false,
      });
    console.log(
      'Reviewed insert-missing/explicitly allowlisted updates finished; other owner edits left unchanged.',
    );
  }
}
