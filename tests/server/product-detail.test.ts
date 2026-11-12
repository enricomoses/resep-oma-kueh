import { afterEach, expect, it, vi } from 'vitest';
import { GET as getProductDetailRoute } from '@/app/api/products/[slug]/route';
import { getProductDetail } from '@/features/catalog/service.server';

const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const BINTARO_ID = 'f0400000-0000-4000-8000-000000000002';
const CAT_CHIFFON_ID = 'f0400000-0000-4000-8000-000000000200';
const CAT_BREAD_ID = 'f0400000-0000-4000-8000-000000000208';
const PROD_COFFEE_ID = 'f0400000-0000-4000-8000-000000000400';
const PROD_BREAD_ID = 'f0400000-0000-4000-8000-000000000407';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function createDetailFixtures() {
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

  const coffeeProduct = {
    id: PROD_COFFEE_ID,
    name: 'DEMO — Coffee Chiffon',
    slug: 'demo-coffee',
    short_description: 'Chiffon klasik aroma kopi.',
    description: 'SYNTHETIC DEMO lokal. Komposisi dan klaim hanya pengujian.',
    ingredients_info: 'Tepung beras, telur, kopi robusta, gula tebu.',
    storage_instructions: 'Simpan di kulkas maksimal 3 hari.',
    product_type: 'variants',
    is_featured: true,
    is_best_seller: true,
    is_new: false,
    status: 'published',
    needs_owner_review: false,
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
        id: 'f0400000-0000-4000-8000-000000000500',
        variant_id: null,
        storage_bucket: 'product-images',
        storage_path: 'synthetic/demo-coffee.png',
        alt_text: 'DEMO — foto utama Coffee Chiffon',
        is_approved: true,
        is_primary: true,
        sort_order: 0,
      },
      {
        id: 'f0400000-0000-4000-8000-000000000501',
        variant_id: 'f0400000-0000-4000-8000-000000000600',
        storage_bucket: 'product-images',
        storage_path: 'synthetic/demo-coffee-slice.png',
        alt_text: 'DEMO — foto ukuran Slice',
        is_approved: true,
        is_primary: false,
        sort_order: 1,
      },
    ],
    product_variants: [
      {
        id: 'f0400000-0000-4000-8000-000000000600',
        sku: 'DEMO-COFFEE-SLICE',
        name: 'Coffee Chiffon Slice',
        size_label: 'Slice',
        base_price_idr: 15_000,
        status: 'active',
        sort_order: 0,
        is_default: true,
        max_quantity_per_order: 20,
        bundle_recipe: null,
        bundle_units_total: null,
        bundle_rules_verified: false,
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
            stock_quantity: 4,
            price_override_idr: 16_000,
          },
        ],
        option_groups: [],
        bundle_fixed_components: [],
        variant_dietary_tags: [
          {
            dietary_tag_id: 'f0400000-0000-4000-8000-000000000900',
            verification_status: 'verified',
            verified_at: '2026-11-10T10:00:00+07:00',
            dietary_tags: {
              id: 'f0400000-0000-4000-8000-000000000900',
              slug: 'gluten-free',
              name: 'Gluten-Free',
            },
          },
        ],
        variant_allergens: [
          {
            allergen_id: 'f0400000-0000-4000-8000-000000000910',
            presence: 'contains',
            verified_at: '2026-11-10T10:00:00+07:00',
            allergens: {
              id: 'f0400000-0000-4000-8000-000000000910',
              slug: 'egg',
              name: 'Telur',
            },
          },
        ],
      },
      {
        id: 'f0400000-0000-4000-8000-000000000601',
        sku: 'DEMO-COFFEE-MINI',
        name: 'Coffee Chiffon Mini 14cm',
        size_label: 'Mini 14cm',
        base_price_idr: 70_000,
        status: 'active',
        sort_order: 1,
        is_default: false,
        max_quantity_per_order: 10,
        bundle_recipe: null,
        bundle_units_total: null,
        bundle_rules_verified: false,
        branch_variant_offers: [
          {
            branch_id: SURABAYA_ID,
            is_listed: true,
            availability_status: 'available',
            stock_quantity: 8,
            price_override_idr: null,
          },
        ],
        option_groups: [],
        bundle_fixed_components: [],
        variant_dietary_tags: [],
        variant_allergens: [],
      },
      {
        id: 'f0400000-0000-4000-8000-000000000602',
        sku: 'DEMO-COFFEE-WHOLE',
        name: 'Coffee Chiffon Whole 20cm',
        size_label: 'Whole 20cm',
        base_price_idr: 140_000,
        status: 'archived', // archived variant should NOT be in activeVariants
        sort_order: 2,
        is_default: false,
        max_quantity_per_order: 5,
        bundle_recipe: null,
        bundle_units_total: null,
        bundle_rules_verified: false,
        branch_variant_offers: [
          {
            branch_id: SURABAYA_ID,
            is_listed: true,
            availability_status: 'available',
            stock_quantity: 5,
            price_override_idr: null,
          },
        ],
        option_groups: [],
        bundle_fixed_components: [],
        variant_dietary_tags: [],
        variant_allergens: [],
      },
    ],
  };

  const breadProduct = {
    id: PROD_BREAD_ID,
    name: 'DEMO — Roti Isi Cheese',
    slug: 'demo-bread-cheese',
    short_description: 'Roti isi keju lembut.',
    description: 'SYNTHETIC DEMO single SKU roti.',
    ingredients_info: 'Tepung terigu, keju cheddar, ragi, mentega.',
    storage_instructions: 'Suhu ruang 2 hari.',
    product_type: 'simple',
    is_featured: false,
    is_best_seller: false,
    is_new: true,
    status: 'published',
    needs_owner_review: false,
    sort_order: 7,
    created_at: '2026-11-12T08:00:00+07:00',
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
        id: 'f0400000-0000-4000-8000-000000000510',
        variant_id: null,
        storage_bucket: 'product-images',
        storage_path: 'synthetic/demo-bread.png',
        alt_text: 'DEMO — Roti Isi Cheese',
        is_approved: true,
        is_primary: true,
        sort_order: 0,
      },
    ],
    product_variants: [
      {
        id: 'f0400000-0000-4000-8000-000000000620',
        sku: 'DEMO-BREAD-CHEESE',
        name: 'Roti Isi Cheese Piece',
        size_label: 'Piece',
        base_price_idr: 10_000,
        status: 'active',
        sort_order: 0,
        is_default: true,
        max_quantity_per_order: 30,
        bundle_recipe: null,
        bundle_units_total: null,
        bundle_rules_verified: false,
        branch_variant_offers: [
          {
            branch_id: SURABAYA_ID,
            is_listed: true,
            availability_status: 'available',
            stock_quantity: 15,
            price_override_idr: null,
          },
        ],
        option_groups: [],
        bundle_fixed_components: [],
        variant_dietary_tags: [],
        variant_allergens: [],
      },
    ],
  };

  const mixProduct = {
    id: 'f0400000-0000-4000-8000-000000000402',
    name: 'DEMO — Chiffon Slice Mix',
    slug: 'demo-mix',
    short_description: 'Paket 12 slices dengan 4 varian rasa.',
    description: 'SYNTHETIC DEMO bundle 12 potong.',
    ingredients_info: 'Tepung terigu, telur, susu, keju, cokelat.',
    storage_instructions: 'Suhu ruang 3 hari.',
    product_type: 'bundle',
    is_featured: true,
    is_best_seller: true,
    is_new: false,
    status: 'published',
    needs_owner_review: false,
    sort_order: 5,
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
        id: 'f0400000-0000-4000-8000-000000000520',
        variant_id: null,
        storage_bucket: 'product-images',
        storage_path: 'synthetic/demo-mix.png',
        alt_text: 'DEMO — Chiffon Slice Mix',
        is_approved: true,
        is_primary: true,
        sort_order: 0,
      },
    ],
    product_variants: [
      {
        id: 'f0400000-0000-4000-8000-000000000605',
        sku: 'DEMO-F04-5',
        name: 'DEMO — Regular pack 12 slices',
        size_label: 'Pack 12 slices',
        base_price_idr: 180_000,
        status: 'active',
        sort_order: 0,
        is_default: true,
        max_quantity_per_order: 10,
        bundle_recipe: 'chiffon_mix',
        bundle_units_total: 12,
        bundle_rules_verified: true,
        branch_variant_offers: [
          {
            branch_id: SURABAYA_ID,
            is_listed: true,
            availability_status: 'available',
            stock_quantity: null,
            price_override_idr: null,
          },
        ],
        bundle_fixed_components: [
          {
            id: 'f0400000-0000-4000-8000-000000000820',
            component_slot: 'cheese',
            component_variant_id: 'f0400000-0000-4000-8000-000000000607',
            quantity: 3,
            sort_order: 0,
          },
          {
            id: 'f0400000-0000-4000-8000-000000000821',
            component_slot: 'choco',
            component_variant_id: 'f0400000-0000-4000-8000-000000000609',
            quantity: 3,
            sort_order: 1,
          },
        ],
        option_groups: [
          {
            id: 'f0400000-0000-4000-8000-000000000800',
            name: 'DEMO C — Regular',
            min_select: 1,
            max_select: 1,
            quantity_per_selection: 3,
            is_required: true,
            sort_order: 0,
            option_choices: [
              {
                id: 'f0400000-0000-4000-8000-000000000810',
                label: 'DEMO — Pandan',
                price_delta_idr: 0,
                component_variant_id: 'f0400000-0000-4000-8000-000000000611',
                is_active: true,
                sort_order: 0,
              },
            ],
          },
          {
            id: 'f0400000-0000-4000-8000-000000000801',
            name: 'DEMO D — Regular',
            min_select: 1,
            max_select: 1,
            quantity_per_selection: 3,
            is_required: true,
            sort_order: 1,
            option_choices: [
              {
                id: 'f0400000-0000-4000-8000-000000000811',
                label: 'DEMO — Vanilla',
                price_delta_idr: 0,
                component_variant_id: 'f0400000-0000-4000-8000-000000000613',
                is_active: true,
                sort_order: 0,
              },
            ],
          },
        ],
        variant_dietary_tags: [],
        variant_allergens: [],
      },
    ],
  };

  const componentVariants = [
    {
      id: 'f0400000-0000-4000-8000-000000000607',
      sku: 'DEMO-CHEESE',
      name: 'Cheese Chiffon Slice',
      product_id: 'f0400000-0000-4000-8000-000000000403',
      status: 'active',
      variant_dietary_tags: [],
      branch_variant_offers: [
        {
          branch_id: SURABAYA_ID,
          is_listed: true,
          availability_status: 'available',
          stock_quantity: null,
        },
      ],
    },
    {
      id: 'f0400000-0000-4000-8000-000000000609',
      sku: 'DEMO-CHOCO',
      name: 'Choco Chiffon Slice',
      product_id: 'f0400000-0000-4000-8000-000000000404',
      status: 'active',
      variant_dietary_tags: [],
      branch_variant_offers: [
        {
          branch_id: SURABAYA_ID,
          is_listed: true,
          availability_status: 'available',
          stock_quantity: null,
        },
      ],
    },
    {
      id: 'f0400000-0000-4000-8000-000000000611',
      sku: 'DEMO-PANDAN',
      name: 'Pandan Chiffon Slice',
      product_id: 'f0400000-0000-4000-8000-000000000405',
      status: 'active',
      variant_dietary_tags: [],
      branch_variant_offers: [
        {
          branch_id: SURABAYA_ID,
          is_listed: true,
          availability_status: 'available',
          stock_quantity: null,
        },
      ],
    },
    {
      id: 'f0400000-0000-4000-8000-000000000613',
      sku: 'DEMO-VANILLA',
      name: 'Vanilla Chiffon Slice',
      product_id: 'f0400000-0000-4000-8000-000000000406',
      status: 'active',
      variant_dietary_tags: [],
      branch_variant_offers: [
        {
          branch_id: SURABAYA_ID,
          is_listed: true,
          availability_status: 'available',
          stock_quantity: null,
        },
      ],
    },
  ];

  const promotions = [
    {
      id: 'f0400000-0000-4000-8000-000000000931',
      title: 'Diskon Kopi 2.000',
      slug: 'diskon-kopi',
      discount_type: 'fixed',
      discount_value: 2000,
      min_spend_idr: 0,
      max_discount_idr: 5000,
      scope: 'product',
      starts_at: '2026-11-10T00:00:00+07:00',
      ends_at: '2026-11-18T00:00:00+07:00',
      status: 'published',
      is_enabled: true,
      is_stackable: false,
      priority: 10,
      promotion_branches: [{ branch_id: BINTARO_ID }],
      promotion_categories: [],
      promotion_products: [{ product_id: PROD_COFFEE_ID }],
      promotion_variants: [],
    },
  ];

  return {
    branches,
    coffeeProduct,
    breadProduct,
    mixProduct,
    componentVariants,
    promotions,
  };
}

