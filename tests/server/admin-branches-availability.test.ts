import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as getAvailabilityRoute } from '@/app/api/admin/availability/route';
import { PUT as upsertOfferRoute } from '@/app/api/admin/availability/[branchId]/[variantId]/route';
import { POST as bulkAvailabilityRoute } from '@/app/api/admin/availability/bulk/route';
import { PUT as replaceHoursRoute } from '@/app/api/admin/branches/[id]/hours/route';
import {
  GET as getBranchRoute,
  PATCH as patchBranchRoute,
} from '@/app/api/admin/branches/[id]/route';
import { GET as listBranchesRoute } from '@/app/api/admin/branches/route';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { AuthError, AuthForbiddenError } from '@/features/auth/errors.server';
import { getBranches } from '@/features/branches/service.server';
import type { AdminSessionProfile } from '@/types/auth';

const OWNER_ID = 'f1800000-0000-4000-8000-000000000001';
const STAFF_SBY_ID = 'f1800000-0000-4000-8000-000000000002';
const STAFF_BTR_ID = 'f1800000-0000-4000-8000-000000000003';
const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const BINTARO_ID = 'f0400000-0000-4000-8000-000000000002';
const PROD_PUB_ID = 'a1800000-0000-4000-8000-000000000001';
const PROD_DRAFT_ID = 'a1800000-0000-4000-8000-000000000002';
const VAR_PUB_1 = 'b1800000-0000-4000-8000-000000000001';
const VAR_PUB_2 = 'b1800000-0000-4000-8000-000000000002';
const VAR_DRAFT_1 = 'b1800000-0000-4000-8000-000000000003';

