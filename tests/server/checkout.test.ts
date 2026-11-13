import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/checkout/prepare/route';
import {
  CheckoutRequestTooLargeError,
  CheckoutTimeoutError,
} from '@/features/checkout/errors.server';
import { prepareCheckoutQuote } from '@/features/checkout/service.server';
import { prepareCheckout } from '@/services/checkout.service';
import type { CheckoutPrepareRequest } from '@/types/checkout';
import { formatJakartaDateIso } from '@/utils/checkout';

const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const BINTARO_ID = 'f0400000-0000-4000-8000-000000000002';
const VARIANT_PANDAN_ID = 'f0400000-0000-4000-8000-000000000600';
const VARIANT_SOLD_OUT_ID = 'f0400000-0000-4000-8000-000000000601';
const VARIANT_BUNDLE_ID = 'f0400000-0000-4000-8000-000000000602';

const COMP_CHEESE_ID = 'f0400000-0000-4000-8000-000000000701';
const COMP_CHOCO_ID = 'f0400000-0000-4000-8000-000000000702';
const COMP_PANDAN_ID = 'f0400000-0000-4000-8000-000000000703';
const COMP_EARLGREY_ID = 'f0400000-0000-4000-8000-000000000704';

const CHOICE_PANDAN_ID = 'f0400000-0000-4000-8000-000000000801';
const CHOICE_EARLGREY_ID = 'f0400000-0000-4000-8000-000000000802';

const branchesFixture = [
  {
    id: SURABAYA_ID,
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    whatsapp_number: '+62 817-0338-4308',
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
    whatsapp_number: '+62 851-1978-5194',
    address: null,
    maps_url: null,
    is_active: true,
    sort_order: 2,
  },
];

