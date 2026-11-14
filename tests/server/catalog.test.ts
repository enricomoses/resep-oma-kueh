import { afterEach, expect, it, vi } from 'vitest';
import { GET as getCatalogRoute } from '@/app/api/catalog/route';
import { GET as getCategoriesRoute } from '@/app/api/categories/route';
import { getCatalog, getCategories } from '@/features/catalog/service.server';

const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const BINTARO_ID = 'f0400000-0000-4000-8000-000000000002';
const CAT_CHIFFON_ID = 'f0400000-0000-4000-8000-000000000200';
const CAT_BREAD_ID = 'f0400000-0000-4000-8000-000000000208';
const PROD_COFFEE_ID = 'f0400000-0000-4000-8000-000000000400';
const PROD_ROK_ID = 'f0400000-0000-4000-8000-000000000401';
const PROD_MIX_ID = 'f0400000-0000-4000-8000-000000000402';
const PROD_BREAD_ID = 'f0400000-0000-4000-8000-000000000407';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function createDefaultFixtures() {
  const branches = [
    {
      id: SURABAYA_ID,
      code: 'surabaya',
      name: 'Surabaya',
      city: 'Surabaya',
      whatsapp_number: '6281703384308',
      address: 'Rungkut Asri Tengah V No. 22, Surabaya',
      maps_url: null,
      is_active: true,
      sort_order: 1,
    },
    {
      id: BINTARO_ID,
      code: 'bintaro',
      name: 'Bintaro',
      city: 'Bintaro',
      whatsapp_number: '6285119785194',
      address: null,
      maps_url: null,
      is_active: true,
      sort_order: 2,
    },
  ];

  const categories = [
    {
      id: CAT_CHIFFON_ID,
      name: 'DEMO — Chiffon Series',
      slug: 'demo-chiffon-series',
      description: 'Data sintetis lokal.',
      sort_order: 0,
      status: 'published',
    },
    {
      id: CAT_BREAD_ID,
      name: 'DEMO — Bread Series',
      slug: 'demo-bread-series',
      description: 'Data sintetis lokal.',
      sort_order: 8,
      status: 'published',
    },
  ];

  const products = [
    {
      id: PROD_COFFEE_ID,
      name: 'DEMO — Café Crème Coffee Chiffon',
      slug: 'demo-coffee',
      short_description: null,
      description: 'SYNTHETIC DEMO lokal dengan aksen café crème.',
      product_type: 'variants',
      is_featured: true,
      is_best_seller: true,
      is_new: false,
      status: 'published',
      sort_order: 0,
      created_at: '2026-11-10T08:00:00+07:00',
      product_categories: [
        {
          category_id: CAT_CHIFFON_ID,
          is_primary: true,
          categories: {
            id: CAT_CHIFFON_ID,
            name: 'DEMO — Chiffon Series',
            slug: 'demo-chiffon-series',
            status: 'published',
          },
        },
      ],
      product_images: [
        {
          alt_text: 'DEMO — ilustrasi placeholder Coffee',
          is_primary: true,
          sort_order: 0,
        },
      ],
      product_variants: [
        {
          id: 'f0400000-0000-4000-8000-000000000600',
          sku: 'DEMO-F04-0',
          name: 'DEMO Slice',
          size_label: 'Slice',
          base_price_idr: 15_000,
          status: 'active',
          sort_order: 0,
          is_default: true,
          branch_variant_offers: [
            {
              branch_id: SURABAYA_ID,
              is_listed: true,
              availability_status: 'sold_out',
              stock_quantity: 0,
              price_override_idr: null,
            },
            {
              branch_id: BINTARO_ID,
              is_listed: true,
              availability_status: 'unconfirmed',
              stock_quantity: 3,
              price_override_idr: 16_000,
            },
          ],
          option_groups: [],
          variant_dietary_tags: [
            {
              dietary_tag_id: 'f0400000-0000-4000-8000-000000000902',
              verification_status: 'pending',
              verified_at: null,
              dietary_tags: {
                id: 'f0400000-0000-4000-8000-000000000902',
                slug: 'egg-free',
                name: 'Egg-Free',
              },
            },
          ],
        },
        {
          id: 'f0400000-0000-4000-8000-000000000601',
          sku: 'DEMO-F04-1',
          name: 'DEMO Mini 14 cm',
          size_label: 'Mini 14 cm',
          base_price_idr: 70_000,
          status: 'active',
          sort_order: 1,
          is_default: false,
          branch_variant_offers: [
            {
              branch_id: SURABAYA_ID,
              is_listed: true,
              availability_status: 'available',
              stock_quantity: 4,
              price_override_idr: null,
            },
            {
              branch_id: BINTARO_ID,
              is_listed: true,
              availability_status: 'available',
              stock_quantity: 4,
              price_override_idr: null,
            },
          ],
          option_groups: [],
          variant_dietary_tags: [],
        },
      ],
    },
    {
      id: PROD_ROK_ID,
      name: 'DEMO — ROK Chiffon',
      slug: 'demo-rok',
      short_description: null,
      description: 'SYNTHETIC DEMO lokal.',
      product_type: 'variants',
      is_featured: true,
      is_best_seller: false,
      is_new: false,
      status: 'published',
      sort_order: 0,
      created_at: '2026-11-11T08:00:00+07:00',
      product_categories: [
        {
          category_id: CAT_CHIFFON_ID,
          is_primary: true,
          categories: {
            id: CAT_CHIFFON_ID,
            name: 'DEMO — Chiffon Series',
            slug: 'demo-chiffon-series',
            status: 'published',
          },
        },
      ],
      product_images: [
        {
          alt_text: 'DEMO — ilustrasi placeholder ROK',
          is_primary: true,
          sort_order: 0,
        },
      ],
      product_variants: [
        {
          id: 'f0400000-0000-4000-8000-000000000603',
          sku: 'DEMO-F04-3',
          name: 'DEMO Slice',
          size_label: 'Slice',
          base_price_idr: 25_000,
          status: 'active',
          sort_order: 0,
          is_default: true,
          branch_variant_offers: [
            {
              branch_id: SURABAYA_ID,
              is_listed: true,
              availability_status: 'available',
              stock_quantity: 5,
              price_override_idr: null,
            },
            {
              branch_id: BINTARO_ID,
              is_listed: false,
              availability_status: 'available',
              stock_quantity: 5,
              price_override_idr: null,
            },
          ],
          option_groups: [],
          variant_dietary_tags: [],
        },
      ],
    },
    {
      id: PROD_MIX_ID,
      name: 'DEMO — Chiffon 12 Slices Mix',
      slug: 'demo-mix',
      short_description: null,
      description: 'SYNTHETIC DEMO bundle.',
      product_type: 'bundle',
      is_featured: true,
      is_best_seller: false,
      is_new: true,
      status: 'published',
      sort_order: 2,
      created_at: '2026-11-12T08:00:00+07:00',
      product_categories: [
        {
          category_id: CAT_CHIFFON_ID,
          is_primary: true,
          categories: {
            id: CAT_CHIFFON_ID,
            name: 'DEMO — Chiffon Series',
            slug: 'demo-chiffon-series',
            status: 'published',
          },
        },
      ],
      product_images: [
        {
          alt_text: 'DEMO — ilustrasi placeholder Mix',
          is_primary: true,
          sort_order: 0,
        },
      ],
      product_variants: [
        {
          id: 'f0400000-0000-4000-8000-000000000606',
          sku: 'DEMO-F04-6',
          name: 'DEMO GF 12 Slices',
          size_label: '12 slices GF',
          base_price_idr: 190_000,
          status: 'active',
          sort_order: 1,
          is_default: true,
          branch_variant_offers: [
            {
              branch_id: SURABAYA_ID,
              is_listed: true,
              availability_status: 'available',
              stock_quantity: 2,
              price_override_idr: null,
            },
            {
              branch_id: BINTARO_ID,
              is_listed: true,
              availability_status: 'available',
              stock_quantity: 2,
              price_override_idr: null,
            },
          ],
          option_groups: [
            {
              id: 'f0400000-0000-4000-8000-000000000802',
              name: 'DEMO GF Group 1',
              min_select: 1,
              max_select: 1,
              quantity_per_selection: 3,
              is_required: true,
              sort_order: 0,
              option_choices: [
                {
                  id: 'f0400000-0000-4000-8000-000000000812',
                  label: 'Cheese GF x3',
                  price_delta_idr: 2_000,
                  is_active: true,
                  sort_order: 0,
                },
              ],
            },
          ],
          variant_dietary_tags: [
            {
              dietary_tag_id: 'f0400000-0000-4000-8000-000000000900',
              verification_status: 'verified',
              verified_at: '2026-11-11T00:00:00+07:00',
              dietary_tags: {
                id: 'f0400000-0000-4000-8000-000000000900',
                slug: 'gluten-free',
                name: 'Gluten-Free',
              },
            },
          ],
        },
      ],
    },
    {
      id: PROD_BREAD_ID,
      name: 'DEMO — Roti Sobek',
      slug: 'demo-roti',
      short_description: null,
      description: 'SYNTHETIC DEMO bread.',
      product_type: 'simple',
      is_featured: false,
      is_best_seller: false,
      is_new: false,
      status: 'published',
      sort_order: 7,
      created_at: '2026-11-09T08:00:00+07:00',
      product_categories: [
        {
          category_id: CAT_BREAD_ID,
          is_primary: true,
          categories: {
            id: CAT_BREAD_ID,
            name: 'DEMO — Bread Series',
            slug: 'demo-bread-series',
            status: 'published',
          },
        },
      ],
      product_images: [
        {
          alt_text: 'DEMO — ilustrasi placeholder Bread',
          is_primary: true,
          sort_order: 0,
        },
      ],
      product_variants: [
        {
          id: 'f0400000-0000-4000-8000-000000000615',
          sku: 'DEMO-F04-15',
          name: 'DEMO Piece',
          size_label: 'Piece',
          base_price_idr: 15_000,
          status: 'active',
          sort_order: 0,
          is_default: true,
          branch_variant_offers: [
            {
              branch_id: SURABAYA_ID,
              is_listed: true,
              availability_status: 'available',
              stock_quantity: 5,
              price_override_idr: null,
            },
            {
              branch_id: BINTARO_ID,
              is_listed: true,
              availability_status: 'available',
              stock_quantity: 5,
              price_override_idr: null,
            },
          ],
          option_groups: [],
          variant_dietary_tags: [],
        },
      ],
    },
  ];

  const promotions = [
    {
      id: 'f0400000-0000-4000-8000-000000000931',
      title: 'DEMO — current at reference clock',
      slug: 'demo-current',
      description: 'Promo Bintaro Coffee Chiffon',
      discount_type: 'fixed',
      discount_value: 2_000,
      min_spend_idr: 0,
      max_discount_idr: 5_000,
      scope: 'product',
      starts_at: '2026-11-10T00:00:00+07:00',
      ends_at: '2026-11-18T00:00:00+07:00',
      status: 'published',
      is_enabled: true,
      is_stackable: false,
      priority: 1,
      promotion_branches: [{ branch_id: BINTARO_ID }],
      promotion_categories: [],
      promotion_products: [{ product_id: PROD_COFFEE_ID }],
      promotion_variants: [],
    },
  ];

  return { branches, categories, products, promotions };
}