function stubDetailSupabaseRest(fixtures = createDetailFixtures()) {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_synthetic_fixture_key',
  );
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const pathname = url.pathname;
    const table = pathname.split('/').pop();

    if (table === 'branches') return Response.json(fixtures.branches);
    if (table === 'promotions') return Response.json(fixtures.promotions);
    if (table === 'product_variants')
      return Response.json(fixtures.componentVariants);
    if (table === 'products') {
      const slugEq = url.searchParams.get('slug');
      if (slugEq === 'eq.demo-coffee') {
        return Response.json(fixtures.coffeeProduct);
      }
      if (slugEq === 'eq.demo-bread-cheese') {
        return Response.json(fixtures.breadProduct);
      }
      if (slugEq === 'eq.demo-mix') {
        return Response.json(fixtures.mixProduct);
      }
      if (slugEq) {
        return Response.json(null);
      }
      // Return empty array for catalog related products query
      return Response.json([fixtures.coffeeProduct]);
    }
    return Response.json([]);
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

it('returns full product detail with three sizes, branch overrides, and verified food info per SKU', async () => {
  stubDetailSupabaseRest();
  const refNow = new Date('2026-11-12T10:00:00+07:00');

  // Query Coffee Chiffon for Surabaya branch
  const sbyDetail = await getProductDetail(
    { slug: 'demo-coffee', branch: 'surabaya' },
    { now: refNow },
  );

  expect(sbyDetail).not.toBeNull();
  expect(sbyDetail?.name).toBe('DEMO — Coffee Chiffon');
  expect(sbyDetail?.resolvedBranchId).toBe(SURABAYA_ID);
  expect(sbyDetail?.activeVariantCount).toBe(2); // 2 active, 1 archived excluded
  expect(sbyDetail?.offeredVariants).toHaveLength(2);

  const slice = sbyDetail?.offeredVariants.find((v) => v.sizeLabel === 'Slice');
  expect(slice?.sku).toBe('DEMO-COFFEE-SLICE');
  expect(slice?.availabilityStatus).toBe('sold_out');
  expect(slice?.effectivePriceIdr).toBe(15_000);
  expect(slice?.verifiedDietaryTags).toEqual([
    { slug: 'gluten-free', name: 'Gluten-Free' },
  ]);
  expect(slice?.verifiedAllergens).toEqual([
    { slug: 'egg', name: 'Telur', presence: 'contains' },
  ]);

  const mini = sbyDetail?.offeredVariants.find(
    (v) => v.sizeLabel === 'Mini 14cm',
  );
  expect(mini?.availabilityStatus).toBe('available');
  expect(mini?.effectivePriceIdr).toBe(70_000);
  expect(mini?.verifiedDietaryTags).toEqual([]); // absence !== free-from

  // Bintaro branch: Coffee Slice has 16k override - 2k promo = 14k; Mini not listed in Bintaro
  const btrDetail = await getProductDetail(
    { slug: 'demo-coffee', branch: 'bintaro' },
    { now: refNow },
  );
  expect(btrDetail?.resolvedBranchId).toBe(BINTARO_ID);
  expect(btrDetail?.offeredVariants).toHaveLength(1);
  const btrSlice = btrDetail?.offeredVariants[0];
  expect(btrSlice?.effectivePriceIdr).toBe(14_000);
  expect(btrSlice?.unitGrossIdr).toBe(16_000);
  expect(btrSlice?.availabilityStatus).toBe('unconfirmed');
  expect(btrSlice?.appliedPromotion?.slug).toBe('diskon-kopi');
});

