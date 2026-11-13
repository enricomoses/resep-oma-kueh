import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import {
  businessTables,
  claimsSql,
  getLocalHarness,
  snapshot,
  sql,
} from './db/local-harness.mjs';

const local = await getLocalHarness();
const id = (n) => `f0300000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const api = `${local.url}/rest/v1/`;
const actors = { anon: local.anonKey };
const users = [];
const files = [];
let checks = 0;
function check(condition, label) {
  assert.ok(condition, label);
  checks++;
}
async function http(path, token, method = 'GET', body, extra = {}) {
  const response = await fetch(new URL(path, local.url), {
    method,
    headers: {
      apikey: local.anonKey,
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...extra,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  return { status: response.status, data };
}
async function rest(actor, path, method = 'GET', body) {
  return http(`${api}${path}`, actors[actor], method, body, {
    Prefer: 'return=representation',
  });
}
async function rows(actor, path, count, label) {
  const result = await rest(actor, path);
  check(
    result.status === 200 &&
      Array.isArray(result.data) &&
      result.data.length === count,
    label,
  );
  return result.data;
}
async function allowed(actor, path, method, body, label) {
  const result = await rest(actor, path, method, body);
  check(
    result.status >= 200 &&
      result.status < 300 &&
      Array.isArray(result.data) &&
      result.data.length === 1,
    label,
  );
}
async function denied(
  actor,
  path,
  method = 'GET',
  body,
  label = 'expected authorization denial',
) {
  const result = await rest(actor, path, method, body);
  check(
    [401, 403].includes(result.status) ||
      (method !== 'POST' &&
        result.status === 200 &&
        Array.isArray(result.data) &&
        result.data.length === 0),
    label,
  );
}
async function createActor(name, metadata = {}) {
  const email = `f03-${name}-${randomUUID()}@example.invalid`;
  const password = `F03!aA1${randomBytes(24).toString('base64url')}`;
  const created = await http(
    '/auth/v1/admin/users',
    local.serviceKey,
    'POST',
    { email, password, email_confirm: true, user_metadata: metadata },
    { apikey: local.serviceKey },
  );
  check(
    created.status === 200 && /^[0-9a-f-]{36}$/.test(created.data?.id),
    'local synthetic Auth identity created',
  );
  users.push(created.data.id);
  const login = await http(
    '/auth/v1/token?grant_type=password',
    local.anonKey,
    'POST',
    { email, password },
  );
  check(
    login.status === 200 && typeof login.data?.access_token === 'string',
    'actual password sign-in issued a JWT',
  );
  actors[name] = login.data.access_token;
  const verified = await http('/auth/v1/user', actors[name]);
  check(
    verified.status === 200 && verified.data?.id === created.data.id,
    'GoTrue validates issued user JWT',
  );
  return { id: created.data.id, email, password };
}
async function storage(
  actor,
  bucket,
  path,
  method = 'POST',
  contentType = 'image/png',
  bytes = png,
) {
  const response = await fetch(
    `${local.url}/storage/v1/object/${bucket}/${path}`,
    {
      method,
      headers: {
        apikey: local.anonKey,
        Authorization: `Bearer ${actors[actor]}`,
        'Content-Type': contentType,
      },
      body: bytes,
      signal: AbortSignal.timeout(15000),
    },
  );
  return response.status;
}
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
);
const empty = sql(
  `select (${businessTables.map((t) => `(select count(*) from public.${t})`).join('+')}) = 0;`,
);
check(
  empty === 't',
  'permission harness requires an empty local business fixture; no automatic reset',
);
const initial = snapshot();
let seeded = false;
try {
  const owner = await createActor('owner');
  const surabaya = await createActor('surabaya');
  const bintaro = await createActor('bintaro');
  await createActor('unprofiled', { role: 'owner', branch_id: id(1) });
  let fixture = await readFile(
    new URL('./db/permissions-fixture.sql', import.meta.url),
    'utf8',
  );
  for (const [key, value] of Object.entries({
    OWNER_UUID: owner.id,
    SURABAYA_UUID: surabaya.id,
    BINTARO_UUID: bintaro.id,
  })) {
    fixture = fixture.replaceAll(`$${key}$`, value);
  }
  sql(fixture);
  seeded = true;
  const settings = await http('/auth/v1/settings', local.anonKey);
  check(
    settings.status === 200 && settings.data?.disable_signup === true,
    'public signup is disabled in the live Auth service',
  );
  const signup = await http('/auth/v1/signup', local.anonKey, 'POST', {
    email: `f03-denied-${randomUUID()}@example.invalid`,
    password: `F03!${randomBytes(24).toString('hex')}`,
  });
  check(
    signup.status >= 400 && signup.status < 500,
    'public signup is rejected by live Auth',
  );

  const projections = [
    ['branches', 'id', 2],
    ['business_hours', 'id', 1],
    ['categories', 'id', 1],
    ['products', 'id', 4],
    ['product_variants', 'id', 4],
    ['product_images', 'id', 4],
    ['product_categories', 'product_id,category_id', 4],
    ['branch_variant_offers', 'branch_id,variant_id', 5],
    ['option_groups', 'id', 0],
    ['option_choices', 'id', 0],
    ['bundle_fixed_components', 'id', 0],
    ['dietary_tags', 'id', 1],
    ['allergens', 'id', 1],
    ['variant_dietary_tags', 'variant_id,dietary_tag_id', 1],
    ['variant_allergens', 'variant_id,allergen_id', 1],
    ['promotions', 'id', 4],
    ['promotion_branches', 'promotion_id,branch_id', 1],
    ['promotion_categories', 'promotion_id,category_id', 1],
    ['promotion_products', 'promotion_id,product_id', 1],
    ['promotion_variants', 'promotion_id,variant_id', 1],
    ['class_programs', 'id', 1],
    ['class_sessions', 'id', 2],
    ['testimonials', 'id,quote', 1],
    ['faqs', 'id', 1],
    ['site_content', 'key,content_json', 1],
  ];
  for (const [table, select, count] of projections)
    await rows(
      'anon',
      `${table}?select=${select}`,
      count,
      `anon public chain: ${table}`,
    );
  await denied('anon', 'admin_profiles?select=user_id');
  for (const [table, field] of [
    ['testimonials', 'consent_reference'],
    ['testimonials', 'consent_at'],
    ['variant_dietary_tags', 'note'],
    ['variant_allergens', 'source_note'],
    ['site_content', 'updated_by'],
  ]) {
    for (const actor of ['anon', 'surabaya', 'unprofiled', 'owner']) {
      await denied(
        actor,
        `${table}?select=${field}`,
        'GET',
        undefined,
        `direct private column denied: ${actor}/${table}/${field}`,
      );
    }
  }
  for (const table of [
    'testimonials',
    'variant_dietary_tags',
    'variant_allergens',
    'site_content',
  ]) {
    await denied(
      'anon',
      `${table}?select=*`,
      'GET',
      undefined,
      `wildcard cannot bypass ${table} column grants`,
    );
  }
  await rows(
    'owner',
    'products?select=id',
    7,
    'owner can read drafts and archive',
  );
  await rows(
    'surabaya',
    'products?select=id',
    4,
    'staff sees only public global catalog',
  );
  await rows(
    'unprofiled',
    'products?select=id&status=eq.draft',
    0,
    'forged user_metadata owner role has no authority',
  );
  await rows(
    'surabaya',
    'admin_profiles?select=user_id',
    1,
    'staff only reads own profile without recursion',
  );
  await rows(
    'owner',
    'admin_profiles?select=user_id',
    3,
    'owner reads profiles without recursion',
  );
  await rows(
    'unprofiled',
    'admin_profiles?select=user_id',
    0,
    'Auth user without profile gets no admin profile',
  );
  await rows(
    'surabaya',
    `branch_variant_offers?select=variant_id&branch_id=eq.${id(2)}&is_listed=eq.false`,
    0,
    'staff cannot read other branch unlisted offer',
  );
  await rows(
    'bintaro',
    `branch_variant_offers?select=variant_id&branch_id=eq.${id(2)}&is_listed=eq.false`,
    1,
    'staff reads own unlisted offer',
  );

  const rpcSnapshot = snapshot();
  const branchRpc = await rest('anon', 'rpc/read_active_branches', 'POST', {});
  check(
    branchRpc.status === 200 && branchRpc.data?.length === 2,
    'allowlisted invoker read RPC works with anon JWT',
  );
  check(
    snapshot() === rpcSnapshot,
    'read RPC leaves business/Storage snapshot unchanged',
  );
  const evidence = await rest(
    'owner',
    'rpc/read_owner_testimonial_evidence',
    'POST',
    { testimonial_uuid: id(90) },
  );
  check(
    evidence.status === 200 &&
      evidence.data?.[0]?.consent_reference === 'DEMO private consent',
    'owner-only fixed evidence RPC succeeds',
  );
  const variantEvidence = await rest(
    'owner',
    'rpc/read_owner_variant_evidence',
    'POST',
    { variant_uuid: id(30) },
  );
  check(
    variantEvidence.status === 200 &&
      variantEvidence.data?.dietary?.[0]?.note ===
        'DEMO private dietary evidence',
    'owner dietary/source evidence RPC succeeds',
  );
  const audit = await rest('owner', 'rpc/read_owner_content_audit', 'POST', {
    content_key: 'footer.note',
  });
  check(
    audit.status === 200 && audit.data?.[0]?.updated_by === owner.id,
    'owner CMS actor RPC succeeds',
  );

  // SQL uses exact claims from GoTrue-issued/validated JWTs, SET ROLE, and rollback.
  for (const [actor, isOwner, s, b] of [
    ['owner', true, true, true],
    ['surabaya', false, true, false],
    ['bintaro', false, false, true],
    ['unprofiled', false, false, false],
  ]) {
    const result = JSON.parse(
      claimsSql(
        actors[actor],
        `select jsonb_build_object('role',current_user,'owner',bakery_private.is_owner(),
      's',bakery_private.can_manage_branch('${id(1)}'),'b',bakery_private.can_manage_branch('${id(2)}'),
      'private',has_column_privilege(current_user,'public.testimonials','consent_reference','select'))`,
      ),
    );
    check(
      result.role === 'authenticated' &&
        result.owner === isOwner &&
        result.s === s &&
        result.b === b &&
        result.private === false,
      `real JWT role-context SQL: ${actor}`,
    );
  }
  const anonSql = JSON.parse(
    claimsSql(
      local.anonKey,
      "select jsonb_build_object('role',current_user,'drafts',(select count(*) from public.products where status='draft'),'writes',has_table_privilege(current_user,'public.products','insert'))",
    ),
  );
  check(
    anonSql.role === 'anon' && anonSql.drafts === 0 && anonSql.writes === false,
    'anon JWT role-context SQL denies drafts/write grants',
  );

  await allowed(
    'owner',
    `products?id=eq.${id(24)}&select=id`,
    'PATCH',
    { status: 'published', needs_owner_review: false },
    'owner publishes complete DEMO aggregate',
  );
  for (const table of [
    'option_groups',
    'option_choices',
    'bundle_fixed_components',
  ])
    await rows(
      'anon',
      `${table}?select=id`,
      2,
      `published bundle child visible: ${table}`,
    );
  await allowed(
    'owner',
    `products?id=eq.${id(24)}&select=id`,
    'PATCH',
    { status: 'draft', needs_owner_review: true },
    'owner returns aggregate to draft',
  );
  for (const table of [
    'option_groups',
    'option_choices',
    'bundle_fixed_components',
  ])
    await rows(
      'anon',
      `${table}?select=id`,
      0,
      `draft parent closes child access: ${table}`,
    );
  await allowed(
    'owner',
    `branches?id=eq.${id(2)}&select=id`,
    'PATCH',
    { is_active: false },
    'owner disables branch',
  );
  await rows(
    'anon',
    `branch_variant_offers?select=variant_id&branch_id=eq.${id(2)}`,
    0,
    'inactive branch closes offer access',
  );
  await rows(
    'anon',
    `class_sessions?select=id&branch_id=eq.${id(2)}`,
    0,
    'inactive branch closes session access',
  );
  await denied(
    'bintaro',
    `class_sessions?id=eq.${id(83)}&select=id`,
    'PATCH',
    { capacity: 11 },
    'inactive branch staff loses mutation rights',
  );
  await allowed(
    'owner',
    `branches?id=eq.${id(2)}&select=id`,
    'PATCH',
    { is_active: true },
    'owner reactivates branch',
  );
  await allowed(
    'owner',
    `branches?id=eq.${id(1)}&select=id`,
    'PATCH',
    { description: 'DEMO owner edit' },
    'owner edits branch',
  );
  await allowed(
    'owner',
    `business_hours?id=eq.${id(3)}&select=id`,
    'PATCH',
    { note: 'DEMO owner hours' },
    'owner edits hours',
  );
  await allowed(
    'owner',
    `site_content?key=eq.footer.note&select=key`,
    'PATCH',
    { content_json: { text: 'DEMO F03 note' } },
    'owner CMS check executes safely',
  );
  await allowed(
    'surabaya',
    `branch_variant_offers?branch_id=eq.${id(1)}&variant_id=eq.${id(30)}&select=branch_id`,
    'PATCH',
    { availability_status: 'sold_out', stock_quantity: 0 },
    'staff updates own availability while preserving existing override',
  );
  const preserved = await rows(
    'owner',
    `branch_variant_offers?branch_id=eq.${id(1)}&variant_id=eq.${id(30)}&select=price_override_idr`,
    1,
    'offer still exists',
  );
  check(
    preserved[0].price_override_idr === 1500,
    'staff availability update preserves owner price override',
  );
  await allowed(
    'bintaro',
    'branch_variant_offers?select=branch_id',
    'POST',
    { branch_id: id(2), variant_id: id(31), is_listed: true },
    'staff inserts own offer without override',
  );
  await allowed(
    'surabaya',
    'branch_variant_offers?select=branch_id',
    'POST',
    { branch_id: id(1), variant_id: id(37), is_listed: false },
    'staff can create own unlisted offer for active SKU of public parent',
  );
  for (const listed of [false, true, false, true, false]) {
    await allowed(
      'surabaya',
      `branch_variant_offers?branch_id=eq.${id(1)}&variant_id=eq.${id(37)}&select=branch_id`,
      'PATCH',
      { is_listed: listed },
      'staff can relist own hidden offer without global mutation rights',
    );
    await rows(
      'anon',
      `product_variants?select=id&id=eq.${id(37)}`,
      listed ? 1 : 0,
      'SKU public visibility follows its own listed offer',
    );
    await rows(
      'surabaya',
      `branch_variant_offers?select=variant_id&branch_id=eq.${id(1)}&variant_id=eq.${id(37)}`,
      1,
      'staff retains scoped access to own unlisted offer',
    );
  }
  await allowed(
    'surabaya',
    `class_sessions?id=eq.${id(82)}&select=id`,
    'PATCH',
    { capacity: 12, seats_left: 8 },
    'staff updates own class session',
  );
  for (const [actor, branch, n] of [
    ['surabaya', 1, 85],
    ['bintaro', 2, 86],
  ]) {
    await allowed(
      actor,
      'class_sessions?select=id',
      'POST',
      {
        id: id(n),
        program_id: id(80),
        branch_id: id(branch),
        starts_at: '2030-01-01T03:00:00Z',
        ends_at: '2030-01-01T04:00:00Z',
        capacity: 10,
        seats_left: 10,
      },
      'staff inserts own published-program session',
    );
  }

  // Actual SDK adapter still pins anonymous credentials after an owner sign-in.
  process.env.NEXT_PUBLIC_SUPABASE_URL = local.url;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = local.anonKey;
  const { createPublicReadClient, createChatReadClient } =
    await import('../src/lib/supabase/public-read.server.ts');
  const chat = createPublicReadClient();
  const chatAnon = createChatReadClient();
  const signedIn = await chat.auth.signInWithPassword({
    email: owner.email,
    password: owner.password,
  });
  check(
    !signedIn.error && signedIn.data.user?.id === owner.id,
    'test simulates an owner session on the real SDK client',
  );
  await chatAnon.auth.signInWithPassword({
    email: owner.email,
    password: owner.password,
  });
  const chatDrafts = await chat
    .from('products')
    .select('id')
    .eq('status', 'draft');
  check(
    !chatDrafts.error && chatDrafts.data?.length === 0,
    'real public read adapter ignores attached owner session for DB requests',
  );
  const chatAnonDrafts = await chatAnon
    .from('products')
    .select('id')
    .eq('status', 'draft');
  check(
    !chatAnonDrafts.error && chatAnonDrafts.data?.length === 0,
    'F22 dedicated createChatReadClient stays anon despite owner session',
  );
  for (const [bucket, isPublic] of [
    ['media-drafts', false],
    ['product-images', true],
    ['class-images', true],
    ['brand-assets', true],
  ]) {
    const path = isPublic
      ? `approved/${randomUUID()}.png`
      : `${owner.id}/drafts/${randomUUID()}.png`;
    const status = await storage('owner', bucket, path);
    check(
      status === 200,
      'owner uploads allowed MIME/path to controlled bucket',
    );
    files.push({ bucket, path });
    const download = await fetch(
      `${local.url}/storage/v1/object/public/${bucket}/${path}`,
      { signal: AbortSignal.timeout(15000) },
    );
    check(
      isPublic ? download.status === 200 : download.status >= 400,
      'public URL respects private/public bucket boundary',
    );
    await download.arrayBuffer();
  }
  const privateFile = files[0];
  const ownerPreview = await http(
    `/storage/v1/object/sign/${privateFile.bucket}/${privateFile.path}`,
    actors.owner,
    'POST',
    { expiresIn: 60 },
  );
  check(
    ownerPreview.status === 200 &&
      typeof ownerPreview.data?.signedURL === 'string',
    'owner obtains private signed preview',
  );
  check(
    ownerPreview.data.signedURL.startsWith('/object/sign/'),
    'signed preview remains on the verified local Storage service',
  );
  const signedPreview = await fetch(
    `${local.url}/storage/v1${ownerPreview.data.signedURL}`,
    { signal: AbortSignal.timeout(15000) },
  );
  check(
    signedPreview.status === 200 &&
      (await signedPreview.arrayBuffer()).byteLength === png.length,
    'private signed preview actually downloads the owner file',
  );
  // Revocation is read from DB, not stale JWT user_metadata.
  sql(
    `update public.admin_profiles set is_active=false where user_id='${owner.id}';`,
  );
  await denied(
    'owner',
    `branches?id=eq.${id(1)}&select=id`,
    'PATCH',
    { description: 'DEMO unauthorized' },
    'revoked owner JWT loses writes immediately',
  );
  await denied(
    'owner',
    'rpc/read_owner_testimonial_evidence',
    'POST',
    { testimonial_uuid: id(90) },
    'revoked owner loses evidence RPC immediately',
  );
  sql(
    `update public.admin_profiles set is_active=true where user_id='${owner.id}';`,
  );

  const beforeDenials = snapshot();
  for (const actor of ['anon', 'owner', 'surabaya', 'bintaro', 'unprofiled']) {
    const created = await http('/storage/v1/bucket', actors[actor], 'POST', {
      id: 'demo-f03-forbidden',
      name: 'demo-f03-forbidden',
      public: true,
    });
    check(created.status >= 400, `${actor}: runtime bucket creation denied`);
    const updated = await http(
      '/storage/v1/bucket/media-drafts',
      actors[actor],
      'PUT',
      { public: true },
    );
    check(
      updated.status >= 400 || snapshot() === beforeDenials,
      `${actor}: runtime cannot publish private bucket`,
    );
  }
  for (const actor of ['anon', 'surabaya', 'bintaro', 'unprofiled']) {
    const other = actor === 'bintaro' ? 1 : 2;
    await denied(
      actor,
      `branches?id=eq.${id(1)}&select=id`,
      'PATCH',
      { description: 'DEMO forbidden' },
      `${actor}: branch write denied`,
    );
    await denied(
      actor,
      `business_hours?id=eq.${id(3)}&select=id`,
      'PATCH',
      { note: 'DEMO forbidden' },
      `${actor}: hours write denied`,
    );
    await denied(
      actor,
      `products?id=eq.${id(20)}&select=id`,
      'PATCH',
      { name: 'DEMO forbidden' },
      `${actor}: global catalog write denied`,
    );
    await denied(
      actor,
      `admin_profiles?user_id=eq.${actor === 'surabaya' ? surabaya.id : actor === 'bintaro' ? bintaro.id : owner.id}`,
      'PATCH',
      { role: 'owner', branch_id: null },
      `${actor}: self role escalation denied`,
    );
    for (const [rpc, body] of [
      ['read_owner_testimonial_evidence', { testimonial_uuid: id(90) }],
      ['read_owner_variant_evidence', { variant_uuid: id(30) }],
      ['read_owner_content_audit', { content_key: 'footer.note' }],
    ]) {
      await denied(
        actor,
        `rpc/${rpc}`,
        'POST',
        body,
        `${actor}: private evidence RPC denied`,
      );
    }
    await denied(
      actor,
      `branch_variant_offers?branch_id=eq.${id(other)}&variant_id=eq.${id(30)}&select=branch_id`,
      'PATCH',
      { availability_status: 'unconfirmed', stock_quantity: null },
      `${actor}: cross-branch offer update denied`,
    );
    await denied(
      actor,
      `class_sessions?id=eq.${id(other === 1 ? 82 : 83)}&select=id`,
      'PATCH',
      { capacity: 15 },
      `${actor}: cross-branch class update denied`,
    );
    await denied(
      actor,
      `class_sessions?id=eq.${id(other === 1 ? 82 : 83)}&select=id`,
      'DELETE',
      undefined,
      `${actor}: cross-branch class delete denied`,
    );
    await denied(
      actor,
      'branch_variant_offers?select=branch_id',
      'POST',
      { branch_id: id(other), variant_id: id(33), price_override_idr: 500 },
      `${actor}: new override insert denied`,
    );
    const sign = await http(
      `/storage/v1/object/sign/${privateFile.bucket}/${privateFile.path}`,
      actors[actor],
      'POST',
      { expiresIn: 60 },
    );
    check(sign.status >= 400, `${actor}: private signed preview denied`);
    for (const bucket of [
      'media-drafts',
      'product-images',
      'class-images',
      'brand-assets',
    ]) {
      const badPath =
        bucket === 'media-drafts'
          ? `${owner.id}/drafts/${randomUUID()}.png`
          : `approved/${randomUUID()}.png`;
      const status = await storage(actor, bucket, badPath);
      check(status >= 400, `${actor}: Storage upload denied`);
    }
  }
  await denied(
    'owner',
    `admin_profiles?user_id=eq.${owner.id}`,
    'PATCH',
    { role: 'branch_admin', branch_id: id(1) },
    'owner cannot mutate runtime profiles either',
  );
  for (const [actor, branch, sessionId] of [
    ['surabaya', 1, 82],
    ['bintaro', 2, 83],
  ]) {
    for (const body of [
      { price_override_idr: 99 },
      { branch_id: id(branch === 1 ? 2 : 1) },
      { variant_id: id(31) },
      { created_at: '2000-01-01T00:00:00Z' },
    ]) {
      await denied(
        actor,
        `branch_variant_offers?branch_id=eq.${id(branch)}&variant_id=eq.${id(30)}&select=branch_id`,
        'PATCH',
        body,
        'staff offer protected fields denied',
      );
    }
    await denied(
      actor,
      'branch_variant_offers?select=branch_id',
      'POST',
      { branch_id: id(branch), variant_id: id(33), price_override_idr: 100 },
      'staff own-branch INSERT with override rejected by trigger',
    );
    for (const body of [
      { price_override_idr: 100 },
      { branch_id: id(branch === 1 ? 2 : 1) },
      { program_id: id(81) },
      { id: id(88) },
    ]) {
      await denied(
        actor,
        `class_sessions?id=eq.${id(sessionId)}&select=id`,
        'PATCH',
        body,
        'staff session protected fields denied',
      );
    }
    await denied(
      actor,
      'class_sessions?select=id',
      'POST',
      {
        id: id(87),
        program_id: id(81),
        branch_id: id(branch),
        starts_at: '2030-01-01T03:00:00Z',
        ends_at: '2030-01-01T04:00:00Z',
        capacity: 5,
      },
      'staff cannot publish draft class through a session',
    );
    await denied(
      actor,
      'class_sessions?select=id',
      'POST',
      {
        id: id(87),
        program_id: id(80),
        branch_id: id(branch),
        starts_at: '2030-01-01T03:00:00Z',
        ends_at: '2030-01-01T04:00:00Z',
        capacity: 5,
        price_override_idr: 100,
      },
      'staff cannot insert class price override',
    );
    await denied(
      actor,
      `branch_variant_offers?branch_id=eq.${id(branch)}&variant_id=eq.${id(30)}&select=branch_id`,
      'DELETE',
      undefined,
      'staff cannot hard-delete offer',
    );
  }
  for (const operation of [
    () =>
      chat.from('products').insert({
        id: id(99),
        name: 'DEMO forbidden',
        slug: 'demo-forbidden',
        product_type: 'simple',
      }),
    () =>
      chat.from('products').update({ name: 'DEMO forbidden' }).eq('id', id(20)),
    () => chat.from('products').delete().eq('id', id(25)),
    () =>
      chat.from('products').upsert({
        id: id(25),
        name: 'DEMO forbidden',
        slug: 'demo-f03-hidden',
        product_type: 'simple',
      }),
  ]) {
    const result = await operation();
    check(
      result.error?.code === '42501',
      'actual chat SDK insert/update/delete/upsert denied despite owner session',
    );
  }
  for (const operation of [
    () =>
      chat.storage
        .from('product-images')
        .upload(`approved/${randomUUID()}.png`, png, {
          contentType: 'image/png',
        }),
    () =>
      chat.storage
        .from('product-images')
        .upload(files[1].path, png, { contentType: 'image/png', upsert: true }),
    () =>
      chat.storage
        .from('product-images')
        .update(files[1].path, png, { contentType: 'image/png' }),
    () =>
      chat.storage.from('media-drafts').createSignedUrl(privateFile.path, 60),
  ]) {
    const result = await operation();
    check(
      Boolean(result.error),
      'actual chat SDK Storage upload/upsert/update/sign denied despite owner session',
    );
  }
  const chatDelete = await chat.storage
    .from('product-images')
    .remove([files[1].path]);
  check(
    Boolean(chatDelete.error) || chatDelete.data?.length === 0,
    'actual chat SDK Storage delete cannot remove approved file',
  );
  for (const rpc of [
    'lock_integrity',
    'validate_integrity',
    'enforce_staff_fields',
    'save_product_configuration',
  ]) {
    const result = await rest('anon', `rpc/${rpc}`, 'POST', {});
    check(result.status === 404, 'non-allowlisted/mutating RPC is not exposed');
  }
  const privateSchema = await http(
    '/rest/v1/admin_profiles?select=user_id',
    actors.anon,
    'GET',
    undefined,
    { 'Accept-Profile': 'bakery_private' },
  );
  check(
    privateSchema.status === 406 || privateSchema.status === 400,
    'private helper schema is not exposed',
  );
  for (const actor of ['anon', 'surabaya', 'unprofiled']) {
    const publicFile = files[1];
    const overwritten = await storage(
      actor,
      publicFile.bucket,
      publicFile.path,
      'PUT',
    );
    check(overwritten >= 400, 'non-owner cannot overwrite approved object');
    const removed = await http(
      `/storage/v1/object/${publicFile.bucket}`,
      actors[actor],
      'DELETE',
      { prefixes: [publicFile.path] },
    );
    check(
      removed.status >= 400 ||
        (removed.status === 200 &&
          Array.isArray(removed.data) &&
          removed.data.length === 0),
      'non-owner cannot delete approved object',
    );
  }
  check(
    (await storage(
      'owner',
      'media-drafts',
      `${owner.id}/drafts/${randomUUID()}.svg`,
      'POST',
      'image/svg+xml',
      Buffer.from('<svg/>'),
    )) >= 400,
    'bucket rejects SVG',
  );
  check(
    (await storage(
      'owner',
      'media-drafts',
      `${owner.id}/drafts/${randomUUID()}.png`,
      'POST',
      'image/png',
      Buffer.alloc(5242881),
    )) >= 400,
    'bucket rejects file larger than 5 MiB',
  );
  check(
    (await storage(
      'owner',
      'product-images',
      `unapproved/${randomUUID()}.png`,
    )) >= 400,
    'owner cannot upload outside approved public path',
  );
  for (const actor of ['anon', 'surabaya', 'bintaro']) {
    const rpcHours = await rest(actor, 'rpc/replace_branch_hours', 'POST', {
      p_branch_id: id(1),
      p_expected_branch_updated_at: '2026-01-01T00:00:00Z',
      p_hours: [],
    });
    check(
      [401, 403].includes(rpcHours.status),
      `${actor} cannot invoke replace_branch_hours RPC`,
    );
    const rpcOffer = await rest(
      actor,
      'rpc/owner_upsert_branch_offer',
      'POST',
      {
        p_branch_id: id(1),
        p_variant_id: id(30),
        p_expected_offer_updated_at: null,
        p_expected_variant_updated_at: null,
        p_update_base_price: true,
        p_base_price_idr: 99999,
        p_is_listed: true,
        p_availability_status: 'available',
        p_stock_quantity: null,
        p_price_override_idr: null,
      },
    );
    check(
      [401, 403].includes(rpcOffer.status),
      `${actor} cannot invoke owner_upsert_branch_offer RPC`,
    );
  }
  await denied(
    'surabaya',
    `product_variants?id=eq.${id(30)}&select=id`,
    'PATCH',
    { base_price_idr: 150000 },
    'staff cannot update base_price_idr on product_variants',
  );
  await denied(
    'bintaro',
    `branches?id=eq.${id(2)}&select=id`,
    'PATCH',
    { allow_pickup: true },
    'staff cannot toggle fulfillment or update branches',
  );
  for (const actor of ['anon', 'surabaya', 'bintaro']) {
    const rpcSavePromo = await rest(actor, 'rpc/save_admin_promotion', 'POST', {
      p_promotion_id: null,
      p_expected_updated_at: null,
      p_payload: {
        title: 'Bypass Promo',
        slug: 'bypass-promo',
        discountType: 'percentage',
        discountValue: 10,
        scope: 'all',
        startsAt: '2026-11-12T00:00:00Z',
        endsAt: '2026-11-20T00:00:00Z',
        status: 'published',
        isEnabled: true,
        isStackable: false,
      },
    });
    check(
      [401, 403].includes(rpcSavePromo.status),
      `${actor} cannot invoke save_admin_promotion RPC`,
    );
    const rpcArchivePromo = await rest(
      actor,
      'rpc/archive_admin_promotion',
      'POST',
      {
        p_promotion_id: id(40),
        p_expected_updated_at: '2026-01-01T00:00:00Z',
      },
    );
    check(
      [401, 403].includes(rpcArchivePromo.status),
      `${actor} cannot invoke archive_admin_promotion RPC`,
    );
  }
  await denied(
    'surabaya',
    'promotions?select=id',
    'POST',
    {
      title: 'Staff Promo',
      slug: 'staff-promo',
      discount_type: 'percentage',
      discount_value: 10,
      scope: 'all',
      starts_at: '2026-11-12T00:00:00Z',
      ends_at: '2026-11-20T00:00:00Z',
    },
    'staff cannot insert promotions via REST',
  );
  await denied(
    'bintaro',
    'site_content?select=key',
    'POST',
    {
      key: 'promo.shipping_banner',
      content_json: { title: 'Fake Banner', body: 'Gratis ongkir' },
      status: 'published',
    },
    'staff cannot write promo.shipping_banner to site_content via REST',
  );
  for (const actor of ['anon', 'surabaya', 'bintaro']) {
    await denied(
      actor,
      'faqs?select=id',
      'POST',
      {
        category: 'Umum',
        question: 'Q?',
        answer: 'A.',
        status: 'published',
      },
      `${actor} cannot insert faqs via REST`,
    );
    await denied(
      actor,
      'testimonials?select=id',
      'POST',
      {
        display_name: 'Anonim',
        quote: 'Enak',
        status: 'draft',
      },
      `${actor} cannot insert testimonials via REST`,
    );
    const rpcEv = await rest(
      actor,
      'rpc/read_owner_testimonial_evidence',
      'POST',
      {
        testimonial_uuid: id(90),
      },
    );
    check(
      [401, 403].includes(rpcEv.status),
      `${actor} cannot invoke read_owner_testimonial_evidence RPC`,
    );
  }
  await denied(
    'owner',
    'testimonials?select=id',
    'POST',
    {
      display_name: 'Pelanggan Resep Oma',
      quote: 'Tanpa izin publish harus ditolak',
      status: 'published',
      consent_at: null,
      consent_reference: null,
    },
    'owner cannot publish testimonial without consent_at and consent_reference',
  );
  const directTestimonialEvidenceSelect = await rest(
    'owner',
    'testimonials?select=id,consent_reference,consent_at',
  );
  check(
    directTestimonialEvidenceSelect.status >= 400,
    'direct REST select of testimonial consent evidence columns denied by column grants',
  );
  // F21 Baking Classes checks
  const anonDraftClass = await rest(
    'anon',
    `class_programs?id=eq.${id(81)}&select=id`,
  );
  check(
    anonDraftClass.status === 200 && anonDraftClass.data?.length === 0,
    'anon cannot read draft/unreviewed class program via direct REST',
  );
  await denied(
    'surabaya',
    'class_programs?select=id',
    'POST',
    {
      id: id(88),
      title: 'DEMO staff class denied',
      slug: 'demo-staff-class-denied',
      base_price_idr: 100000,
    },
    'staff cannot create class_programs',
  );
  await denied(
    'surabaya',
    `class_sessions?id=eq.${id(85)}&select=id`,
    'PATCH',
    { price_override_idr: 199000 },
    'staff cannot update price_override_idr on own class_session',
  );
  await denied(
    'surabaya',
    'class_sessions?select=id',
    'POST',
    {
      id: id(89),
      program_id: id(80),
      branch_id: id(2),
      starts_at: '2030-01-01T03:00:00Z',
      ends_at: '2030-01-01T04:00:00Z',
      capacity: 6,
    },
    'staff cannot create class_sessions for foreign branch',
  );
  await denied(
    'owner',
    'class_sessions?select=id',
    'POST',
    {
      id: id(89),
      program_id: id(80),
      branch_id: id(1),
      starts_at: '2030-01-01T03:00:00Z',
      ends_at: '2030-01-01T04:00:00Z',
      capacity: 6,
      seats_left: 0,
      status: 'scheduled',
      is_registration_open: true,
    },
    'owner cannot open class registration when seats_left is 0',
  );
  check(
    (await storage(
      'surabaya',
      'class-images',
      `approved/${randomUUID()}.png`,
    )) >= 400,
    'staff cannot upload directly to approved class-images bucket',
  );
  check(
    snapshot() === beforeDenials,
    'all expected denies leave complete business/Storage snapshot identical',
  );
  const chatRpc = await chat.rpc('read_active_branches');
  check(
    !chatRpc.error && chatRpc.data?.length === 2,
    'actual chat SDK can execute safe read-only RPC',
  );
  check(
    snapshot() === beforeDenials,
    'chat SELECT/RPC has no business side effects',
  );

  const chatAnonInsert = await chatAnon.from('products').insert({
    slug: 'f22-denied-product',
    name: 'Denied Product',
    product_type: 'unit',
    status: 'draft',
  });
  check(chatAnonInsert.error !== null, 'F22 chatAnon cannot insert products');

  const chatAnonUpdate = await chatAnon
    .from('products')
    .update({ name: 'Mutated Product' })
    .eq('slug', 'nastar-wisjman');
  check(chatAnonUpdate.error !== null, 'F22 chatAnon cannot update products');

  const chatAnonDelete = await chatAnon
    .from('products')
    .delete()
    .eq('slug', 'nastar-wisjman');
  check(chatAnonDelete.error !== null, 'F22 chatAnon cannot delete products');

  const chatAnonUpsert = await chatAnon.from('faqs').upsert({
    question: 'Injected FAQ',
    answer: 'No',
    category: 'Umum',
    is_published: true,
  });
  check(chatAnonUpsert.error !== null, 'F22 chatAnon cannot upsert faqs');

  const chatAnonPromoRpc = await chatAnon.rpc('save_admin_promotion', {});
  check(
    chatAnonPromoRpc.error !== null,
    'F22 chatAnon cannot call save_admin_promotion RPC',
  );

  const chatAnonConfigRpc = await chatAnon.rpc(
    'save_product_configuration',
    {},
  );
  check(
    chatAnonConfigRpc.error !== null,
    'F22 chatAnon cannot call save_product_configuration RPC',
  );

  const chatAnonStorage = await chatAnon.storage
    .from('product-images')
    .upload('f22-denied.txt', Buffer.from('denied'), {
      contentType: 'text/plain',
    });
  check(
    chatAnonStorage.error !== null,
    'F22 chatAnon cannot upload to product-images storage',
  );

  check(
    snapshot() === beforeDenials,
    'F22 chatAnon writes/RPC/Storage denied and snapshot unchanged',
  );
} finally {
  if (seeded && users[0])
    sql(
      `update public.admin_profiles set is_active=true where user_id='${users[0]}';`,
    );
  for (const file of files) {
    const removed = await http(
      `/storage/v1/object/${file.bucket}`,
      actors.owner,
      'DELETE',
      { prefixes: [file.path] },
    );
    assert.ok(
      removed.status === 200,
      'owner cleanup must remove only its synthetic Storage object',
    );
  }
  if (seeded) {
    const deleteOrder = [
      'promotion_branches',
      'promotion_categories',
      'promotion_products',
      'promotion_variants',
      'promotions',
      'variant_dietary_tags',
      'variant_allergens',
      'dietary_tags',
      'allergens',
      'option_choices',
      'option_groups',
      'bundle_fixed_components',
      'product_images',
      'product_categories',
      'branch_variant_offers',
      'product_variants',
      'products',
      'categories',
      'class_sessions',
      'class_programs',
      'business_hours',
      'testimonials',
      'faqs',
      'branches',
    ];
    const key = {
      promotion_branches: 'promotion_id',
      promotion_categories: 'promotion_id',
      promotion_products: 'promotion_id',
      promotion_variants: 'promotion_id',
      variant_dietary_tags: 'variant_id',
      variant_allergens: 'variant_id',
      product_categories: 'product_id',
      branch_variant_offers: 'variant_id',
    };
    sql(`begin; delete from public.site_content where key in ('footer.note','home.story','promo.shipping_banner');
      delete from public.admin_profiles where user_id in (${users.map((u) => `'${u}'`).join(',')});
      ${deleteOrder.map((t) => `delete from public.${t} where ${key[t] ?? 'id'}::text like 'f0300000-%';`).join('\n')} commit;`);
  }
  for (const userId of users) {
    const removed = await http(
      `/auth/v1/admin/users/${userId}`,
      local.serviceKey,
      'DELETE',
      undefined,
      { apikey: local.serviceKey },
    );
    assert.ok(
      removed.status === 200,
      'synthetic Auth identity cleanup must succeed',
    );
  }
  check(
    snapshot() === initial,
    'fixture cleanup restores original empty business/Storage snapshot',
  );
}
console.log(
  `PASS: ${checks} local JWT/REST/SQL/Storage/SDK permission checks; expected-deny snapshot unchanged; fixture cleanup restored original snapshot.`,
);
