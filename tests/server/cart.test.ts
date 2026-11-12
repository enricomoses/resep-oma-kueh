import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/cart/validate/route';
import { CART_CONFLICTS } from '@/constants/cart.constant';
import { validateCartItems } from '@/features/cart/service.server';

const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const BINTARO_ID = 'f0400000-0000-4000-8000-000000000002';
const VARIANT_A_ID = 'f0400000-0000-4000-8000-000000000600';
const VARIANT_SOLD_OUT_ID = 'f0400000-0000-4000-8000-000000000601';
const PRODUCT_A_ID = 'f0400000-0000-4000-8000-000000000400';

const branchesFixture = [
  {
    id: SURABAYA_ID,
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    whatsapp_number: '6281703384308',
    address: 'Jl. Rungkut Mapan',
    maps_url: null,
    is_active: true,
    sort_order: 1,
  },
  {
    id: BINTARO_ID,
    code: 'bintaro',
    name: 'Bintaro',
    city: 'Tangerang Selatan',
    whatsapp_number: '6281299990001',
    address: null,
    maps_url: null,
    is_active: true,
    sort_order: 2,
  },
];

const variantsFixture = [
  {
    id: VARIANT_A_ID,
    sku: 'DEMO-PANDAN-MED',
    name: 'Chiffon Pandan Medium',
    size_label: 'Medium 18cm',
    base_price_idr: 85_000,
    status: 'published',
    max_quantity_per_order: 20,
    bundle_recipe: null,
    bundle_units_total: null,
    bundle_rules_verified: false,
    products: {
      id: PRODUCT_A_ID,
      name: 'Chiffon Pandan Asli',
      slug: 'chiffon-pandan-asli',
      product_type: 'variants',
      status: 'published',
      product_categories: [{ category_id: 'cat-1', is_primary: true }],
      product_images: [
        { alt_text: 'Chiffon Pandan', is_primary: true, sort_order: 0 },
      ],
    },
    branch_variant_offers: [
      {
        branch_id: SURABAYA_ID,
        is_listed: true,
        availability_status: 'available',
        stock_quantity: 10,
        price_override_idr: null,
      },
      {
        branch_id: BINTARO_ID,
        is_listed: true,
        availability_status: 'sold_out',
        stock_quantity: 0,
        price_override_idr: 90_000,
      },
    ],
    option_groups: [],
    bundle_fixed_components: [],
  },
  {
    id: VARIANT_SOLD_OUT_ID,
    sku: 'DEMO-SOLD-OUT',
    name: 'Roti Klasik',
    size_label: 'Piece',
    base_price_idr: 25_000,
    status: 'published',
    max_quantity_per_order: 10,
    bundle_recipe: null,
    bundle_units_total: null,
    bundle_rules_verified: false,
    products: {
      id: 'f0400000-0000-4000-8000-000000000405',
      name: 'Roti Klasik',
      slug: 'roti-klasik',
      product_type: 'simple',
      status: 'published',
      product_categories: [],
      product_images: [
        { alt_text: 'Roti Klasik', is_primary: true, sort_order: 0 },
      ],
    },
    branch_variant_offers: [
      {
        branch_id: SURABAYA_ID,
        is_listed: true,
        availability_status: 'sold_out',
        stock_quantity: 0,
        price_override_idr: null,
      },
    ],
    option_groups: [],
    bundle_fixed_components: [],
  },
];

function setupSupabaseMock() {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_synthetic_fixture_key',
  );

  const fetchMock = vi.fn<typeof globalThis.fetch>(async (input) => {
    const urlStr = String(input);
    const url = new URL(urlStr);

    if (url.pathname.includes('/rest/v1/branches')) {
      return new Response(JSON.stringify(branchesFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname.includes('/rest/v1/product_variants')) {
      return new Response(JSON.stringify(variantsFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname.includes('/rest/v1/promotions')) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('Cart Server Validation Tests', () => {
  beforeEach(() => {
    setupSupabaseMock();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('rejects POST with malformed JSON with HTTP 400', async () => {
    const request = new Request('http://localhost/api/cart/validate', {
      method: 'POST',
      body: 'invalid json{',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INVALID_REQUEST');
  });

  it('rejects POST with invalid body schema with HTTP 422', async () => {
    const request = new Request('http://localhost/api/cart/validate', {
      method: 'POST',
      body: JSON.stringify({ branchId: 'not-a-uuid', items: [] }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.ok).toBe(false);
  });

  it('returns HTTP 404 when branchId does not match an active branch', async () => {
    const request = new Request('http://localhost/api/cart/validate', {
      method: 'POST',
      body: JSON.stringify({
        branchId: '99999999-9999-4999-8999-999999999999',
        items: [],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.ok).toBe(false);
  });

  it('validates empty items successfully with HTTP 200 and zero totals', async () => {
    const request = new Request('http://localhost/api/cart/validate', {
      method: 'POST',
      body: JSON.stringify({
        branchId: SURABAYA_ID,
        items: [],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.data.branchId).toBe(SURABAYA_ID);
    expect(json.data.lines).toHaveLength(0);
    expect(json.data.estimatedTotalIdr).toBe(0);
  });

  it('validates cart items, computes unit price, and detects sold out conflict', async () => {
    const result = await validateCartItems({
      branchId: SURABAYA_ID,
      items: [
        {
          lineId: 'line-1',
          variantId: VARIANT_A_ID,
          choiceIds: [],
          quantity: 2,
        },
        {
          lineId: 'line-2',
          variantId: VARIANT_SOLD_OUT_ID,
          choiceIds: [],
          quantity: 1,
        },
      ],
    });

    expect(result.branchId).toBe(SURABAYA_ID);
    expect(result.lines).toHaveLength(2);

    // Line 1: Available
    const line1 = result.lines[0];
    expect(line1.productName).toBe('Chiffon Pandan Asli');
    expect(line1.effectiveUnitPriceIdr).toBe(85_000);
    expect(line1.subtotalIdr).toBe(170_000);
    expect(line1.conflict).toBe(CART_CONFLICTS.NONE);

    // Line 2: Sold out
    const line2 = result.lines[1];
    expect(line2.productName).toBe('Roti Klasik');
    expect(line2.conflict).toBe(CART_CONFLICTS.SOLD_OUT);

    expect(result.hasBlockingConflicts).toBe(true);
  });

  it('detects sold out conflict on Bintaro branch where offer is sold_out', async () => {
    const result = await validateCartItems({
      branchId: BINTARO_ID,
      items: [
        {
          lineId: 'line-1',
          variantId: VARIANT_A_ID,
          choiceIds: [],
          quantity: 1,
        },
      ],
    });

    expect(result.branchId).toBe(BINTARO_ID);
    expect(result.lines[0].conflict).toBe(CART_CONFLICTS.SOLD_OUT);
    expect(result.hasBlockingConflicts).toBe(true);
  });
});