const variantsFixture = [
  {
    id: VARIANT_PANDAN_ID,
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
      id: 'f0400000-0000-4000-8000-000000000400',
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
        availability_status: 'available',
        stock_quantity: 5,
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
  {
    id: VARIANT_BUNDLE_ID,
    sku: 'DEMO-BUNDLE-12',
    name: 'Paket Chiffon Slice Mix',
    size_label: '12 Potong',
    base_price_idr: 150_000,
    status: 'published',
    max_quantity_per_order: 5,
    bundle_recipe: 'chiffon_mix',
    bundle_units_total: 12,
    bundle_rules_verified: true,
    products: {
      id: 'f0400000-0000-4000-8000-000000000402',
      name: 'Paket Chiffon Slice Mix',
      slug: 'paket-chiffon-slice-mix',
      product_type: 'bundle',
      status: 'published',
      product_categories: [{ category_id: 'cat-bundles', is_primary: true }],
      product_images: [
        { alt_text: 'Paket Chiffon Mix', is_primary: true, sort_order: 0 },
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
    ],
    option_groups: [
      {
        id: 'f0400000-0000-4000-8000-000000000901',
        name: 'Pilihan Rasa 1',
        min_select: 1,
        max_select: 1,
        quantity_per_selection: 3,
        is_required: true,
        sort_order: 1,
        option_choices: [
          {
            id: CHOICE_PANDAN_ID,
            label: 'Pandan',
            price_delta_idr: 5_000,
            component_variant_id: COMP_PANDAN_ID,
            is_active: true,
            sort_order: 1,
          },
        ],
      },
      {
        id: 'f0400000-0000-4000-8000-000000000902',
        name: 'Pilihan Rasa 2',
        min_select: 1,
        max_select: 1,
        quantity_per_selection: 3,
        is_required: true,
        sort_order: 2,
        option_choices: [
          {
            id: CHOICE_EARLGREY_ID,
            label: 'Earl Grey',
            price_delta_idr: 5_000,
            component_variant_id: COMP_EARLGREY_ID,
            is_active: true,
            sort_order: 1,
          },
        ],
      },
    ],
    bundle_fixed_components: [
      {
        id: 'f0400000-0000-4000-8000-000000000911',
        component_slot: 'cheese',
        component_variant_id: COMP_CHEESE_ID,
        quantity: 3,
        sort_order: 1,
      },
      {
        id: 'f0400000-0000-4000-8000-000000000912',
        component_slot: 'choco',
        component_variant_id: COMP_CHOCO_ID,
        quantity: 3,
        sort_order: 2,
      },
    ],
  },
];

const componentVariantsFixture = [
  {
    id: COMP_CHEESE_ID,
    name: 'Keju (Cheese)',
    sku: 'SLICE-CHEESE',
    status: 'published',
    branch_variant_offers: [
      {
        branch_id: SURABAYA_ID,
        is_listed: true,
        availability_status: 'available',
        stock_quantity: 20,
      },
    ],
  },
  {
    id: COMP_CHOCO_ID,
    name: 'Cokelat (Choco)',
    sku: 'SLICE-CHOCO',
    status: 'published',
    branch_variant_offers: [
      {
        branch_id: SURABAYA_ID,
        is_listed: true,
        availability_status: 'available',
        stock_quantity: 20,
      },
    ],
  },
  {
    id: COMP_PANDAN_ID,
    name: 'Pandan',
    sku: 'SLICE-PANDAN',
    status: 'published',
    branch_variant_offers: [
      {
        branch_id: SURABAYA_ID,
        is_listed: true,
        availability_status: 'available',
        stock_quantity: 20,
      },
    ],
  },
  {
    id: COMP_EARLGREY_ID,
    name: 'Earl Grey',
    sku: 'SLICE-EARLGREY',
    status: 'published',
    branch_variant_offers: [
      {
        branch_id: SURABAYA_ID,
        is_listed: true,
        availability_status: 'available',
        stock_quantity: 20,
      },
    ],
  },
];

let interceptedDbRequests: Array<{ method: string; path: string }> = [];

function setupSupabaseMock(options: { failBranches?: boolean } = {}) {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_synthetic_fixture_key',
  );

  interceptedDbRequests = [];

  const fetchMock = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const urlStr = String(input);
    const url = new URL(urlStr);
    const method = init?.method ?? 'GET';

    interceptedDbRequests.push({ method, path: url.pathname });

    if (options.failBranches && url.pathname.includes('/rest/v1/branches')) {
      return new Response(JSON.stringify({ message: 'DB down' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname.includes('/rest/v1/branches')) {
      return new Response(JSON.stringify(branchesFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname.includes('/rest/v1/product_variants')) {
      // Check if querying components
      if (url.search.includes(COMP_CHEESE_ID)) {
        return new Response(JSON.stringify(componentVariantsFixture), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
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

describe('POST /api/checkout/prepare Server Tests (PRD §8, §15, §27.2–27.3)', () => {
  beforeEach(() => {
    setupSupabaseMock();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('resolves trusted WhatsApp number and authoritative price for Surabaya branch', async () => {
    const payload: CheckoutPrepareRequest = {
      branchId: SURABAYA_ID,
      items: [{ variantId: VARIANT_PANDAN_ID, quantity: 2, choiceIds: [] }],
      fulfillment: {
        method: 'pickup',
        requestedDate: formatJakartaDateIso(),
      },
      customerName: 'Budi Santoso',
      acknowledgedManualConfirmation: true,
    };

    const request = new Request('http://localhost:3000/api/checkout/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.data.branch.name).toBe('Surabaya');
    expect(json.data.branch.whatsappNumber).toBe('6281703384308');
    expect(json.data.lines[0].unitGrossIdr).toBe(85_000);
    expect(json.data.lines[0].unitPriceIdr).toBe(85_000);
    expect(json.data.subtotalIdr).toBe(170_000);
    expect(json.data.estimatedTotalIdr).toBe(170_000);
    expect(json.data.requiresReview).toBe(true);
    expect(json.data.whatsappUrl).toContain('wa.me/6281703384308');
  });

  it('resolves branch price override and trusted WhatsApp number for Bintaro branch', async () => {
    const payload: CheckoutPrepareRequest = {
      branchId: BINTARO_ID,
      items: [{ variantId: VARIANT_PANDAN_ID, quantity: 1, choiceIds: [] }],
      fulfillment: {
        method: 'delivery',
        requestedDate: formatJakartaDateIso(),
        address: 'Jl. Boulevard Bintaro Jaya Sektor 7',
      },
      customerName: 'Dewi',
      acknowledgedManualConfirmation: true,
    };

    const request = new Request('http://localhost:3000/api/checkout/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.data.branch.name).toBe('Bintaro');
    expect(json.data.branch.whatsappNumber).toBe('6285119785194');
    // Bintaro has price override 90,000 IDR
    expect(json.data.lines[0].unitGrossIdr).toBe(90_000);
    expect(json.data.lines[0].unitPriceIdr).toBe(90_000);
    expect(json.data.estimatedTotalIdr).toBe(90_000);
    expect(json.data.whatsappUrl).toContain('wa.me/6285119785194');
  });

  it('handles two-step verification: first call review=true, second call with same fingerprint review=false', async () => {
    const payloadStep1: CheckoutPrepareRequest = {
      branchId: SURABAYA_ID,
      items: [{ variantId: VARIANT_PANDAN_ID, quantity: 1, choiceIds: [] }],
      fulfillment: {
        method: 'pickup',
        requestedDate: formatJakartaDateIso(),
      },
      customerName: 'Budi Santoso',
      acknowledgedManualConfirmation: true,
      expectedQuoteFingerprint: null,
    };

    const step1Res = await POST(
      new Request('http://localhost:3000/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadStep1),
      }),
    );

    const step1Json = await step1Res.json();
    expect(step1Json.ok).toBe(true);
    expect(step1Json.data.requiresReview).toBe(true);
    const fingerprint = step1Json.data.quoteFingerprint;
    expect(fingerprint).toBeDefined();

    // Step 2: Reprepare with identical fingerprint
    const payloadStep2: CheckoutPrepareRequest = {
      ...payloadStep1,
      expectedQuoteFingerprint: fingerprint,
    };

    const step2Res = await POST(
      new Request('http://localhost:3000/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadStep2),
      }),
    );

    const step2Json = await step2Res.json();
    expect(step2Json.ok).toBe(true);
    expect(step2Json.data.requiresReview).toBe(false);
    expect(step2Json.data.quoteFingerprint).toBe(fingerprint);
  });

  it('returns HTTP 200 with new fingerprint, requiresReview=true and PRICE_CHANGED when fingerprint mismatches', async () => {
    const staleFingerprint = 'a'.repeat(64);

    const payload: CheckoutPrepareRequest = {
      branchId: SURABAYA_ID,
      items: [{ variantId: VARIANT_PANDAN_ID, quantity: 1, choiceIds: [] }],
      fulfillment: {
        method: 'pickup',
        requestedDate: formatJakartaDateIso(),
      },
      customerName: 'Budi Santoso',
      acknowledgedManualConfirmation: true,
      expectedQuoteFingerprint: staleFingerprint,
    };

    const response = await POST(
      new Request('http://localhost:3000/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.data.requiresReview).toBe(true);
    expect(json.data.quoteFingerprint).not.toBe(staleFingerprint);

    const warningCodes = json.data.warnings.map(
      (w: { code: string }) => w.code,
    );
    expect(warningCodes).toContain('PRICE_CHANGED');
  });

  it('returns 409 STOCK_CHANGED when an item is sold out in the branch', async () => {
    const payload: CheckoutPrepareRequest = {
      branchId: SURABAYA_ID,
      items: [{ variantId: VARIANT_SOLD_OUT_ID, quantity: 1, choiceIds: [] }],
      fulfillment: {
        method: 'pickup',
        requestedDate: formatJakartaDateIso(),
      },
      customerName: 'Budi',
      acknowledgedManualConfirmation: true,
    };

    const response = await POST(
      new Request('http://localhost:3000/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('STOCK_CHANGED');
  });

  it('returns 409 ITEM_UNAVAILABLE when item is not offered in the branch', async () => {
    const payload: CheckoutPrepareRequest = {
      branchId: BINTARO_ID, // VARIANT_SOLD_OUT_ID only has offer in Surabaya, not Bintaro
      items: [{ variantId: VARIANT_SOLD_OUT_ID, quantity: 1, choiceIds: [] }],
      fulfillment: {
        method: 'pickup',
        requestedDate: formatJakartaDateIso(),
      },
      customerName: 'Budi',
      acknowledgedManualConfirmation: true,
    };

    const response = await POST(
      new Request('http://localhost:3000/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('ITEM_UNAVAILABLE');
  });

  it('returns 404 NOT_FOUND when branch is unknown or inactive', async () => {
    const payload: CheckoutPrepareRequest = {
      branchId: '00000000-0000-0000-0000-000000000000',
      items: [{ variantId: VARIANT_PANDAN_ID, quantity: 1, choiceIds: [] }],
      fulfillment: {
        method: 'pickup',
        requestedDate: formatJakartaDateIso(),
      },
      customerName: 'Budi',
      acknowledgedManualConfirmation: true,
    };

    const response = await POST(
      new Request('http://localhost:3000/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('returns 413 REQUEST_TOO_LARGE when body exceeds 32 KiB', async () => {
    const oversizedBody = JSON.stringify({
      branchId: SURABAYA_ID,
      items: [{ variantId: VARIANT_PANDAN_ID, quantity: 1, choiceIds: [] }],
      fulfillment: {
        method: 'pickup',
        requestedDate: formatJakartaDateIso(),
      },
      customerName: 'Budi',
      acknowledgedManualConfirmation: true,
      blob: 'X'.repeat(33 * 1024),
    });

    const response = await POST(
      new Request('http://localhost:3000/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: oversizedBody,
      }),
    );

    expect(response.status).toBe(413);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('REQUEST_TOO_LARGE');
  });

  it('returns 400 INVALID_REQUEST when request JSON is malformed', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json-payload{',
      }),
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 422 VALIDATION_ERROR with fieldErrors when schema is invalid', async () => {
    const invalidPayload = {
      branchId: SURABAYA_ID,
      items: [{ variantId: VARIANT_PANDAN_ID, quantity: 1, choiceIds: [] }],
      fulfillment: {
        method: 'delivery',
        requestedDate: '2020-01-01', // Past date
        address: '', // Missing delivery address
      },
      customerName: '', // Empty customer name
      acknowledgedManualConfirmation: false, // Must be true
    };

    const response = await POST(
      new Request('http://localhost:3000/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload),
      }),
    );

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.fieldErrors).toBeDefined();
    expect(json.error.fieldErrors['fulfillment.requestedDate']).toBeDefined();
    expect(json.error.fieldErrors['fulfillment.address']).toBeDefined();
    expect(
      json.error.fieldErrors['acknowledgedManualConfirmation'],
    ).toBeDefined();
  });

  it('returns 503 UPSTREAM_ERROR when database read fails', async () => {
    setupSupabaseMock({ failBranches: true });

    const payload: CheckoutPrepareRequest = {
      branchId: SURABAYA_ID,
      items: [{ variantId: VARIANT_PANDAN_ID, quantity: 1, choiceIds: [] }],
      fulfillment: {
        method: 'pickup',
        requestedDate: formatJakartaDateIso(),
      },
      customerName: 'Budi',
      acknowledgedManualConfirmation: true,
    };

    const response = await POST(
      new Request('http://localhost:3000/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('UPSTREAM_ERROR');
  });

  it('guarantees database snapshot remains unchanged (STRICTLY READ-ONLY: NO order or stock insert/mutation)', async () => {
    const payload: CheckoutPrepareRequest = {
      branchId: SURABAYA_ID,
      items: [
        {
          variantId: VARIANT_BUNDLE_ID,
          quantity: 1,
          choiceIds: [CHOICE_PANDAN_ID, CHOICE_EARLGREY_ID],
        },
      ],
      fulfillment: {
        method: 'delivery',
        requestedDate: formatJakartaDateIso(),
        address: 'Jl. Pemuda No. 45, Surabaya',
      },
      customerName: 'Hendra Gunawan',
      acknowledgedManualConfirmation: true,
    };

    const response = await POST(
      new Request('http://localhost:3000/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);

    // Verify all intercepted DB requests were strictly GET requests
    expect(interceptedDbRequests.length).toBeGreaterThan(0);
    for (const req of interceptedDbRequests) {
      expect(req.method).toBe('GET');
      expect(req.path).not.toContain('/orders');
      expect(req.path).not.toContain('/order_items');
      expect(req.path).not.toContain('/stock_reservations');
    }
  });

  it('exercises direct prepareCheckoutQuote service invocation', async () => {
    const result = await prepareCheckoutQuote({
      branchId: SURABAYA_ID,
      items: [{ variantId: VARIANT_PANDAN_ID, quantity: 1, choiceIds: [] }],
      fulfillment: {
        method: 'pickup',
        requestedDate: formatJakartaDateIso(),
      },
      customerName: 'Direct Tester',
      acknowledgedManualConfirmation: true,
    });

    expect(result.branch.name).toBe('Surabaya');
    expect(result.lines).toHaveLength(1);
    expect(result.quoteFingerprint).toBeDefined();
  });

  it('exercises client browser service prepareCheckout', () => {
    // Client service uses requestApi from lib/axios
    // Verify prepareCheckout function signature and callability
    expect(typeof prepareCheckout).toBe('function');
  });

  it('verifies custom checkout error instances', () => {
    const tooLarge = new CheckoutRequestTooLargeError();
    expect(tooLarge.status).toBe(413);
    expect(tooLarge.code).toBe('REQUEST_TOO_LARGE');

    const timeout = new CheckoutTimeoutError();
    expect(timeout.status).toBe(504);
    expect(timeout.code).toBe('TIMEOUT');
  });
});