it('handles single SKU product and returns null for unpublished or missing products', async () => {
  stubDetailSupabaseRest();

  // Single SKU product
  const bread = await getProductDetail({
    slug: 'demo-bread-cheese',
    branch: 'surabaya',
  });
  expect(bread).not.toBeNull();
  expect(bread?.activeVariantCount).toBe(1);
  expect(bread?.offeredVariants[0].sizeLabel).toBe('Piece');

  // Missing product returns null
  const missing = await getProductDetail({
    slug: 'non-existent-product',
    branch: 'surabaya',
  });
  expect(missing).toBeNull();
});

it('returns bundle product detail with fixed components, option groups, and resolved component variants for Chiffon Mix (F11/R11)', async () => {
  stubDetailSupabaseRest();

  const bundleDetail = await getProductDetail({
    slug: 'demo-mix',
    branch: 'surabaya',
  });

  expect(bundleDetail).not.toBeNull();
  expect(bundleDetail?.productType).toBe('bundle');
  expect(bundleDetail?.offeredVariants).toHaveLength(1);

  const regularVariant = bundleDetail?.offeredVariants[0];
  expect(regularVariant?.bundleRecipe).toBe('chiffon_mix');
  expect(regularVariant?.bundleUnitsTotal).toBe(12);
  expect(regularVariant?.bundleRulesVerified).toBe(true);

  // 2 fixed components: Cheese and Choco with quantity 3
  expect(regularVariant?.fixedComponents).toHaveLength(2);
  const cheeseFixed = regularVariant?.fixedComponents.find(
    (fc) => fc.componentSlot === 'cheese',
  );
  expect(cheeseFixed?.quantity).toBe(3);
  expect(cheeseFixed?.componentVariant?.name).toBe('Cheese Chiffon Slice');

  // 2 option groups: Group C and Group D
  expect(regularVariant?.optionGroups).toHaveLength(2);
  const groupC = regularVariant?.optionGroups.find(
    (g) => g.name === 'DEMO C — Regular',
  );
  expect(groupC?.minSelect).toBe(1);
  expect(groupC?.maxSelect).toBe(1);
  expect(groupC?.quantityPerSelection).toBe(3);
  expect(groupC?.choices[0].label).toBe('DEMO — Pandan');
  expect(groupC?.choices[0].componentVariant?.name).toBe(
    'Pandan Chiffon Slice',
  );
});

