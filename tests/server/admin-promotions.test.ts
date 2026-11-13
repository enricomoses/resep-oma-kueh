import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DELETE as archivePromotionRoute,
  PATCH as patchPromotionRoute,
} from '@/app/api/admin/promotions/[id]/route';
import {
  GET as listAdminPromotionsRoute,
  POST as createAdminPromotionRoute,
} from '@/app/api/admin/promotions/route';
import { PUT as putShippingBannerRoute } from '@/app/api/admin/promotions/shipping-banner/route';
import { GET as publicPromotionsRoute } from '@/app/api/promotions/route';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { CHECKOUT_WARNING_CODES } from '@/constants/checkout.constant';
import { AuthError, AuthForbiddenError } from '@/features/auth/errors.server';
import { prepareCheckoutQuote } from '@/features/checkout/service.server';
import type { AdminSessionProfile } from '@/types/auth';
import { formatJakartaDateIso } from '@/utils/checkout';

const OWNER_ID = 'f1900000-0000-4000-8000-000000000001';
const STAFF_ID = 'f1900000-0000-4000-8000-000000000002';
const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const CAT_ID = 'c1900000-0000-4000-8000-000000000001';
const PROD_ID = 'a1900000-0000-4000-8000-000000000001';
const VAR_ID = 'b1900000-0000-4000-8000-000000000001';

interface MockPromotionRecord {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_idr: number | null;
  min_spend_idr: number;
  scope: 'all' | 'category' | 'product' | 'variant';
  starts_at: string;
  ends_at: string;
  priority: number;
  status: 'draft' | 'published' | 'archived';
  is_enabled: boolean;
  is_stackable: boolean;
  banner_image_path: string | null;
  created_at: string;
  updated_at: string;
  promotion_branches: { branch_id: string }[];
  promotion_categories: { category_id: string }[];
  promotion_products: { product_id: string }[];
  promotion_variants: { variant_id: string }[];
}

const mockState = vi.hoisted(() => ({
  actor: 'owner' as 'anon' | 'owner' | 'staff',
  tick: 1,
  promotions: [] as MockPromotionRecord[],
  shippingBanner: null as {
    key: string;
    content_json: { title: string; body: string };
    status: 'draft' | 'published';
    updated_at: string;
  } | null,
  promoteFailNext: false,
  rpcForceError: null as { code: string; message: string } | null,
  cleanupCalls: [] as { bucket: string; path: string; reason: string }[],
}));

function nextTimestamp() {
  mockState.tick += 1;
  return `2026-11-13T08:${String(mockState.tick).padStart(2, '0')}:00.000Z`;
}

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/features/auth/csrf.server', () => ({
  assertSameOriginRequest: vi.fn(),
}));

vi.mock('@/features/auth/admin-guard.server', () => ({
  requireApiAdmin: vi.fn(
    async ({ roles }: { roles?: readonly ('owner' | 'branch_admin')[] }) => {
      if (mockState.actor === 'anon') {
        throw new AuthError(
          'Silakan login terlebih dahulu.',
          'UNAUTHENTICATED',
          401,
        );
      }
      const profile: AdminSessionProfile =
        mockState.actor === 'owner'
          ? {
              userId: OWNER_ID,
              email: 'owner@resepomakueh.example',
              displayName: 'Owner Oma',
              role: 'owner',
              branchId: null,
              branchCode: null,
              branchName: null,
            }
          : {
              userId: STAFF_ID,
              email: 'staff@resepomakueh.example',
              displayName: 'Staf SBY',
              role: 'branch_admin',
              branchId: SURABAYA_ID,
              branchCode: 'surabaya',
              branchName: 'Surabaya',
            };
      if (roles && !roles.includes(profile.role)) {
        throw new AuthForbiddenError(
          ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.OWNER_ONLY,
        );
      }
      return profile;
    },
  ),
}));

