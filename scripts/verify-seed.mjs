import assert from 'node:assert/strict';

import { demoAssetPath, demoPng } from './db/demo-asset.mjs';
import { getLocalHarness, sql } from './db/local-harness.mjs';

if (process.argv.length > 2)
  throw new Error(
    'Seed verification is LOCAL and read-only; no extra target flags.',
  );
const local = await getLocalHarness();
const state = JSON.parse(
  sql(`select jsonb_build_object(
  'marker',(select dataset_kind from bakery_private.seed_state where id),
  'clock',(select reference_date='2026-11-11T00:00:00+07:00' from bakery_private.seed_state where id),
  'branches',(select count(*) from public.branches),
  'contacts',(select count(*) from public.branches where (code='surabaya' and whatsapp_number='6281703384308' and address='Rungkut Asri Tengah V No. 22, Surabaya') or (code='bintaro' and whatsapp_number='6285119785194' and address is null)),
  'maps_hours',(select count(*)=0 from public.business_hours) and (select bool_and(maps_url is null) from public.branches),
  'categories',(select count(*) from public.categories),
  'series',(select count(*) from public.categories where status='draft' and slug not like 'demo-%'),
  'products',(select count(*) from public.products),
  'historical',(select count(*) from public.products where slug like 'reference-%' and status='draft' and needs_owner_review),
  'demo',(select count(*) from public.products where slug like 'demo-%' and status='published' and not needs_owner_review and name like 'DEMO%'),
  'variants',(select count(*) from public.product_variants),
  'prices',(select array_agg(base_price_idr order by base_price_idr) from public.product_variants where sku in ('DEMO-F04-0','DEMO-F04-1','DEMO-F04-2')),
  'override',(select price_override_idr=16000 and availability_status='unconfirmed' from public.branch_variant_offers o join public.branches b on b.id=o.branch_id join public.product_variants v on v.id=o.variant_id where b.code='bintaro' and v.sku='DEMO-F04-0'),
  'soldout',(select stock_quantity=0 and availability_status='sold_out' from public.branch_variant_offers o join public.branches b on b.id=o.branch_id join public.product_variants v on v.id=o.variant_id where b.code='surabaya' and v.sku='DEMO-F04-0'),
  'bundles',(select count(*) from public.product_variants where sku in ('DEMO-F04-5','DEMO-F04-6') and bundle_units_total=12 and bundle_rules_verified),
  'groups',(select count(*) from public.option_groups where min_select=1 and max_select=1 and quantity_per_selection=3),
  'fixed',(select sum(quantity) from public.bundle_fixed_components),
  'gf',(select count(*) from public.variant_dietary_tags where verification_status='verified' and note like 'SYNTHETIC DEMO%'),
  'consent',(select count(*)=4 and bool_and(status='draft' and rating is null and consent_at is null and consent_reference is null) from public.testimonials),
  'profiles',(select count(*) from public.admin_profiles),
  'expired',(select ends_at<'2026-11-11T00:00:00+07:00' from public.promotions where slug='demo-expired'),
  'current',(select starts_at<='2026-11-11T00:00:00+07:00' and ends_at>'2026-11-11T00:00:00+07:00' from public.promotions where slug='demo-current'),
  'future',(select starts_at>'2026-11-11T00:00:00+07:00' from public.promotions where slug='demo-future'),
  'sessions',(select count(*) from public.class_sessions where starts_at>'2026-11-11T00:00:00+07:00' and status='scheduled' and is_registration_open and seats_left>0),
  'fk',(select count(*)=0 from pg_constraint where contype='f' and connamespace='public'::regnamespace and not convalidated)
);`),
);
const expected = {
  marker: 'local-demo',
  clock: true,
  branches: 2,
  contacts: 2,
  maps_hours: true,
  categories: 26,
  series: 13,
  products: 21,
  historical: 13,
  demo: 8,
  variants: 25,
  prices: [15000, 70000, 140000],
  override: true,
  soldout: true,
  bundles: 2,
  groups: 4,
  fixed: 12,
  gf: 5,
  consent: true,
  profiles: 0,
  expired: true,
  current: true,
  future: true,
  sessions: 1,
  fk: true,
};
assert.deepEqual(
  state,
  expected,
  'LOCAL seed counts/integrity/reference clock drift',
);
async function read(table, select) {
  const response = await fetch(
    `${local.url}/rest/v1/${table}?select=${select}`,
    {
      headers: {
        apikey: local.anonKey,
        Authorization: `Bearer ${local.anonKey}`,
      },
      signal: AbortSignal.timeout(15000),
    },
  );
  assert.ok(response.status === 200, 'anon public sample query failed');
  return response.json();
}
const products = await read('products', 'id,name,slug');
assert.ok(
  products.length === 8 &&
    products.every(
      (p) => p.name.startsWith('DEMO') && p.slug.startsWith('demo-'),
    ),
  'public query must expose only marked DEMO products',
);
assert.ok(
  (await read('product_variants', 'id')).length === 16,
  'public multi-SKU sample drift',
);
assert.ok(
  (await read('testimonials', 'id,quote')).length === 0,
  'historical unconsented quotes leaked',
);
const livePromos = await read('promotions', 'id,slug');
assert.equal(
  livePromos.length,
  Number(
    sql(
      "select count(*) from public.promotions where status='published' and is_enabled and starts_at<=now() and now()<ends_at;",
    ),
  ),
  'live promo count must match actual server clock, not the fixed test clock',
);
assert.ok(
  livePromos.every((p) => p.slug !== 'demo-expired'),
  'expired fixture leaked through actual RLS',
);
const before = sql('select count(*) from public.products;');
const denied = await fetch(`${local.url}/rest/v1/products`, {
  method: 'POST',
  headers: {
    apikey: local.anonKey,
    Authorization: `Bearer ${local.anonKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'DEMO forbidden',
    slug: 'demo-forbidden',
    product_type: 'simple',
  }),
});
assert.ok(
  denied.status === 401 || denied.status === 403,
  'seed must not grant anon writes',
);
assert.ok(
  sql('select count(*) from public.products;') === before,
  'anonymous negative probe changed seed',
);
for (const bucket of ['product-images', 'class-images', 'brand-assets']) {
  const response = await fetch(
    `${local.url}/storage/v1/object/public/${bucket}/${demoAssetPath}`,
  );
  assert.ok(
    response.ok && Buffer.from(await response.arrayBuffer()).equals(demoPng()),
    'DEMO asset is missing or unexpectedly overwritten',
  );
}
console.log(
  'PASS: LOCAL seed counts, IDR/FK/12-slice/GF/branch/time/privacy assertions and actual anon sample queries; technical DEMO assets verified. Fixed clock 2026-11-11T00:00:00+07:00; live eligibility never rewinds server time.',
);