it('enforces route handler contract for /api/products/[slug] (200, 400, 404, 503)', async () => {
  stubDetailSupabaseRest();

  // Valid GET request -> 200
  const validReq = new Request(
    'http://localhost:3000/api/products/demo-coffee?branch=surabaya',
  );
  const validRes = await getProductDetailRoute(validReq, {
    params: Promise.resolve({ slug: 'demo-coffee' }),
  });
  expect(validRes.status).toBe(200);
  expect(validRes.headers.get('cache-control')).toBe('no-store');
  const validBody = await validRes.json();
  expect(validBody.ok).toBe(true);
  expect(validBody.data.name).toBe('DEMO — Coffee Chiffon');

  // Missing product -> 404 NOT_FOUND
  const missingReq = new Request(
    'http://localhost:3000/api/products/unknown-kueh',
  );
  const missingRes = await getProductDetailRoute(missingReq, {
    params: Promise.resolve({ slug: 'unknown-kueh' }),
  });
  expect(missingRes.status).toBe(404);
  const missingBody = await missingRes.json();
  expect(missingBody.ok).toBe(false);
  expect(missingBody.error.code).toBe('NOT_FOUND');

  // Unknown or duplicate query parameter -> 400 INVALID_REQUEST
  const invalidReq = new Request(
    'http://localhost:3000/api/products/demo-coffee?unknown=1',
  );
  const invalidRes = await getProductDetailRoute(invalidReq, {
    params: Promise.resolve({ slug: 'demo-coffee' }),
  });
  expect(invalidRes.status).toBe(400);
  const invalidBody = await invalidRes.json();
  expect(invalidBody.error.code).toBe('INVALID_REQUEST');

  // Upstream failure -> 503 UPSTREAM_ERROR
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('DB down')));
  const errReq = new Request('http://localhost:3000/api/products/demo-coffee');
  const errRes = await getProductDetailRoute(errReq, {
    params: Promise.resolve({ slug: 'demo-coffee' }),
  });
  expect(errRes.status).toBe(503);
  const errBody = await errRes.json();
  expect(errBody.error.code).toBe('UPSTREAM_ERROR');
});