vi.mock('@/features/admin-catalog/media.server', () => ({
  promoteDraftMediaToPublicBucket: vi.fn(
    async (_profile: AdminSessionProfile, draftPath: string) => {
      if (mockState.promoteFailNext) {
        mockState.promoteFailNext = false;
        throw new Error('upload failed');
      }
      const slug = draftPath
        .replace(/^drafts\//, '')
        .replace(/[^a-z0-9.]/gi, '');
      return {
        storageBucket: 'product-images' as const,
        storagePath: `approved/promo-${slug}`,
      };
    },
  ),
  resolveAdminMediaPreviewUrl: vi.fn(
    async (_bucket: string, path: string) => `https://cdn.example.com/${path}`,
  ),
  cleanupOrphanStorageObjects: vi.fn(
    async (
      _profile: AdminSessionProfile,
      targets: { storageBucket: string; storagePath: string }[],
      reason: string,
    ) => {
      for (const t of targets) {
        mockState.cleanupCalls.push({
          bucket: t.storageBucket,
          path: t.storagePath,
          reason,
        });
      }
      return { deletedCount: targets.length, skippedReferencedCount: 0 };
    },
  ),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerAuthClient: vi.fn(async () => ({
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://cdn.example.com/${path}` },
        }),
      }),
    },
    rpc: vi.fn(
      async (
        fn: string,
        args: {
          p_promotion_id?: string | null;
          p_expected_updated_at?: string | null;
          p_payload?: {
            title: string;
            slug: string;
            description: string | null;
            discountType: 'percentage' | 'fixed';
            discountValue: number;
            maxDiscountIdr: number | null;
            minSpendIdr: number;
            scope: 'all' | 'category' | 'product' | 'variant';
            startsAt: string;
            endsAt: string;
            priority: number;
            status: 'draft' | 'published' | 'archived';
            isEnabled: boolean;
            isStackable: boolean;
            bannerImagePath: string | null;
            branchIds: string[];
            categoryIds: string[];
            productIds: string[];
            variantIds: string[];
          };
        },
      ) => {
        if (mockState.rpcForceError) {
          const err = mockState.rpcForceError;
          mockState.rpcForceError = null;
          return { data: null, error: err };
        }

        if (fn === 'archive_admin_promotion') {
          const existing = mockState.promotions.find(
            (item) => item.id === args.p_promotion_id,
          );
          if (!existing) {
            return {
              data: null,
              error: { code: 'P0002', message: 'promotion_not_found' },
            };
          }
          if (existing.updated_at !== args.p_expected_updated_at) {
            return {
              data: null,
              error: { code: '40900', message: 'stale_conflict' },
            };
          }
          existing.status = 'archived';
          existing.is_enabled = false;
          existing.updated_at = nextTimestamp();
          return {
            data: { id: existing.id, updatedAt: existing.updated_at },
            error: null,
          };
        }

        const payload = args.p_payload!;
        if (
          payload.status === 'published' &&
          ((payload.scope === 'category' && payload.categoryIds.length === 0) ||
            (payload.scope === 'product' && payload.productIds.length === 0) ||
            (payload.scope === 'variant' && payload.variantIds.length === 0))
        ) {
          return {
            data: null,
            error: { code: '23514', message: 'promotion_target_mismatch' },
          };
        }

        if (!args.p_promotion_id) {
          if (mockState.promotions.some((p) => p.slug === payload.slug)) {
            return {
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key promotions_slug',
              },
            };
          }
          const ts = nextTimestamp();
          const created: MockPromotionRecord = {
            id: `d1900000-0000-4000-8000-${String(mockState.promotions.length + 1).padStart(12, '0')}`,
            title: payload.title,
            slug: payload.slug,
            description: payload.description,
            discount_type: payload.discountType,
            discount_value: payload.discountValue,
            max_discount_idr: payload.maxDiscountIdr,
            min_spend_idr: payload.minSpendIdr,
            scope: payload.scope,
            starts_at: payload.startsAt,
            ends_at: payload.endsAt,
            priority: payload.priority,
            status: payload.status,
            is_enabled: payload.isEnabled,
            is_stackable: false,
            banner_image_path: payload.bannerImagePath,
            created_at: ts,
            updated_at: ts,
            promotion_branches: payload.branchIds.map((branch_id) => ({
              branch_id,
            })),
            promotion_categories: payload.categoryIds.map((category_id) => ({
              category_id,
            })),
            promotion_products: payload.productIds.map((product_id) => ({
              product_id,
            })),
            promotion_variants: payload.variantIds.map((variant_id) => ({
              variant_id,
            })),
          };
          mockState.promotions.push(created);
          return {
            data: { id: created.id, updatedAt: created.updated_at },
            error: null,
          };
        }

        const existing = mockState.promotions.find(
          (item) => item.id === args.p_promotion_id,
        );
        if (!existing) {
          return {
            data: null,
            error: { code: 'P0002', message: 'promotion_not_found' },
          };
        }
        if (existing.updated_at !== args.p_expected_updated_at) {
          return {
            data: null,
            error: { code: '40900', message: 'stale_conflict' },
          };
        }
        existing.title = payload.title;
        existing.description = payload.description;
        existing.discount_type = payload.discountType;
        existing.discount_value = payload.discountValue;
        existing.max_discount_idr = payload.maxDiscountIdr;
        existing.min_spend_idr = payload.minSpendIdr;
        existing.scope = payload.scope;
        existing.starts_at = payload.startsAt;
        existing.ends_at = payload.endsAt;
        existing.priority = payload.priority;
        existing.status = payload.status;
        existing.is_enabled = payload.isEnabled;
        existing.banner_image_path = payload.bannerImagePath;
        existing.promotion_branches = payload.branchIds.map((branch_id) => ({
          branch_id,
        }));
        existing.promotion_categories = payload.categoryIds.map(
          (category_id) => ({ category_id }),
        );
        existing.promotion_products = payload.productIds.map((product_id) => ({
          product_id,
        }));
        existing.promotion_variants = payload.variantIds.map((variant_id) => ({
          variant_id,
        }));
        existing.updated_at = nextTimestamp();

        return {
          data: { id: existing.id, updatedAt: existing.updated_at },
          error: null,
        };
      },
    ),
    from: (table: string) => {
      if (table === 'promotions') {
        const filters: Record<string, string> = {};
        const builder = {
          select: () => builder,
          order: () => builder,
          limit: async () => ({ data: [...mockState.promotions], error: null }),
          eq: (col: string, val: string) => {
            filters[col] = val;
            return builder;
          },
          maybeSingle: async () => ({
            data: mockState.promotions.find((p) => p.id === filters.id) ?? null,
            error: null,
          }),
        };
        return builder;
      }

      if (table === 'site_content') {
        const filters: Record<string, string> = {};
        let updatePayload: {
          content_json: { title: string; body: string };
          status: 'draft' | 'published';
        } | null = null;

        const builder = {
          select: () => builder,
          eq: (col: string, val: string) => {
            filters[col] = val;
            return builder;
          },
          update: (vals: {
            content_json: { title: string; body: string };
            status: 'draft' | 'published';
          }) => {
            updatePayload = vals;
            return builder;
          },
          insert: (vals: {
            key: string;
            content_json: { title: string; body: string };
            status: 'draft' | 'published';
          }) => {
            mockState.shippingBanner = {
              key: vals.key,
              content_json: vals.content_json,
              status: vals.status,
              updated_at: nextTimestamp(),
            };
            return {
              select: () => ({
                single: async () => ({
                  data: mockState.shippingBanner,
                  error: null,
                }),
              }),
            };
          },
          maybeSingle: async () => {
            if (updatePayload) {
              if (
                !mockState.shippingBanner ||
                (filters.updated_at &&
                  mockState.shippingBanner.updated_at !== filters.updated_at)
              ) {
                return { data: null, error: null };
              }
              mockState.shippingBanner = {
                ...mockState.shippingBanner,
                ...updatePayload,
                updated_at: nextTimestamp(),
              };
              return { data: mockState.shippingBanner, error: null };
            }
            return {
              data: mockState.shippingBanner,
              error: null,
            };
          },
        };
        return builder;
      }

      if (table === 'branches') {
        return {
          select: () => ({
            order: () => ({
              limit: async () => ({
                data: [
                  {
                    id: SURABAYA_ID,
                    code: 'surabaya',
                    name: 'Surabaya',
                    is_active: true,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === 'categories') {
        return {
          select: () => ({
            order: () => ({
              order: () => ({
                limit: async () => ({
                  data: [
                    {
                      id: CAT_ID,
                      name: 'Chiffon Cake',
                      slug: 'chiffon-cake',
                      status: 'published',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      if (table === 'products') {
        return {
          select: () => ({
            order: () => ({
              order: () => ({
                limit: async () => ({
                  data: [
                    {
                      id: PROD_ID,
                      name: 'Pandan Chiffon',
                      slug: 'pandan-chiffon',
                      status: 'published',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      if (table === 'product_variants') {
        return {
          select: () => ({
            order: () => ({
              limit: async () => ({
                data: [
                  {
                    id: VAR_ID,
                    sku: 'ROK-PANDAN-20',
                    name: 'Whole 20cm',
                    status: 'active',
                    products: { name: 'Pandan Chiffon', status: 'published' },
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected admin table ${table}`);
    },
  })),
}));

vi.mock('@/lib/supabase/public-read.server', () => ({
  createPublicReadClient: vi.fn(() => ({
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://cdn.example.com/${path}` },
        }),
      }),
    },
    from: (table: string) => {
      if (table === 'branches') {
        const branchRows = [
          {
            id: SURABAYA_ID,
            code: 'surabaya',
            name: 'Surabaya',
            city: 'Surabaya',
            whatsapp_number: '6281703384308',
            address: 'Rungkut Asri Tengah V No. 22, Surabaya',
            maps_url: 'https://maps.google.com/?q=Surabaya',
            allow_pickup: true,
            allow_delivery: true,
          },
        ];
        const builder = {
          select: () => builder,
          eq: () => builder,
          retry: () => builder,
          order: () => builder,
          limit: () => builder,
          abortSignal: async () => ({ data: branchRows, error: null }),
        };
        return builder;
      }

      if (table === 'promotions') {
        const builder = {
          select: () => builder,
          eq: () => builder,
          retry: () => builder,
          order: () => builder,
          limit: () => builder,
          abortSignal: async () => ({
            data: mockState.promotions.filter(
              (p) => p.status === 'published' && p.is_enabled,
            ),
            error: null,
          }),
        };
        return builder;
      }

      if (table === 'site_content') {
        const builder = {
          select: () => builder,
          eq: () => builder,
          retry: () => builder,
          abortSignal: () => builder,
          maybeSingle: async () => ({
            data:
              mockState.shippingBanner &&
              mockState.shippingBanner.status === 'published'
                ? mockState.shippingBanner
                : null,
            error: null,
          }),
        };
        return builder;
      }

      if (table === 'product_variants') {
        const variantRow = {
          id: VAR_ID,
          sku: 'ROK-PANDAN-20',
          name: 'Whole 20cm',
          size_label: '20cm',
          base_price_idr: 100_000,
          status: 'active',
          max_quantity_per_order: 20,
          bundle_recipe: null,
          bundle_units_total: null,
          bundle_rules_verified: false,
          products: {
            id: PROD_ID,
            name: 'Pandan Chiffon',
            slug: 'pandan-chiffon',
            product_type: 'simple',
            status: 'published',
            product_categories: [{ category_id: CAT_ID, is_primary: true }],
            product_images: [
              { alt_text: 'Pandan', is_primary: true, sort_order: 1 },
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
          bundle_fixed_components: [],
          option_groups: [],
        };
        const builder = {
          select: () => builder,
          in: () => builder,
          eq: () => builder,
          retry: () => builder,
          abortSignal: async () => ({ data: [variantRow], error: null }),
        };
        return builder;
      }

      throw new Error(`Unexpected public table ${table}`);
    },
  })),
}));

describe('F19 Admin Promotions API, Public API & Checkout Review Sync', () => {
  beforeEach(() => {
    mockState.actor = 'owner';
    mockState.tick = 1;
    mockState.promotions = [];
    mockState.shippingBanner = null;
    mockState.rpcForceError = null;
    mockState.cleanupCalls = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('denies anon (401) and staff (403) on owner-only promotion routes', async () => {
    mockState.actor = 'anon';
    const anonRes = await listAdminPromotionsRoute(
      new Request('http://localhost/api/admin/promotions'),
    );
    expect(anonRes.status).toBe(401);

    mockState.actor = 'staff';
    const staffGet = await listAdminPromotionsRoute(
      new Request('http://localhost/api/admin/promotions'),
    );
    expect(staffGet.status).toBe(403);

    const staffPost = await createAdminPromotionRoute(
      new Request('http://localhost/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(staffPost.status).toBe(403);

    const staffBanner = await putShippingBannerRoute(
      new Request('http://localhost/api/admin/promotions/shipping-banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(staffBanner.status).toBe(403);
  });

  it('creates, updates with stale lock check, cleans orphan banner on RPC failure, and soft-archives promotions', async () => {
    const now = new Date();
    const startsAt = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const endsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

    // Fail DB RPC after banner draft promotion -> must trigger orphan cleanup!
    mockState.rpcForceError = {
      code: '23514',
      message: 'promotion_target_mismatch',
    };
    const failedCreate = await createAdminPromotionRoute(
      new Request('http://localhost/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: null,
          title: 'Promo Gagal',
          slug: 'promo-gagal',
          description: null,
          discountType: 'percentage',
          discountValue: 10,
          maxDiscountIdr: null,
          minSpendIdr: 0,
          scope: 'category',
          startsAt,
          endsAt,
          priority: 1,
          status: 'published',
          isEnabled: true,
          isStackable: false,
          bannerImagePath: null,
          bannerDraftPath: 'drafts/banner-1.webp',
          branchIds: [],
          categoryIds: [CAT_ID],
          productIds: [],
          variantIds: [],
        }),
      }),
    );
    expect(failedCreate.status).toBe(422);
    expect(mockState.cleanupCalls).toHaveLength(1);
    expect(mockState.cleanupCalls[0].reason).toBe('removed_from_promotion');

    // Valid owner creation
    const createRes = await createAdminPromotionRoute(
      new Request('http://localhost/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: null,
          title: 'Promo Akhir Pekan',
          slug: 'promo-akhir-pekan',
          description: 'Potongan langsung produk pandan',
          discountType: 'percentage',
          discountValue: 15,
          maxDiscountIdr: 20_000,
          minSpendIdr: 0,
          scope: 'product',
          startsAt,
          endsAt,
          priority: 10,
          status: 'published',
          isEnabled: true,
          isStackable: false,
          bannerImagePath: null,
          branchIds: [],
          categoryIds: [],
          productIds: [PROD_ID],
          variantIds: [],
        }),
      }),
    );
    expect(createRes.status).toBe(201);
    const createdJson = await createRes.json();
    const created = createdJson.data.promotion;
    expect(created.clockState).toBe('active');

    // Stale conflict 409 on PATCH
    const stalePatch = await patchPromotionRoute(
      new Request(`http://localhost/api/admin/promotions/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: '2026-01-01T00:00:00.000Z',
          title: 'Stale Title',
          slug: created.slug,
          description: created.description,
          discountType: created.discountType,
          discountValue: created.discountValue,
          maxDiscountIdr: created.maxDiscountIdr,
          minSpendIdr: created.minSpendIdr,
          scope: created.scope,
          startsAt: created.startsAt,
          endsAt: created.endsAt,
          priority: created.priority,
          status: created.status,
          isEnabled: created.isEnabled,
          isStackable: false,
          bannerImagePath: created.bannerImagePath,
          branchIds: created.branchIds,
          categoryIds: created.categoryIds,
          productIds: created.productIds,
          variantIds: created.variantIds,
        }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(stalePatch.status).toBe(409);

    // Soft-archive DELETE -> status = archived, isEnabled = false
    const archiveRes = await archivePromotionRoute(
      new Request(`http://localhost/api/admin/promotions/${created.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedUpdatedAt: created.updatedAt }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(archiveRes.status).toBe(200);
    const archivedJson = await archiveRes.json();
    expect(archivedJson.data.promotion.status).toBe('archived');
    expect(archivedJson.data.promotion.isEnabled).toBe(false);
  });

  it('publishes shipping banner separately from shipping calculation and triggers checkout PRICE_CHANGED review when promo changes', async () => {
    const now = new Date();
    const startsAt = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const endsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

    // 1. Draft shipping banner stays hidden from public API
    const draftBannerRes = await putShippingBannerRoute(
      new Request('http://localhost/api/admin/promotions/shipping-banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: null,
          title: 'Info Ongkir',
          body: 'Dikonfirmasi manual oleh admin WA.',
          status: 'draft',
        }),
      }),
    );
    expect(draftBannerRes.status).toBe(200);
    const draftBannerJson = await draftBannerRes.json();

    const publicBeforePublish = await publicPromotionsRoute(
      new Request('http://localhost/api/promotions?branch=surabaya'),
    );
    expect(publicBeforePublish.status).toBe(200);
    expect((await publicBeforePublish.json()).data.shippingBanner).toBeNull();

    // 2. Publish shipping banner -> visible publicly, never computes shipping fee in checkout
    await putShippingBannerRoute(
      new Request('http://localhost/api/admin/promotions/shipping-banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: draftBannerJson.data.shippingBanner.updatedAt,
          title: 'Info Ongkir',
          body: 'Dikonfirmasi manual oleh admin WA.',
          status: 'published',
        }),
      }),
    );

    // 3. Create active 10% promo -> prepare initial checkout quote -> update promo to 20% -> reprepare returns PRICE_CHANGED + requiresReview=true
    const promoRes = await createAdminPromotionRoute(
      new Request('http://localhost/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: null,
          title: 'Diskon Pandan 10%',
          slug: 'diskon-pandan',
          description: null,
          discountType: 'percentage',
          discountValue: 10,
          maxDiscountIdr: null,
          minSpendIdr: 0,
          scope: 'all',
          startsAt,
          endsAt,
          priority: 5,
          status: 'published',
          isEnabled: true,
          isStackable: false,
          bannerImagePath: null,
          branchIds: [SURABAYA_ID],
          categoryIds: [],
          productIds: [],
          variantIds: [],
        }),
      }),
    );
    const createdPromo = (await promoRes.json()).data.promotion;

    const tomorrowJakarta = formatJakartaDateIso(
      new Date(now.getTime() + 24 * 60 * 60 * 1000),
    );
    const baseCheckoutReq = {
      branchId: SURABAYA_ID,
      items: [{ variantId: VAR_ID, quantity: 1, choiceIds: [] }],
      fulfillment: {
        method: 'pickup' as const,
        requestedDate: tomorrowJakarta,
        requestedTimeWindow: null,
        address: null,
        note: null,
      },
      customerName: 'Ibu Sari',
      acknowledgedManualConfirmation: true as const,
      expectedQuoteFingerprint: null,
    };

    const firstQuote = await prepareCheckoutQuote(baseCheckoutReq);
    expect(firstQuote.discountIdr).toBe(10_000);
    expect(firstQuote.shippingFee).toBe('to_be_confirmed');
    expect(firstQuote.requiresReview).toBe(true);

    // Owner updates promo from 10% to 20% between review & confirm
    await patchPromotionRoute(
      new Request(`http://localhost/api/admin/promotions/${createdPromo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedUpdatedAt: createdPromo.updatedAt,
          title: 'Diskon Pandan 20%',
          slug: createdPromo.slug,
          description: null,
          discountType: 'percentage',
          discountValue: 20,
          maxDiscountIdr: null,
          minSpendIdr: 0,
          scope: 'all',
          startsAt,
          endsAt,
          priority: 5,
          status: 'published',
          isEnabled: true,
          isStackable: false,
          bannerImagePath: null,
          branchIds: [SURABAYA_ID],
          categoryIds: [],
          productIds: [],
          variantIds: [],
        }),
      }),
      { params: Promise.resolve({ id: createdPromo.id }) },
    );

    const reprepareQuote = await prepareCheckoutQuote({
      ...baseCheckoutReq,
      expectedQuoteFingerprint: firstQuote.quoteFingerprint,
    });
    expect(reprepareQuote.discountIdr).toBe(20_000);
    expect(reprepareQuote.requiresReview).toBe(true);
    expect(
      reprepareQuote.warnings.some(
        (w) => w.code === CHECKOUT_WARNING_CODES.PRICE_CHANGED,
      ),
    ).toBe(true);

    const publicAfterPublish = await publicPromotionsRoute(
      new Request('http://localhost/api/promotions?branch=surabaya'),
    );
    const publicJson = await publicAfterPublish.json();
    expect(publicJson.data.promotions).toHaveLength(1);
    expect(publicJson.data.shippingBanner?.title).toBe('Info Ongkir');

    const badParamRes = await publicPromotionsRoute(
      new Request('http://localhost/api/promotions?branch=surabaya&extra=1'),
    );
    expect(badParamRes.status).toBe(400);
  });
});
