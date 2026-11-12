import { createHash, randomUUID } from 'node:crypto';

import { z } from 'zod';

const branch = z.strictObject({
  code: z.enum(['surabaya', 'bintaro']),
  name: z.string().min(1).max(200),
  city: z.string().min(1).max(200),
  whatsapp_number: z.string().regex(/^[1-9][0-9]{7,15}$/),
  address: z.string().min(1).max(10000).optional(),
});
export const reviewedSchema = z.strictObject({
  reviewedAt: z.literal('2026-11-11'),
  projectName: z.literal('resep-oma-kueh'),
  branches: z.array(branch).length(2),
  contacts: z.strictObject({
    email: z.email(),
    instagram_url: z.literal('https://www.instagram.com/resepoma.kueh/'),
  }),
});
export const referenceSnapshotSchema = z.strictObject({
  has_demo: z.boolean(),
  branches: z
    .array(
      z.strictObject({
        code: z.enum(['surabaya', 'bintaro']),
        name: z.string(),
        city: z.string(),
        whatsapp_number: z.string(),
        address: z.string().nullable(),
        updated_at: z.string().min(1),
      }),
    )
    .max(2),
  contacts: z
    .strictObject({
      key: z.literal('business.contacts'),
      content_json: z.record(z.string(), z.unknown()),
      updated_at: z.string().min(1),
    })
    .nullable(),
});
export function referencePlan(manifest, current, projectRef) {
  if (current.has_demo !== false)
    throw new Error(
      'Target contains DEMO/pending published data; production reference apply is blocked.',
    );
  const changes = [];
  for (const row of manifest.branches) {
    const before = current.branches.find((b) => b.code === row.code);
    if (!before)
      changes.push({
        table: 'branches',
        key: row.code,
        kind: 'insert',
        after: row,
      });
    else
      for (const [field, value] of Object.entries(row))
        if (field !== 'code' && before[field] !== value)
          changes.push({
            table: 'branches',
            key: row.code,
            kind: 'update',
            field,
            before,
            after: value,
          });
  }
  if (!current.contacts)
    changes.push({
      table: 'site_content',
      key: 'business.contacts',
      kind: 'insert',
      after: {
        key: 'business.contacts',
        content_json: manifest.contacts,
        status: 'published',
      },
    });
  else if (
    JSON.stringify(current.contacts.content_json) !==
    JSON.stringify(manifest.contacts)
  ) {
    // Normalize JSON key order: object order is not a business difference.
    if (
      Object.entries(manifest.contacts).some(
        ([k, v]) => current.contacts.content_json[k] !== v,
      )
    )
      changes.push({
        table: 'site_content',
        key: 'business.contacts',
        kind: 'update',
        field: 'content_json',
        before: current.contacts,
        after: manifest.contacts,
      });
  }
  const digest = createHash('sha256')
    .update(JSON.stringify({ projectRef, manifest, changes }))
    .digest('hex');
  return { changes, digest };
}
export function validateApply({
  projectRef,
  confirmedRef,
  digest,
  approvedDigest,
  fields = [],
}) {
  if (
    !/^[a-z0-9]{20}$/.test(projectRef) ||
    confirmedRef !== projectRef ||
    digest !== approvedDigest
  )
    throw new Error(
      'Apply requires matching explicit project confirmation and current dry-run digest.',
    );
  const allowed = [
    'branches.name',
    'branches.city',
    'branches.whatsapp_number',
    'branches.address',
    'site_content.content_json',
  ];
  if (fields.some((field) => !allowed.includes(field)))
    throw new Error('Update field is outside the owner-reviewed allowlist.');
}
export function referenceSql(plan, fields = []) {
  const q = (value) => "'" + String(value).replaceAll("'", "''") + "'";
  const statements = [];
  for (const item of plan.changes) {
    if (item.kind === 'insert') {
      const columns = Object.keys(item.after);
      statements.push(
        `insert into public.${item.table} (${columns.join(',')}) values (${Object.values(
          item.after,
        )
          .map((v) =>
            typeof v === 'object' ? q(JSON.stringify(v)) + '::jsonb' : q(v),
          )
          .join(',')}) on conflict do nothing;`,
      );
    }
  }
  // Same row may have multiple approved field edits; group them before assigning updated_at.
  const updates = new Map();
  const inserts = [];
  for (const item of plan.changes.filter(
    (c) => c.kind === 'update' && fields.includes(`${c.table}.${c.field}`),
  )) {
    const key = item.table + ':' + item.key;
    const group = updates.get(key) ?? { ...item, assignments: [] };
    group.assignments.push(
      `${item.field}=${typeof item.after === 'object' ? q(JSON.stringify(item.after)) + '::jsonb' : q(item.after)}`,
    );
    updates.set(key, group);
  }
  for (const statement of statements)
    if (statement.startsWith('insert')) inserts.push(statement);
  const all = [
    ...inserts,
    ...[...updates.values()].map(
      (item) =>
        `update public.${item.table} set ${item.assignments.join(',')} where ${item.table === 'branches' ? 'code' : 'key'}=${q(item.key)} and updated_at=${q(item.before.updated_at)}::timestamptz;`,
    ),
  ];
  const body = `declare affected integer; begin\n${all.map((statement) => statement + "\nget diagnostics affected = row_count; if affected <> 1 then raise exception 'reviewed data conflict; rollback'; end if;").join('\n')}\nend`;
  let delimiter;
  do {
    delimiter = '$reviewed_' + randomUUID().replaceAll('-', '') + '$';
  } while (body.includes(delimiter));
  return `do ${delimiter} ${body} ${delimiter};`;
}