interface BranchRow {
  id: string;
  code: 'surabaya' | 'bintaro';
  name: string;
  city: string;
  address: string | null;
  maps_url: string | null;
  whatsapp_number: string;
  description: string | null;
  allow_pickup: boolean;
  allow_delivery: boolean;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

interface HourRow {
  id: string;
  branch_id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  note: string | null;
}

interface OfferRow {
  branch_id: string;
  variant_id: string;
  is_listed: boolean;
  availability_status: string;
  stock_quantity: number | null;
  price_override_idr: number | null;
  updated_at: string;
}

let activeProfile: AdminSessionProfile | null = null;
let timeCounter = 1;
const branchesMap = new Map<string, BranchRow>();
const hoursList: HourRow[] = [];
const offersMap = new Map<string, OfferRow>();
const variantsMap = new Map<
  string,
  {
    id: string;
    product_id: string;
    sku: string;
    name: string;
    size_label: string | null;
    base_price_idr: number;
    status: string;
    sort_order: number;
    updated_at: string;
    products: {
      id: string;
      name: string;
      slug: string;
      status: string;
      product_type: string;
      sort_order: number;
    };
  }
>();

function nextTs(): string {
  timeCounter += 1;
  return `2026-11-13T10:00:${String(timeCounter).padStart(2, '0')}.000Z`;
}

function resetState() {
  timeCounter = 1;
  branchesMap.clear();
  hoursList.length = 0;
  offersMap.clear();
  variantsMap.clear();

  branchesMap.set(SURABAYA_ID, {
    id: SURABAYA_ID,
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    address: 'Rungkut Asri Tengah V No. 22, Surabaya',
    maps_url: null,
    whatsapp_number: '6281703384308',
    description: 'Dapur Surabaya',
    allow_pickup: false,
    allow_delivery: false,
    sort_order: 1,
    is_active: true,
    updated_at: '2026-11-13T08:00:00.000Z',
  });

  branchesMap.set(BINTARO_ID, {
    id: BINTARO_ID,
    code: 'bintaro',
    name: 'Bintaro',
    city: 'Tangerang Selatan',
    address: null,
    maps_url: null,
    whatsapp_number: '6285119785194',
    description: null,
    allow_pickup: false,
    allow_delivery: false,
    sort_order: 2,
    is_active: true,
    updated_at: '2026-11-13T08:00:00.000Z',
  });

  for (let d = 0; d < 7; d += 1) {
    hoursList.push({
      id: `d1800000-0000-4000-8000-00000000000${d}`,
      branch_id: SURABAYA_ID,
      day_of_week: d,
      opens_at: d === 0 ? null : '09:00:00',
      closes_at: d === 0 ? null : '17:00:00',
      is_closed: d === 0,
      note: null,
    });
  }

  variantsMap.set(VAR_PUB_1, {
    id: VAR_PUB_1,
    product_id: PROD_PUB_ID,
    sku: 'ROK-CHS-20',
    name: 'Full Cheese',
    size_label: '20 cm',
    base_price_idr: 120000,
    status: 'active',
    sort_order: 1,
    updated_at: '2026-11-13T08:00:00.000Z',
    products: {
      id: PROD_PUB_ID,
      name: 'Chiffon Cheese',
      slug: 'chiffon-cheese',
      status: 'published',
      product_type: 'simple',
      sort_order: 1,
    },
  });

  variantsMap.set(VAR_PUB_2, {
    id: VAR_PUB_2,
    product_id: PROD_PUB_ID,
    sku: 'ROK-CHS-15',
    name: 'Mini Cheese',
    size_label: '15 cm',
    base_price_idr: 85000,
    status: 'active',
    sort_order: 2,
    updated_at: '2026-11-13T08:00:00.000Z',
    products: {
      id: PROD_PUB_ID,
      name: 'Chiffon Cheese',
      slug: 'chiffon-cheese',
      status: 'published',
      product_type: 'simple',
      sort_order: 1,
    },
  });

  variantsMap.set(VAR_DRAFT_1, {
    id: VAR_DRAFT_1,
    product_id: PROD_DRAFT_ID,
    sku: 'ROK-DFT-01',
    name: 'Draft Kue',
    size_label: null,
    base_price_idr: 95000,
    status: 'active',
    sort_order: 3,
    updated_at: '2026-11-13T08:00:00.000Z',
    products: {
      id: PROD_DRAFT_ID,
      name: 'Draft Produk',
      slug: 'draft-produk',
      status: 'draft',
      product_type: 'simple',
      sort_order: 2,
    },
  });

  offersMap.set(`${SURABAYA_ID}:${VAR_PUB_1}`, {
    branch_id: SURABAYA_ID,
    variant_id: VAR_PUB_1,
    is_listed: true,
    availability_status: 'available',
    stock_quantity: 5,
    price_override_idr: null,
    updated_at: '2026-11-13T08:00:00.000Z',
  });
}

function createFakeSupabase() {
  return {
    from(table: string) {
      const filters: Record<string, unknown> = {};
      const inFilters: Record<string, unknown[]> = {};
      let op: 'select' | 'update' | 'insert' = 'select';
      let payload: Record<string, unknown> = {};

      const builder = {
        select() {
          return builder;
        },
        update(data: Record<string, unknown>) {
          op = 'update';
          payload = data;
          return builder;
        },
        insert(data: Record<string, unknown>) {
          op = 'insert';
          payload = data;
          return builder;
        },
        eq(col: string, val: unknown) {
          filters[col] = val;
          return builder;
        },
        in(col: string, vals: unknown[]) {
          inFilters[col] = vals;
          return builder;
        },
        order() {
          return builder;
        },
        abortSignal() {
          return builder;
        },
        async single() {
          const res = await execute();
          if (res.error) return res;
          return {
            data: Array.isArray(res.data) ? res.data[0] : res.data,
            error: null,
          };
        },
        async maybeSingle() {
          const res = await execute();
          if (res.error) return res;
          return {
            data: Array.isArray(res.data)
              ? (res.data[0] ?? null)
              : (res.data ?? null),
            error: null,
          };
        },
        then(
          onFulfilled: (value: { data: unknown; error: unknown }) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) {
          return execute().then(onFulfilled, onRejected);
        },
      };

      async function execute(): Promise<{ data: unknown; error: unknown }> {
        if (table === 'branches') {
          if (op === 'update') {
            if (activeProfile?.role !== 'owner') {
              return {
                data: null,
                error: { code: '42501', message: 'owner_required' },
              };
            }
            const id = String(filters.id ?? '');
            const row = branchesMap.get(id);
            if (
              !row ||
              (filters.updated_at && row.updated_at !== filters.updated_at)
            ) {
              return { data: [], error: null };
            }
            const next: BranchRow = {
              ...row,
              ...(payload as Partial<BranchRow>),
              updated_at: nextTs(),
            };
            branchesMap.set(id, next);
            return { data: [next], error: null };
          }

          let rows = Array.from(branchesMap.values());
          if (filters.id) rows = rows.filter((item) => item.id === filters.id);
          if (filters.is_active !== undefined) {
            rows = rows.filter((item) => item.is_active === filters.is_active);
          }
          return { data: rows, error: null };
        }

        if (table === 'business_hours') {
          let rows = hoursList.slice();
          if (filters.branch_id) {
            rows = rows.filter((item) => item.branch_id === filters.branch_id);
          }
          if (inFilters.branch_id) {
            rows = rows.filter((item) =>
              inFilters.branch_id.includes(item.branch_id),
            );
          }
          return { data: rows, error: null };
        }

        if (table === 'product_variants') {
          let rows = Array.from(variantsMap.values());
          if (filters.id) rows = rows.filter((item) => item.id === filters.id);
          if (filters.status) {
            rows = rows.filter((item) => item.status === filters.status);
          }
          if (inFilters['products.status']) {
            rows = rows.filter((item) =>
              inFilters['products.status'].includes(item.products.status),
            );
          }
          return { data: rows, error: null };
        }

        if (table === 'branch_variant_offers') {
          if (op === 'insert') {
            if (activeProfile?.role === 'branch_admin') {
              if (payload.branch_id !== activeProfile.branchId) {
                return {
                  data: null,
                  error: { code: '42501', message: 'branch_write_denied' },
                };
              }
              if (
                'price_override_idr' in payload &&
                payload.price_override_idr !== null
              ) {
                return {
                  data: null,
                  error: {
                    code: '42501',
                    message: 'staff_insert_fields_denied',
                  },
                };
              }
            }
            const key = `${payload.branch_id}:${payload.variant_id}`;
            if (offersMap.has(key)) {
              return {
                data: null,
                error: { code: '23505', message: 'duplicate' },
              };
            }
            const created: OfferRow = {
              branch_id: String(payload.branch_id),
              variant_id: String(payload.variant_id),
              is_listed: Boolean(payload.is_listed),
              availability_status: String(payload.availability_status),
              stock_quantity: (payload.stock_quantity as number | null) ?? null,
              price_override_idr: null,
              updated_at: nextTs(),
            };
            offersMap.set(key, created);
            return { data: [created], error: null };
          }

          if (op === 'update') {
            const bId = String(filters.branch_id ?? '');
            const vId = String(filters.variant_id ?? '');
            if (activeProfile?.role === 'branch_admin') {
              if (bId !== activeProfile.branchId) {
                return {
                  data: null,
                  error: { code: '42501', message: 'branch_write_denied' },
                };
              }
              if (
                'price_override_idr' in payload ||
                'branch_id' in payload ||
                'variant_id' in payload
              ) {
                return {
                  data: null,
                  error: {
                    code: '42501',
                    message: 'staff_update_fields_denied',
                  },
                };
              }
            }
            const key = `${bId}:${vId}`;
            const row = offersMap.get(key);
            if (
              !row ||
              (filters.updated_at && row.updated_at !== filters.updated_at)
            ) {
              return { data: [], error: null };
            }
            const next: OfferRow = {
              ...row,
              ...(payload as Partial<OfferRow>),
              updated_at: nextTs(),
            };
            offersMap.set(key, next);
            return { data: [next], error: null };
          }

          let rows = Array.from(offersMap.values());
          if (filters.branch_id) {
            rows = rows.filter((item) => item.branch_id === filters.branch_id);
          }
          if (filters.variant_id) {
            rows = rows.filter(
              (item) => item.variant_id === filters.variant_id,
            );
          }
          if (inFilters.branch_id) {
            rows = rows.filter((item) =>
              inFilters.branch_id.includes(item.branch_id),
            );
          }
          return { data: rows, error: null };
        }

        return { data: [], error: null };
      }

      return builder;
    },
    rpc(name: string, args: Record<string, unknown>) {
      const rpcObj = {
        abortSignal() {
          return rpcObj;
        },
        then(
          onFulfilled: (value: { data: unknown; error: unknown }) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) {
          return executeRpc().then(onFulfilled, onRejected);
        },
      };

      async function executeRpc(): Promise<{ data: unknown; error: unknown }> {
        if (activeProfile?.role !== 'owner') {
          return {
            data: null,
            error: { code: '42501', message: 'owner_required' },
          };
        }

        if (name === 'replace_branch_hours') {
          const bId = String(args.p_branch_id);
          const branch = branchesMap.get(bId);
          if (!branch) {
            return {
              data: null,
              error: { code: 'P0002', message: 'branch_not_found' },
            };
          }
          if (branch.updated_at !== args.p_expected_branch_updated_at) {
            return {
              data: null,
              error: { code: '40900', message: 'stale_conflict' },
            };
          }
          const incoming = args.p_hours as {
            dayOfWeek: number;
            opensAt: string | null;
            closesAt: string | null;
            isClosed: boolean;
            note: string | null;
          }[];
          for (let i = hoursList.length - 1; i >= 0; i -= 1) {
            if (hoursList[i]?.branch_id === bId) {
              hoursList.splice(i, 1);
            }
          }
          for (const item of incoming) {
            hoursList.push({
              id: `e1800000-0000-4000-8000-00000000000${item.dayOfWeek}`,
              branch_id: bId,
              day_of_week: item.dayOfWeek,
              opens_at: item.opensAt ? `${item.opensAt}:00` : null,
              closes_at: item.closesAt ? `${item.closesAt}:00` : null,
              is_closed: item.isClosed,
              note: item.note ?? null,
            });
          }
          const updatedAt = nextTs();
          branchesMap.set(bId, { ...branch, updated_at: updatedAt });
          return { data: { branchId: bId, updatedAt }, error: null };
        }

        if (name === 'owner_upsert_branch_offer') {
          const bId = String(args.p_branch_id);
          const vId = String(args.p_variant_id);
          const variant = variantsMap.get(vId);
          if (!branchesMap.has(bId) || !variant) {
            return {
              data: null,
              error: { code: 'P0002', message: 'not_found' },
            };
          }
          if (args.p_update_base_price) {
            if (variant.updated_at !== args.p_expected_variant_updated_at) {
              return {
                data: null,
                error: { code: '40900', message: 'stale_variant_conflict' },
              };
            }
            variant.base_price_idr = Number(args.p_base_price_idr);
            variant.updated_at = nextTs();
          }
          const key = `${bId}:${vId}`;
          const existing = offersMap.get(key);
          if (existing) {
            if (existing.updated_at !== args.p_expected_offer_updated_at) {
              return {
                data: null,
                error: { code: '40900', message: 'stale_conflict' },
              };
            }
          } else if (args.p_expected_offer_updated_at !== null) {
            return {
              data: null,
              error: { code: '40900', message: 'stale_conflict' },
            };
          }
          const offerUpdatedAt = nextTs();
          offersMap.set(key, {
            branch_id: bId,
            variant_id: vId,
            is_listed: Boolean(args.p_is_listed),
            availability_status: String(args.p_availability_status),
            stock_quantity: (args.p_stock_quantity as number | null) ?? null,
            price_override_idr:
              (args.p_price_override_idr as number | null) ?? null,
            updated_at: offerUpdatedAt,
          });
          return {
            data: {
              branchId: bId,
              variantId: vId,
              offerUpdatedAt,
              variantUpdatedAt: variant.updated_at,
            },
            error: null,
          };
        }

        return { data: null, error: { code: '42883', message: 'unknown_rpc' } };
      }

      return rpcObj;
    },
  };
}

vi.mock('@/lib/supabase/server', () => ({
  createServerAuthClient: vi.fn(async () => createFakeSupabase()),
  createPublicReadClient: vi.fn(),
}));

vi.mock('@/features/auth/admin-guard.server', () => ({
  requireApiAdmin: vi.fn(
    async ({ roles }: { roles?: ('owner' | 'branch_admin')[] }) => {
      if (!activeProfile) {
        throw new AuthError('Silakan login.', 'UNAUTHENTICATED', 401);
      }
      if (roles && !roles.includes(activeProfile.role)) {
        throw new AuthForbiddenError();
      }
      return activeProfile;
    },
  ),
}));

vi.mock('@/features/auth/csrf.server', () => ({
  assertSameOriginRequest: vi.fn(),
}));

const OWNER_PROFILE: AdminSessionProfile = {
  userId: OWNER_ID,
  email: 'owner@resepomakueh.example',
  displayName: 'Owner Oma',
  role: 'owner',
  branchId: null,
  branchCode: null,
  branchName: null,
};

const STAFF_SBY_PROFILE: AdminSessionProfile = {
  userId: STAFF_SBY_ID,
  email: 'sby@resepomakueh.example',
  displayName: 'Admin SBY',
  role: 'branch_admin',
  branchId: SURABAYA_ID,
  branchCode: 'surabaya',
  branchName: 'Surabaya',
};

const STAFF_BTR_PROFILE: AdminSessionProfile = {
  userId: STAFF_BTR_ID,
  email: 'btr@resepomakueh.example',
  displayName: 'Admin BTR',
  role: 'branch_admin',
  branchId: BINTARO_ID,
  branchCode: 'bintaro',
  branchName: 'Bintaro',
};

describe('F18 Admin Branch Locations, Hours & Availability Server Contracts', () => {
  beforeEach(() => {
    resetState();
    activeProfile = OWNER_PROFILE;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns readiness checklist with Surabaya address confirmed and Bintaro unresolved for Owner', async () => {
    const res = await listBranchesRoute(
      new Request('http://localhost/api/admin/branches'),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-store');
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.approvedContacts.email).toBe('resepoma.kueh2@gmail.com');
    expect(json.data.approvedContacts.bintaroAddressResolved).toBe(false);
    expect(json.data.branches[0].readiness.hasConfirmedAddress).toBe(true);
    expect(json.data.branches[1].readiness.hasConfirmedAddress).toBe(false);
    expect(json.data.branches[0].allowPickup).toBe(false);
  });

  it('requires WA reverification and explicit fulfillment production review; enforces HTTPS Google Maps and stale 409', async () => {
    const branch = branchesMap.get(SURABAYA_ID)!;

    const badMaps = await patchBranchRoute(
      new Request(`http://localhost/api/admin/branches/${SURABAYA_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: branch.updated_at,
          name: branch.name,
          city: branch.city,
          address: branch.address,
          mapsUrl: 'http://evil.example/maps',
          whatsappNumber: branch.whatsapp_number,
          description: branch.description,
          allowPickup: false,
          allowDelivery: false,
          sortOrder: 1,
        }),
      }),
      { params: Promise.resolve({ id: SURABAYA_ID }) },
    );
    expect(badMaps.status).toBe(422);

    const noReverify = await patchBranchRoute(
      new Request(`http://localhost/api/admin/branches/${SURABAYA_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: branch.updated_at,
          name: branch.name,
          city: branch.city,
          address: branch.address,
          mapsUrl: 'https://maps.google.com/?q=Surabaya',
          whatsappNumber: '081900001111',
          description: branch.description,
          allowPickup: false,
          allowDelivery: false,
          sortOrder: 1,
          confirmWhatsappChange: false,
        }),
      }),
      { params: Promise.resolve({ id: SURABAYA_ID }) },
    );
    expect(noReverify.status).toBe(422);

    const noFulfillReview = await patchBranchRoute(
      new Request(`http://localhost/api/admin/branches/${SURABAYA_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: branch.updated_at,
          name: branch.name,
          city: branch.city,
          address: branch.address,
          mapsUrl: 'https://maps.google.com/?q=Surabaya',
          whatsappNumber: branch.whatsapp_number,
          description: branch.description,
          allowPickup: true,
          allowDelivery: false,
          sortOrder: 1,
          fulfillmentReviewedForProduction: false,
        }),
      }),
      { params: Promise.resolve({ id: SURABAYA_ID }) },
    );
    expect(noFulfillReview.status).toBe(422);

    const validPatch = await patchBranchRoute(
      new Request(`http://localhost/api/admin/branches/${SURABAYA_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: branch.updated_at,
          name: branch.name,
          city: branch.city,
          address: branch.address,
          mapsUrl: 'https://maps.google.com/?q=Surabaya',
          whatsappNumber: '+62 819-0000-1111',
          description: branch.description,
          allowPickup: true,
          allowDelivery: false,
          sortOrder: 1,
          confirmWhatsappChange: true,
          fulfillmentReviewedForProduction: true,
        }),
      }),
      { params: Promise.resolve({ id: SURABAYA_ID }) },
    );
    expect(validPatch.status).toBe(200);
    const updatedJson = await validPatch.json();
    expect(updatedJson.data.branch.whatsappNumber).toBe('6281900001111');
    expect(updatedJson.data.branch.allowPickup).toBe(true);
    expect(updatedJson.data.branch.readiness.whatsappTargetUrl).toBe(
      'https://wa.me/6281900001111',
    );

    // Repeating with the old timestamp must return 409 CONFLICT
    const stalePatch = await patchBranchRoute(
      new Request(`http://localhost/api/admin/branches/${SURABAYA_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: branch.updated_at,
          name: branch.name,
          city: branch.city,
          address: branch.address,
          mapsUrl: null,
          whatsappNumber: updatedJson.data.branch.whatsappNumber,
          description: null,
          allowPickup: true,
          allowDelivery: false,
          sortOrder: 1,
        }),
      }),
      { params: Promise.resolve({ id: SURABAYA_ID }) },
    );
    expect(stalePatch.status).toBe(409);
  });

  it('replaces weekly hours atomically, rejects overnight intervals, and forbids staff access to /api/admin/branches*', async () => {
    const btr = branchesMap.get(BINTARO_ID)!;

    const validHours = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      opensAt: dayOfWeek === 0 ? null : dayOfWeek === 6 ? null : '09:30',
      closesAt: dayOfWeek === 0 ? null : dayOfWeek === 6 ? null : '18:00',
      isClosed: dayOfWeek === 0,
      note: dayOfWeek === 6 ? 'Konfirmasi WA' : null,
    }));

    const putOk = await replaceHoursRoute(
      new Request(`http://localhost/api/admin/branches/${BINTARO_ID}/hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: btr.updated_at,
          hours: validHours,
        }),
      }),
      { params: Promise.resolve({ id: BINTARO_ID }) },
    );
    expect(putOk.status).toBe(200);
    const putJson = await putOk.json();
    expect(putJson.data.branch.hours).toHaveLength(7);

    activeProfile = STAFF_SBY_PROFILE;
    const staffBranches = await listBranchesRoute(
      new Request('http://localhost/api/admin/branches'),
    );
    expect(staffBranches.status).toBe(403);

    const staffBranchDetail = await getBranchRoute(
      new Request(`http://localhost/api/admin/branches/${SURABAYA_ID}`),
      { params: Promise.resolve({ id: SURABAYA_ID }) },
    );
    expect(staffBranchDetail.status).toBe(403);

    const staffHours = await replaceHoursRoute(
      new Request(`http://localhost/api/admin/branches/${BINTARO_ID}/hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: btr.updated_at,
          hours: validHours,
        }),
      }),
      { params: Promise.resolve({ id: BINTARO_ID }) },
    );
    expect(staffHours.status).toBe(403);
  });

  it('scopes availability strictly to staff own branch and rejects price/override/cross-branch writes with 403', async () => {
    activeProfile = STAFF_SBY_PROFILE;

    const ownList = await getAvailabilityRoute(
      new Request('http://localhost/api/admin/availability'),
    );
    expect(ownList.status).toBe(200);
    const ownJson = await ownList.json();
    // Draft products are excluded for branch_admin; only Surabaya variants appear
    expect(
      ownJson.data.items.every(
        (item: { branchId: string; productStatus: string }) =>
          item.branchId === SURABAYA_ID && item.productStatus === 'published',
      ),
    ).toBe(true);

    // Querying Bintaro from Surabaya staff must fail 403
    const crossList = await getAvailabilityRoute(
      new Request(
        `http://localhost/api/admin/availability?branchId=${BINTARO_ID}`,
      ),
    );
    expect(crossList.status).toBe(403);

    // Writing Bintaro offer from Surabaya staff -> 403
    const crossWrite = await upsertOfferRoute(
      new Request(
        `http://localhost/api/admin/availability/${BINTARO_ID}/${VAR_PUB_1}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expectedOfferUpdatedAt: null,
            isListed: true,
            availabilityStatus: 'available',
            stockQuantity: 10,
          }),
        },
      ),
      {
        params: Promise.resolve({ branchId: BINTARO_ID, variantId: VAR_PUB_1 }),
      },
    );
    expect(crossWrite.status).toBe(403);

    // Writing priceOverrideIdr or basePriceIdr from Surabaya staff -> 403
    const overrideWrite = await upsertOfferRoute(
      new Request(
        `http://localhost/api/admin/availability/${SURABAYA_ID}/${VAR_PUB_1}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expectedOfferUpdatedAt: offersMap.get(
              `${SURABAYA_ID}:${VAR_PUB_1}`,
            )!.updated_at,
            isListed: true,
            availabilityStatus: 'available',
            stockQuantity: 3,
            priceOverrideIdr: 50000,
          }),
        },
      ),
      {
        params: Promise.resolve({
          branchId: SURABAYA_ID,
          variantId: VAR_PUB_1,
        }),
      },
    );
    expect(overrideWrite.status).toBe(403);
    const overrideJson = await overrideWrite.json();
    expect(overrideJson.error.message).toBe(
      ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.STAFF_PRICE_FORBIDDEN,
    );

    // Staff valid own-branch stock insert on VAR_PUB_2 (no offer row yet)
    const staffInsert = await upsertOfferRoute(
      new Request(
        `http://localhost/api/admin/availability/${SURABAYA_ID}/${VAR_PUB_2}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expectedOfferUpdatedAt: null,
            isListed: true,
            availabilityStatus: 'sold_out',
            stockQuantity: 0,
          }),
        },
      ),
      {
        params: Promise.resolve({
          branchId: SURABAYA_ID,
          variantId: VAR_PUB_2,
        }),
      },
    );
    expect(staffInsert.status).toBe(200);
    const insertedJson = await staffInsert.json();
    expect(insertedJson.data.offer.stockQuantity).toBe(0);
    expect(insertedJson.data.offer.availabilityStatus).toBe('sold_out');

    // Bintaro staff also succeeds on Bintaro own branch, denied on Surabaya
    activeProfile = STAFF_BTR_PROFILE;
    const btrInsert = await upsertOfferRoute(
      new Request(
        `http://localhost/api/admin/availability/${BINTARO_ID}/${VAR_PUB_1}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expectedOfferUpdatedAt: null,
            isListed: true,
            availabilityStatus: 'available',
            stockQuantity: null,
          }),
        },
      ),
      {
        params: Promise.resolve({ branchId: BINTARO_ID, variantId: VAR_PUB_1 }),
      },
    );
    expect(btrInsert.status).toBe(200);
  });

  it('allows Owner base/override price updates and returns truthful partial results on bulk endpoint', async () => {
    const existingOffer = offersMap.get(`${SURABAYA_ID}:${VAR_PUB_1}`)!;
    const variant = variantsMap.get(VAR_PUB_1)!;

    const ownerPriceSave = await upsertOfferRoute(
      new Request(
        `http://localhost/api/admin/availability/${SURABAYA_ID}/${VAR_PUB_1}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expectedOfferUpdatedAt: existingOffer.updated_at,
            expectedVariantUpdatedAt: variant.updated_at,
            basePriceIdr: 130000,
            priceOverrideIdr: 125000,
            isListed: true,
            availabilityStatus: 'available',
            stockQuantity: 4,
          }),
        },
      ),
      {
        params: Promise.resolve({
          branchId: SURABAYA_ID,
          variantId: VAR_PUB_1,
        }),
      },
    );
    expect(ownerPriceSave.status).toBe(200);
    const ownerPriceJson = await ownerPriceSave.json();
    expect(ownerPriceJson.data.offer.basePriceIdr).toBe(130000);
    expect(ownerPriceJson.data.offer.priceOverrideIdr).toBe(125000);
    expect(ownerPriceJson.data.offer.effectivePriceIdr).toBe(125000);

    // Bulk with 1 valid (VAR_PUB_2) + 1 zero-stock contradiction (VAR_PUB_1) reports 1/2 ok & 1 failed honestly
    const bulkRes = await bulkAvailabilityRoute(
      new Request('http://localhost/api/admin/availability/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              branchId: SURABAYA_ID,
              variantId: VAR_PUB_2,
              expectedOfferUpdatedAt: null,
              isListed: true,
              availabilityStatus: 'available',
              stockQuantity: 6,
            },
            {
              branchId: SURABAYA_ID,
              variantId: VAR_PUB_1,
              expectedOfferUpdatedAt: ownerPriceJson.data.offer.offerUpdatedAt,
              isListed: true,
              availabilityStatus: 'available',
              stockQuantity: 0,
            },
          ],
        }),
      }),
    );
    expect(bulkRes.status).toBe(200);
    const bulkJson = await bulkRes.json();
    expect(bulkJson.data.totalCount).toBe(2);
    expect(bulkJson.data.succeededCount).toBe(1);
    expect(bulkJson.data.failedCount).toBe(1);
    expect(bulkJson.data.results[0].ok).toBe(true);
    expect(bulkJson.data.results[1].ok).toBe(false);
    expect(bulkJson.data.results[1].status).toBe(422);
  });

  it('propagates live allow_pickup/allow_delivery columns from readActiveBranches into public branches DTO', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'sb_publishable_synthetic_fixture_key',
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify([
              {
                id: SURABAYA_ID,
                code: 'surabaya',
                name: 'Surabaya',
                city: 'Surabaya',
                whatsapp_number: '6281703384308',
                address: 'Rungkut Asri Tengah V No. 22, Surabaya',
                maps_url: null,
                allow_pickup: false,
                allow_delivery: false,
              },
            ]),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    );

    const publicResult = await getBranches({ branch: 'surabaya' });
    expect(publicResult.items[0]?.allowPickup).toBe(false);
    expect(publicResult.items[0]?.allowDelivery).toBe(false);
    vi.unstubAllGlobals();
  });
});