function stubSupabaseRest(
  customResponder?: (
    table: string,
    url: URL,
  ) => { status?: number; body: unknown } | null,
) {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_synthetic_fixture_key',
  );
  const fixtures = createDefaultFixtures();
  const fetchMock = vi.fn<typeof globalThis.fetch>(async (input) => {
    const url = new URL(String(input));
    const table = url.pathname.split('/').pop() ?? '';
    const custom = customResponder?.(table, url);
    if (custom) {
      return new Response(JSON.stringify(custom.body), {
        status: custom.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (table === 'branches') return Response.json(fixtures.branches);
    if (table === 'categories') return Response.json(fixtures.categories);
    if (table === 'products') return Response.json(fixtures.products);
    if (table === 'promotions') return Response.json(fixtures.promotions);
    return Response.json([]);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

it('projects only allowed public columns without restricted evidence fields and returns null prices when no branch is selected', async () => {
  const fetchMock = stubSupabaseRest();
  const categories = await getCategories();
  expect(categories.items).toHaveLength(2);

  const catalog = await getCatalog(
    {},
    { now: new Date('2026-11-12T10:00:00+07:00') },
  );
  expect(catalog.resolvedBranchId).toBeNull();
  expect(catalog.total).toBe(4);
  expect(catalog.items.every((item) => item.fromPriceIdr === null)).toBe(true);

  const selectsByTable = Object.fromEntries(
    fetchMock.mock.calls.map(([input]) => {
      const url = new URL(String(input));
      return [
        url.pathname.split('/').pop(),
        url.searchParams.get('select') ?? '',
      ];
    }),
  );
  expect(selectsByTable.products).not.toContain('note');
  expect(selectsByTable.products).not.toContain('source_note');

  // Pending dietary tag egg-free on Coffee Chiffon is never exposed
  const coffee = catalog.items.find((item) => item.slug === 'demo-coffee');
  expect(coffee?.verifiedDietaryTags).toEqual([]);

  // Verified dietary tag gluten-free on Mix is exposed
  const mix = catalog.items.find((item) => item.slug === 'demo-mix');
  expect(mix?.verifiedDietaryTags).toEqual([
    { slug: 'gluten-free', name: 'Gluten-Free' },
  ]);
});

it('computes branch price override, required option delta, unconditional promo, and filters not-offered SKUs per branch', async () => {
  stubSupabaseRest();
  const refNow = new Date('2026-11-12T10:00:00+07:00');

  // Surabaya: Coffee Slice (15k, sold_out) & Mini (70k, available) -> fromPrice 15k; Mix (190k + 2k option delta = 192k); ROK offered (25k)
  const surabaya = await getCatalog({ branch: 'surabaya' }, { now: refNow });
  expect(surabaya.resolvedBranchId).toBe(SURABAYA_ID);
  expect(surabaya.total).toBe(4);
  const sbyCoffee = surabaya.items.find((i) => i.slug === 'demo-coffee');
  expect(sbyCoffee?.fromPriceIdr).toBe(15_000);
  expect(sbyCoffee?.availabilityStatus).toBe('available');
  const sbyMix = surabaya.items.find((i) => i.slug === 'demo-mix');
  expect(sbyMix?.fromPriceIdr).toBe(192_000);

  // Bintaro: ROK Chiffon has is_listed=false so it is excluded; Coffee Slice has override 16k - 2k unconditional promo = 14k!
  const bintaro = await getCatalog({ branch: 'bintaro' }, { now: refNow });
  expect(bintaro.resolvedBranchId).toBe(BINTARO_ID);
  expect(bintaro.items.map((i) => i.slug)).not.toContain('demo-rok');
  const btrCoffee = bintaro.items.find((i) => i.slug === 'demo-coffee');
  expect(btrCoffee?.baseFromPriceIdr).toBe(16_000);
  expect(btrCoffee?.fromPriceIdr).toBe(14_000);
  expect(btrCoffee?.appliedPromotion?.slug).toBe('demo-current');
});

it('filters by availability, verified dietary tag, min/max price, and sorts with deterministic tie-breakers before pagination', async () => {
  stubSupabaseRest();
  const refNow = new Date('2026-11-12T10:00:00+07:00');

  // In Surabaya, filtering availability=sold_out matches Coffee Chiffon via its sold_out Slice (15k)
  const soldOutSby = await getCatalog(
    { branch: 'surabaya', availability: 'sold_out' },
    { now: refNow },
  );
  expect(soldOutSby.items.map((i) => i.slug)).toEqual(['demo-coffee']);
  expect(soldOutSby.items[0].availabilityStatus).toBe('sold_out');
  expect(soldOutSby.items[0].fromPriceIdr).toBe(15_000);

  // In Surabaya, filtering availability=available on Coffee Chiffon excludes the 15k sold_out Slice, so Coffee's eligible fromPrice becomes 70k (Mini)!
  const availableSby = await getCatalog(
    { branch: 'surabaya', availability: 'available' },
    { now: refNow },
  );
  const availCoffee = availableSby.items.find((i) => i.slug === 'demo-coffee');
  expect(availCoffee?.fromPriceIdr).toBe(70_000);

  // Filter by verified tag gluten-free -> only demo-mix; pending tag egg-free -> empty
  const gfResult = await getCatalog(
    { branch: 'surabaya', tag: 'gluten-free' },
    { now: refNow },
  );
  expect(gfResult.items.map((i) => i.slug)).toEqual(['demo-mix']);

  const pendingTagResult = await getCatalog(
    { branch: 'surabaya', tag: 'egg-free' },
    { now: refNow },
  );
  expect(pendingTagResult.items).toEqual([]);

  // Price tie-break in Surabaya: demo-coffee (15k) and demo-roti (15k) tie on price_asc -> sorted by name ASC then id ASC
  const priceAsc = await getCatalog(
    { branch: 'surabaya', sort: 'price_asc', maxPriceIdr: 30_000 },
    { now: refNow },
  );
  expect(priceAsc.items.map((i) => i.slug)).toEqual([
    'demo-coffee',
    'demo-roti',
    'demo-rok',
  ]);

  // Pagination: limit=2, page=2 returns the remaining items; out-of-range page=99 returns HTTP 200 with empty items
  const page2 = await getCatalog(
    { branch: 'surabaya', sort: 'featured', limit: 2, page: 2 },
    { now: refNow },
  );
  expect(page2.total).toBe(4);
  expect(page2.totalPages).toBe(2);
  expect(page2.items.map((i) => i.slug)).toEqual(['demo-mix', 'demo-roti']);

  const pageOut = await getCatalog(
    { branch: 'surabaya', limit: 2, page: 99 },
    { now: refNow },
  );
  expect(pageOut.total).toBe(4);
  expect(pageOut.items).toEqual([]);
});

it('normalizes accents, punctuation, and PostgREST metacharacters safely in literal search without raw .or interpolation', async () => {
  const fetchMock = stubSupabaseRest();
  const result = await getCatalog({
    q: 'cafe, creme! (DEMO-F04-0) %',
  });
  expect(result.items.map((i) => i.slug)).toEqual(['demo-coffee']);

  for (const [input] of fetchMock.mock.calls) {
    const url = new URL(String(input));
    expect(url.searchParams.has('or')).toBe(false);
  }
});

it('enforces BFF route handler HTTP 200/400/503 contracts and Cache-Control: no-store', async () => {
  stubSupabaseRest();

  const catRes = await getCategoriesRoute(
    new Request('http://localhost:3000/api/categories'),
  );
  expect(catRes.status).toBe(200);
  expect(catRes.headers.get('Cache-Control')).toBe('no-store');

  const badCatRes = await getCategoriesRoute(
    new Request('http://localhost:3000/api/categories?unexpected=1'),
  );
  expect(badCatRes.status).toBe(400);

  // Invalid limit > 24 or minPriceIdr > maxPriceIdr -> 400 INVALID_REQUEST
  const badLimitRes = await getCatalogRoute(
    new Request('http://localhost:3000/api/catalog?limit=99'),
  );
  expect(badLimitRes.status).toBe(400);

  const badPriceRangeRes = await getCatalogRoute(
    new Request(
      'http://localhost:3000/api/catalog?branch=surabaya&minPriceIdr=50000&maxPriceIdr=10000',
    ),
  );
  expect(badPriceRangeRes.status).toBe(400);

  const duplicateParamRes = await getCatalogRoute(
    new Request(
      'http://localhost:3000/api/catalog?branch=surabaya&branch=bintaro',
    ),
  );
  expect(duplicateParamRes.status).toBe(400);

  // Empty search match -> 200 with empty items, not 404/500
  const emptyRes = await getCatalogRoute(
    new Request('http://localhost:3000/api/catalog?q=tidak-ada-menu-ini'),
  );
  expect(emptyRes.status).toBe(200);
  const emptyBody = await emptyRes.json();
  expect(emptyBody.ok).toBe(true);
  expect(emptyBody.data.items).toEqual([]);

  // Upstream DB failure -> 503 UPSTREAM_ERROR
  stubSupabaseRest((table) => {
    if (table === 'products') {
      return { status: 503, body: { message: 'database unavailable' } };
    }
    return null;
  });

  const errorRes = await getCatalogRoute(
    new Request('http://localhost:3000/api/catalog?branch=surabaya'),
  );
  expect(errorRes.status).toBe(503);
  const errorBody = await errorRes.json();
  expect(errorBody.ok).toBe(false);
  expect(errorBody.error.code).toBe('UPSTREAM_ERROR');
});

it('resolves approved previewImageUrl, hides unapproved media, and excludes needs_owner_review products in getCatalog', async () => {
  const defaults = createDefaultFixtures();
  const baseProduct = defaults.products[0];
  stubSupabaseRest((table) => {
    if (table !== 'products') return null;
    return {
      body: [
        {
          ...baseProduct,
          needs_owner_review: false,
          product_images: [
            {
              alt_text: 'Draft photo must not appear',
              is_primary: true,
              sort_order: 0,
              is_approved: false,
              storage_bucket: 'product-images',
              storage_path: 'draft/hidden.webp',
            },
            {
              alt_text: 'Approved Coffee Chiffon Photo',
              is_primary: false,
              sort_order: 1,
              is_approved: true,
              storage_bucket: 'product-images',
              storage_path: 'approved/coffee-card.webp',
            },
          ],
        },
        {
          ...baseProduct,
          id: 'f0400000-0000-4000-8000-000000000498',
          slug: 'demo-unreviewed-catalog',
          name: 'DEMO — Unreviewed Catalog Item',
          needs_owner_review: true,
          product_images: [],
        },
      ],
    };
  });

  const result = await getCatalog({ branch: 'surabaya' });
  expect(result.items).toHaveLength(1);
  expect(result.items[0]?.slug).toBe(baseProduct.slug);
  expect(result.items[0]?.imageAlt).toBe('Approved Coffee Chiffon Photo');
  expect(result.items[0]?.previewImageUrl).toContain(
    '/storage/v1/object/public/product-images/approved/coffee-card.webp',
  );
});
