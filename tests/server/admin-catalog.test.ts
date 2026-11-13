import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DELETE as archiveCategoryRoute,
  GET as getCategoryRoute,
  PATCH as patchCategoryRoute,
} from '@/app/api/admin/categories/[id]/route';
import {
  GET as listCategoriesRoute,
  POST as createCategoryRoute,
} from '@/app/api/admin/categories/route';
import { GET as overviewRoute } from '@/app/api/admin/overview/route';
import {
  DELETE as archiveProductRoute,
  GET as getProductRoute,
  PATCH as patchProductRoute,
} from '@/app/api/admin/products/[id]/route';
import {
  GET as listProductsRoute,
  POST as createProductRoute,
} from '@/app/api/admin/products/route';
import { GET as publicCategoriesRoute } from '@/app/api/categories/route';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';

const OWNER_ID = 'f1600000-0000-4000-8000-000000000001';
const STAFF_ID = 'f1600000-0000-4000-8000-000000000002';
const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const CAT_PUB_ID = 'c1600000-0000-4000-8000-000000000001';
const CAT_DRAFT_ID = 'c1600000-0000-4000-8000-000000000002';
const PROD_READY_ID = 'a1600000-0000-4000-8000-000000000001';
const PROD_DRAFT_ID = 'a1600000-0000-4000-8000-000000000002';

interface FakeCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  cover_image_path: string | null;
  sort_order: number;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

interface FakeProduct {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  ingredients_info: string | null;
  storage_instructions: string | null;
  product_type: 'simple' | 'variants' | 'bundle';
  is_featured: boolean;
  is_best_seller: boolean;
  is_new: boolean;
  status: 'draft' | 'published' | 'archived';
  needs_owner_review: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_categories: {
    category_id: string;
    product_id: string;
    is_primary: boolean;
  }[];
  product_variants: {
    id: string;
    status: string;
    branch_variant_offers: {
      branch_id: string;
      is_listed: boolean;
      availability_status: string;
      branches: { is_active: boolean };
    }[];
  }[];
  product_images: {
    id: string;
    variant_id: string | null;
    is_approved: boolean;
    alt_text: string | null;
  }[];
}

const mockDb = vi.hoisted(() => ({
  activeActor: 'owner' as 'anon' | 'owner' | 'staff',
  tick: 100,
  categories: [] as FakeCategory[],
  products: [] as FakeProduct[],
  branches: [{ id: 'f0400000-0000-4000-8000-000000000001', is_active: true }],
  promotions: [
    {
      id: 'pr1',
      status: 'published',
      is_enabled: true,
      starts_at: '2026-01-01T00:00:00Z',
      ends_at: '2027-01-01T00:00:00Z',
    },
  ],
  classSessions: [
    {
      id: 'cs1',
      branch_id: 'f0400000-0000-4000-8000-000000000001',
      status: 'scheduled',
      starts_at: '2027-01-15T00:00:00Z',
    },
  ],
}));

function resetDb() {
  mockDb.activeActor = 'owner';
  mockDb.tick = 100;
  mockDb.categories = [
    {
      id: CAT_PUB_ID,
      name: 'Chiffon Cakes',
      slug: 'chiffon-cakes',
      parent_id: null,
      description: 'Signature airy chiffon',
      cover_image_path: null,
      sort_order: 1,
      status: 'published',
      created_at: '2026-11-10T01:00:00.000Z',
      updated_at: '2026-11-10T01:00:00.000Z',
    },
    {
      id: CAT_DRAFT_ID,
      name: 'Seasonal Hampers',
      slug: 'seasonal-hampers',
      parent_id: null,
      description: null,
      cover_image_path: null,
      sort_order: 2,
      status: 'draft',
      created_at: '2026-11-10T01:00:00.000Z',
      updated_at: '2026-11-10T01:00:00.000Z',
    },
  ];
  mockDb.products = [
    {
      id: PROD_READY_ID,
      name: 'Chiffon Pandan',
      slug: 'chiffon-pandan',
      short_description: 'Pandan harum',
      description: 'Deskripsi lengkap',
      ingredients_info: 'Telur, terigu',
      storage_instructions: 'Suhu ruang 2 hari',
      product_type: 'simple',
      is_featured: true,
      is_best_seller: true,
      is_new: false,
      status: 'draft',
      needs_owner_review: false,
      sort_order: 1,
      created_at: '2026-11-10T02:00:00.000Z',
      updated_at: '2026-11-10T02:00:00.000Z',
      product_categories: [
        {
          category_id: CAT_PUB_ID,
          product_id: PROD_READY_ID,
          is_primary: true,
        },
      ],
      product_variants: [
        {
          id: 'v1',
          status: 'active',
          branch_variant_offers: [
            {
              branch_id: SURABAYA_ID,
              is_listed: true,
              availability_status: 'available',
              branches: { is_active: true },
            },
          ],
        },
      ],
      product_images: [
        {
          id: 'img1',
          variant_id: null,
          is_approved: true,
          alt_text: 'Chiffon Pandan utuh',
        },
      ],
    },
    {
      id: PROD_DRAFT_ID,
      name: 'Spikoe Draft Baru',
      slug: 'spikoe-draft-baru',
      short_description: null,
      description: null,
      ingredients_info: null,
      storage_instructions: null,
      product_type: 'variants',
      is_featured: false,
      is_best_seller: false,
      is_new: false,
      status: 'draft',
      needs_owner_review: true,
      sort_order: 2,
      created_at: '2026-11-10T02:05:00.000Z',
      updated_at: '2026-11-10T02:05:00.000Z',
      product_categories: [],
      product_variants: [],
      product_images: [],
    },
  ];
}

function nextTimestamp() {
  mockDb.tick += 1;
  return `2026-11-13T10:00:${String(mockDb.tick % 60).padStart(2, '0')}.${String(mockDb.tick).padStart(3, '0')}Z`;
}

function buildProductWithNested(product: FakeProduct) {
  return {
    ...product,
    product_categories: product.product_categories.map((pc) => {
      const cat =
        mockDb.categories.find((c) => c.id === pc.category_id) ?? null;
      return {
        is_primary: pc.is_primary,
        categories: cat
          ? { id: cat.id, name: cat.name, slug: cat.slug, status: cat.status }
          : null,
      };
    }),
  };
}

function createFakeClient(publicOnly = false) {
  return {
    auth: {
      getClaims: async () => {
        if (mockDb.activeActor === 'anon' || publicOnly) {
          return { data: null, error: { message: 'none' } };
        }
        const sub = mockDb.activeActor === 'owner' ? OWNER_ID : STAFF_ID;
        return { data: { claims: { sub } }, error: null };
      },
      getUser: async () => {
        if (mockDb.activeActor === 'anon' || publicOnly) {
          return { data: { user: null }, error: { message: 'none' } };
        }
        const id = mockDb.activeActor === 'owner' ? OWNER_ID : STAFF_ID;
        return {
          data: {
            user: {
              id,
              email: `${mockDb.activeActor}@example.invalid`,
            },
          },
          error: null,
        };
      },
    },
    from: (table: string) => {
      const filters: Record<string, unknown> = {};
      const neqFilters: Record<string, unknown> = {};
      const inFilters: Record<string, unknown[]> = {};
      let selectOptions: { count?: string; head?: boolean } | undefined;
      let op: 'select' | 'insert' | 'update' = 'select';
      let mutationPayload: Record<string, unknown> = {};

      const execute = async (): Promise<{
        data: unknown;
        error: { code?: string; message?: string } | null;
        count?: number;
      }> => {
        if (table === 'admin_profiles') {
          if (mockDb.activeActor === 'owner') {
            return {
              data: {
                user_id: OWNER_ID,
                display_name: 'Oma Owner',
                role: 'owner',
                branch_id: null,
                is_active: true,
                branches: null,
              },
              error: null,
            };
          }
          if (mockDb.activeActor === 'staff') {
            return {
              data: {
                user_id: STAFF_ID,
                display_name: 'Admin Surabaya',
                role: 'branch_admin',
                branch_id: SURABAYA_ID,
                is_active: true,
                branches: {
                  id: SURABAYA_ID,
                  code: 'surabaya',
                  name: 'Surabaya',
                  is_active: true,
                },
              },
              error: null,
            };
          }
          return { data: null, error: null };
        }

        if (table === 'categories') {
          if (op === 'insert') {
            const slug = String(mutationPayload.slug ?? '');
            if (mockDb.categories.some((c) => c.slug === slug)) {
              return {
                data: null,
                error: { code: '23505', message: 'duplicate key' },
              };
            }
            const ts = nextTimestamp();
            const created: FakeCategory = {
              id: `c1600000-0000-4000-8000-${String(mockDb.tick).padStart(12, '0')}`,
              name: String(mutationPayload.name),
              slug,
              parent_id: (mutationPayload.parent_id as string | null) ?? null,
              description:
                (mutationPayload.description as string | null) ?? null,
              cover_image_path: null,
              sort_order: Number(mutationPayload.sort_order ?? 0),
              status:
                (mutationPayload.status as FakeCategory['status']) ?? 'draft',
              created_at: ts,
              updated_at: ts,
            };
            mockDb.categories.push(created);
            return { data: created, error: null };
          }

          if (op === 'update') {
            const id = String(filters.id ?? '');
            const expUpdatedAt = filters.updated_at as string | undefined;
            const idx = mockDb.categories.findIndex(
              (c) =>
                c.id === id &&
                (expUpdatedAt === undefined || c.updated_at === expUpdatedAt),
            );
            if (idx === -1) {
              return { data: null, error: null };
            }
            const nextCat: FakeCategory = {
              ...mockDb.categories[idx],
              ...mutationPayload,
              updated_at: nextTimestamp(),
            } as FakeCategory;
            mockDb.categories[idx] = nextCat;
            return { data: nextCat, error: null };
          }

          let list = [...mockDb.categories];
          if (publicOnly) {
            list = list.filter((c) => c.status === 'published');
          }
          if (filters.status) {
            list = list.filter((c) => c.status === filters.status);
          }
          if (filters.id) {
            list = list.filter((c) => c.id === filters.id);
          }
          list.sort(
            (a, b) =>
              a.sort_order - b.sort_order ||
              a.name.localeCompare(b.name) ||
              a.id.localeCompare(b.id),
          );
          if (selectOptions?.head) {
            return { data: null, error: null, count: list.length };
          }
          return { data: list, error: null, count: list.length };
        }

        if (table === 'product_categories') {
          const allLinks = mockDb.products.flatMap((p) =>
            p.product_categories.map((pc) => ({
              ...pc,
              products: { id: p.id, status: p.status },
              categories:
                mockDb.categories.find((c) => c.id === pc.category_id) ?? null,
            })),
          );
          let list = allLinks;
          if (filters.category_id) {
            list = list.filter((l) => l.category_id === filters.category_id);
          }
          if (filters['products.status']) {
            list = list.filter(
              (l) => l.products.status === filters['products.status'],
            );
          }
          if (filters['categories.status']) {
            list = list.filter(
              (l) => l.categories?.status === filters['categories.status'],
            );
          }
          if (inFilters.product_id) {
            list = list.filter((l) =>
              inFilters.product_id.includes(l.product_id),
            );
          }
          return { data: list, error: null };
        }

        if (table === 'products') {
          if (op === 'insert') {
            const slug = String(mutationPayload.slug ?? '');
            if (mockDb.products.some((p) => p.slug === slug)) {
              return {
                data: null,
                error: { code: '23505', message: 'duplicate key' },
              };
            }
            const ts = nextTimestamp();
            const created: FakeProduct = {
              id: `a1600000-0000-4000-8000-${String(mockDb.tick).padStart(12, '0')}`,
              name: String(mutationPayload.name),
              slug,
              short_description:
                (mutationPayload.short_description as string | null) ?? null,
              description:
                (mutationPayload.description as string | null) ?? null,
              ingredients_info:
                (mutationPayload.ingredients_info as string | null) ?? null,
              storage_instructions:
                (mutationPayload.storage_instructions as string | null) ?? null,
              product_type:
                (mutationPayload.product_type as FakeProduct['product_type']) ??
                'simple',
              is_featured: Boolean(mutationPayload.is_featured),
              is_best_seller: Boolean(mutationPayload.is_best_seller),
              is_new: Boolean(mutationPayload.is_new),
              status:
                (mutationPayload.status as FakeProduct['status']) ?? 'draft',
              needs_owner_review: Boolean(
                mutationPayload.needs_owner_review ?? true,
              ),
              sort_order: Number(mutationPayload.sort_order ?? 0),
              created_at: ts,
              updated_at: ts,
              product_categories: [],
              product_variants: [],
              product_images: [],
            };
            mockDb.products.push(created);
            return { data: created, error: null };
          }

          if (op === 'update') {
            const id = String(filters.id ?? '');
            const expUpdatedAt = filters.updated_at as string | undefined;
            const idx = mockDb.products.findIndex(
              (p) =>
                p.id === id &&
                (expUpdatedAt === undefined || p.updated_at === expUpdatedAt),
            );
            if (idx === -1) {
              return { data: null, error: null };
            }
            const updated: FakeProduct = {
              ...mockDb.products[idx],
              ...mutationPayload,
              updated_at: nextTimestamp(),
            } as FakeProduct;
            mockDb.products[idx] = updated;
            return { data: updated, error: null };
          }

          let list = [...mockDb.products];
          if (publicOnly) {
            list = list.filter((p) => p.status === 'published');
          }
          if (filters.status) {
            list = list.filter((p) => p.status === filters.status);
          }
          if (filters.id) {
            list = list.filter((p) => p.id === filters.id);
          }
          if (filters.needs_owner_review !== undefined) {
            list = list.filter(
              (p) => p.needs_owner_review === filters.needs_owner_review,
            );
          }
          if (neqFilters.status) {
            list = list.filter((p) => p.status !== neqFilters.status);
          }
          list.sort(
            (a, b) =>
              a.sort_order - b.sort_order ||
              b.created_at.localeCompare(a.created_at) ||
              a.id.localeCompare(b.id),
          );
          if (selectOptions?.head) {
            return { data: null, error: null, count: list.length };
          }
          return {
            data: list.map(buildProductWithNested),
            error: null,
            count: list.length,
          };
        }

        if (table === 'branches') {
          const count = mockDb.branches.filter((b) =>
            filters.is_active !== undefined
              ? b.is_active === filters.is_active
              : true,
          ).length;
          return { data: null, error: null, count };
        }

        if (table === 'branch_variant_offers') {
          const allOffers = mockDb.products.flatMap((p) =>
            p.product_variants.flatMap((v) => v.branch_variant_offers),
          );
          const filtered = allOffers.filter((o) => {
            if (filters.branch_id && o.branch_id !== filters.branch_id)
              return false;
            if (
              filters.is_listed !== undefined &&
              o.is_listed !== filters.is_listed
            )
              return false;
            if (
              filters.availability_status &&
              o.availability_status !== filters.availability_status
            )
              return false;
            return true;
          });
          return { data: null, error: null, count: filtered.length };
        }

        if (table === 'promotions') {
          return { data: null, error: null, count: mockDb.promotions.length };
        }

        if (table === 'class_sessions') {
          return {
            data: null,
            error: null,
            count: mockDb.classSessions.length,
          };
        }

        return { data: [], error: null, count: 0 };
      };

      const chain = {
        select: (_cols?: string, opts?: { count?: string; head?: boolean }) => {
          selectOptions = opts;
          return chain;
        },
        insert: (payload: Record<string, unknown>) => {
          op = 'insert';
          mutationPayload = payload;
          return chain;
        },
        update: (payload: Record<string, unknown>) => {
          op = 'update';
          mutationPayload = payload;
          return chain;
        },
        eq: (col: string, val: unknown) => {
          filters[col] = val;
          return chain;
        },
        neq: (col: string, val: unknown) => {
          neqFilters[col] = val;
          return chain;
        },
        in: (col: string, vals: unknown[]) => {
          inFilters[col] = vals;
          return chain;
        },
        lte: () => chain,
        gt: () => chain,
        retry: () => chain,
        order: () => chain,
        limit: () => chain,
        abortSignal: () => chain,
        single: async () => {
          const res = await execute();
          const item = Array.isArray(res.data) ? res.data[0] : res.data;
          return { data: item ?? null, error: res.error };
        },
        maybeSingle: async () => {
          const res = await execute();
          const item = Array.isArray(res.data) ? res.data[0] : res.data;
          return { data: item ?? null, error: res.error };
        },
        then: (
          resolve: (val: {
            data: unknown;
            error: { code?: string; message?: string } | null;
            count?: number;
          }) => unknown,
          reject?: (reason: unknown) => unknown,
        ) => execute().then(resolve, reject),
      };

      return chain;
    },
  };
}

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => createFakeClient(false),
}));

vi.mock('@/lib/supabase/public-read.server', () => ({
  createPublicReadClient: () => createFakeClient(true),
}));

function makeJsonRequest(
  url: string,
  method: string,
  body?: unknown,
  origin = 'http://localhost:3000',
) {
  return new Request(url, {
    method,
    headers: {
      Host: 'localhost:3000',
      Origin: origin,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

describe('F16 Admin Overview, Categories CRUD & Product Draft Core APIs', () => {
  beforeEach(() => {
    resetDb();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'sb_publishable_synthetic_fixture_key',
    );
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns role-scoped overview counts and rejects unauthenticated access with 401 JSON', async () => {
    mockDb.activeActor = 'anon';
    const unauthRes = await overviewRoute(
      new Request('http://localhost:3000/api/admin/overview'),
    );
    expect(unauthRes.status).toBe(401);
    expect(unauthRes.headers.get('cache-control')).toContain('no-store');

    mockDb.activeActor = 'owner';
    const ownerRes = await overviewRoute(
      new Request('http://localhost:3000/api/admin/overview'),
    );
    expect(ownerRes.status).toBe(200);
    const ownerJson = await ownerRes.json();
    expect(ownerJson.data.ownerCounts.categoriesPublished).toBe(1);
    expect(ownerJson.data.ownerCounts.productsDraft).toBe(2);
    expect(ownerJson.data.staffCounts).toBeNull();

    mockDb.activeActor = 'staff';
    const staffRes = await overviewRoute(
      new Request('http://localhost:3000/api/admin/overview'),
    );
    expect(staffRes.status).toBe(200);
    const staffJson = await staffRes.json();
    expect(staffJson.data.ownerCounts).toBeNull();
    expect(staffJson.data.staffCounts.availableOffers).toBe(1);
  });

  it('rejects branch_admin staff with 403 on all global category & product routes', async () => {
    mockDb.activeActor = 'staff';

    const catList = await listCategoriesRoute(
      new Request('http://localhost:3000/api/admin/categories'),
    );
    expect(catList.status).toBe(403);

    const catCreate = await createCategoryRoute(
      makeJsonRequest('http://localhost:3000/api/admin/categories', 'POST', {
        name: 'Blocked',
        slug: 'blocked',
        parentId: null,
        description: null,
        sortOrder: 0,
        status: 'draft',
      }),
    );
    expect(catCreate.status).toBe(403);

    const prodList = await listProductsRoute(
      new Request('http://localhost:3000/api/admin/products'),
    );
    expect(prodList.status).toBe(403);

    const prodPatch = await patchProductRoute(
      makeJsonRequest(
        `http://localhost:3000/api/admin/products/${PROD_DRAFT_ID}`,
        'PATCH',
        {
          name: 'Hack',
          productType: 'simple',
          status: 'draft',
          shortDescription: null,
          description: null,
          ingredientsInfo: null,
          storageInstructions: null,
          isFeatured: false,
          isBestSeller: false,
          isNew: false,
          needsOwnerReview: true,
          sortOrder: 1,
          expectedUpdatedAt: mockDb.products[1].updated_at,
        },
      ),
      { params: Promise.resolve({ id: PROD_DRAFT_ID }) },
    );
    expect(prodPatch.status).toBe(403);
  });

  it('keeps draft categories & products invisible on public read endpoints until validly published', async () => {
    const createRes = await createCategoryRoute(
      makeJsonRequest('http://localhost:3000/api/admin/categories', 'POST', {
        name: 'Draf Kue Basah',
        slug: 'draf-kue-basah',
        parentId: null,
        description: 'Belum siap tayang',
        sortOrder: 5,
        status: 'draft',
      }),
    );
    expect(createRes.status).toBe(201);

    const publicRes = await publicCategoriesRoute(
      new Request('http://localhost:3000/api/categories'),
    );
    const publicJson = await publicRes.json();
    const publicSlugs = publicJson.data.items.map(
      (item: { slug: string }) => item.slug,
    );
    expect(publicSlugs).toContain('chiffon-cakes');
    expect(publicSlugs).not.toContain('draf-kue-basah');
    expect(publicSlugs).not.toContain('seasonal-hampers');
  });

  it('enforces category cycle detection, unpublished parent rejection, safe soft-archive, and 409 stale edits', async () => {
    // Reject publishing a child category under an unpublished parent
    const badPublishRes = await createCategoryRoute(
      makeJsonRequest('http://localhost:3000/api/admin/categories', 'POST', {
        name: 'Sub Draft Parent',
        slug: 'sub-draft-parent',
        parentId: CAT_DRAFT_ID,
        description: null,
        sortOrder: 3,
        status: 'published',
      }),
    );
    expect(badPublishRes.status).toBe(422);
    const badPublishJson = await badPublishRes.json();
    expect(badPublishJson.error.message).toBe(
      ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.PARENT_UNPUBLISHED,
    );

    // Self-parenting cycle rejected cleanly
    const selfCycleRes = await patchCategoryRoute(
      makeJsonRequest(
        `http://localhost:3000/api/admin/categories/${CAT_PUB_ID}`,
        'PATCH',
        {
          name: 'Chiffon Cakes',
          parentId: CAT_PUB_ID,
          description: null,
          sortOrder: 1,
          status: 'published',
          expectedUpdatedAt: mockDb.categories[0].updated_at,
        },
      ),
      { params: Promise.resolve({ id: CAT_PUB_ID }) },
    );
    expect(selfCycleRes.status).toBe(422);

    // Slug mutation rejected cleanly
    const slugMutRes = await patchCategoryRoute(
      makeJsonRequest(
        `http://localhost:3000/api/admin/categories/${CAT_PUB_ID}`,
        'PATCH',
        {
          name: 'Chiffon Cakes Updated',
          slug: 'different-slug',
          parentId: null,
          description: null,
          sortOrder: 1,
          status: 'published',
          expectedUpdatedAt: mockDb.categories[0].updated_at,
        },
      ),
      { params: Promise.resolve({ id: CAT_PUB_ID }) },
    );
    expect(slugMutRes.status).toBe(422);

    // Stale expectedUpdatedAt returns 409 CONFLICT
    const staleRes = await patchCategoryRoute(
      makeJsonRequest(
        `http://localhost:3000/api/admin/categories/${CAT_DRAFT_ID}`,
        'PATCH',
        {
          name: 'Edited Stale',
          parentId: null,
          description: null,
          sortOrder: 2,
          status: 'draft',
          expectedUpdatedAt: '1999-01-01T00:00:00.000Z',
        },
      ),
      { params: Promise.resolve({ id: CAT_DRAFT_ID }) },
    );
    expect(staleRes.status).toBe(409);

    // Safe soft archive preserves references without deleting product
    const archiveRes = await archiveCategoryRoute(
      makeJsonRequest(
        `http://localhost:3000/api/admin/categories/${CAT_DRAFT_ID}`,
        'DELETE',
        { expectedUpdatedAt: mockDb.categories[1].updated_at },
      ),
      { params: Promise.resolve({ id: CAT_DRAFT_ID }) },
    );
    expect(archiveRes.status).toBe(200);
    const archivedJson = await archiveRes.json();
    expect(archivedJson.data.category.status).toBe('archived');
    expect(mockDb.categories.find((c) => c.id === CAT_DRAFT_ID)).toBeDefined();

    // Missing category returns 404
    const missingGet = await getCategoryRoute(
      new Request(
        'http://localhost:3000/api/admin/categories/00000000-0000-4000-8000-000000000099',
      ),
      {
        params: Promise.resolve({
          id: '00000000-0000-4000-8000-000000000099',
        }),
      },
    );
    expect(missingGet.status).toBe(404);
  });

  it('enforces product publish prerequisites, rejects price_idr on product row, handles stale 409 and safe search inputs', async () => {
    // Reject price_idr on product creation
    const priceOnProduct = await createProductRoute(
      makeJsonRequest('http://localhost:3000/api/admin/products', 'POST', {
        name: 'Spikoe Illegal Price',
        slug: 'spikoe-illegal-price',
        productType: 'simple',
        shortDescription: null,
        description: null,
        ingredientsInfo: null,
        storageInstructions: null,
        isFeatured: false,
        isBestSeller: false,
        isNew: false,
        needsOwnerReview: true,
        sortOrder: 0,
        price_idr: 250_000,
      }),
    );
    expect(priceOnProduct.status).toBe(422);

    // Malicious SQL/HTML payload stores literally without breaking handler
    const maliciousCreate = await createProductRoute(
      makeJsonRequest('http://localhost:3000/api/admin/products', 'POST', {
        name: 'Kue <script>alert(1)</script>; DROP TABLE products;--',
        slug: 'kue-aman-text',
        productType: 'simple',
        shortDescription: '<b>safe text</b>',
        description: null,
        ingredientsInfo: null,
        storageInstructions: null,
        isFeatured: false,
        isBestSeller: false,
        isNew: false,
        needsOwnerReview: true,
        sortOrder: 4,
      }),
    );
    expect(maliciousCreate.status).toBe(201);
    const maliciousJson = await maliciousCreate.json();
    expect(maliciousJson.data.product.status).toBe('draft');
    expect(maliciousJson.data.product.name).toContain(
      '<script>alert(1)</script>',
    );

    // Literal SQL-like search string is safe and never throws 500/503
    const searchRes = await listProductsRoute(
      new Request(
        `http://localhost:3000/api/admin/products?q=${encodeURIComponent("%' OR 1=1;-- <script>")}`,
      ),
    );
    expect(searchRes.status).toBe(200);
    const searchJson = await searchRes.json();
    expect(searchJson.data.items).toEqual([]);

    // Draft product without variants/images/category cannot publish -> 422
    const unreadyPublish = await patchProductRoute(
      makeJsonRequest(
        `http://localhost:3000/api/admin/products/${PROD_DRAFT_ID}`,
        'PATCH',
        {
          name: 'Spikoe Draft Baru',
          productType: 'variants',
          status: 'published',
          shortDescription: null,
          description: null,
          ingredientsInfo: null,
          storageInstructions: null,
          isFeatured: false,
          isBestSeller: false,
          isNew: false,
          needsOwnerReview: false,
          sortOrder: 2,
          expectedUpdatedAt: mockDb.products[1].updated_at,
        },
      ),
      { params: Promise.resolve({ id: PROD_DRAFT_ID }) },
    );
    expect(unreadyPublish.status).toBe(422);
    const unreadyJson = await unreadyPublish.json();
    expect(unreadyJson.error.fieldErrors.status.length).toBeGreaterThan(0);

    // Product with all prerequisites met publishes cleanly + stale expectedUpdatedAt conflicts cleanly
    const publishReadyRes = await patchProductRoute(
      makeJsonRequest(
        `http://localhost:3000/api/admin/products/${PROD_READY_ID}`,
        'PATCH',
        {
          name: 'Chiffon Pandan Spesial',
          productType: 'simple',
          status: 'published',
          shortDescription: 'Pandan wangi',
          description: 'Deskripsi lengkap',
          ingredientsInfo: 'Telur, terigu',
          storageInstructions: 'Suhu ruang 2 hari',
          isFeatured: true,
          isBestSeller: true,
          isNew: false,
          needsOwnerReview: false,
          sortOrder: 1,
          expectedUpdatedAt: mockDb.products[0].updated_at,
        },
      ),
      { params: Promise.resolve({ id: PROD_READY_ID }) },
    );
    expect(publishReadyRes.status).toBe(200);
    const publishedJson = await publishReadyRes.json();
    expect(publishedJson.data.product.status).toBe('published');

    // Stale expectedUpdatedAt on previous timestamp must fail 409
    const staleProdRes = await archiveProductRoute(
      makeJsonRequest(
        `http://localhost:3000/api/admin/products/${PROD_READY_ID}`,
        'DELETE',
        { expectedUpdatedAt: '2026-11-10T02:00:00.000Z' },
      ),
      { params: Promise.resolve({ id: PROD_READY_ID }) },
    );
    expect(staleProdRes.status).toBe(409);

    // Fresh soft archive succeeds & preserves SKU relations
    const freshDetail = await getProductRoute(
      new Request(`http://localhost:3000/api/admin/products/${PROD_READY_ID}`),
      { params: Promise.resolve({ id: PROD_READY_ID }) },
    );
    const freshDetailJson = await freshDetail.json();

    const freshArchive = await archiveProductRoute(
      makeJsonRequest(
        `http://localhost:3000/api/admin/products/${PROD_READY_ID}`,
        'DELETE',
        { expectedUpdatedAt: freshDetailJson.data.product.updatedAt },
      ),
      { params: Promise.resolve({ id: PROD_READY_ID }) },
    );
    expect(freshArchive.status).toBe(200);
    const freshArchiveJson = await freshArchive.json();
    expect(freshArchiveJson.data.product.status).toBe('archived');
    expect(
      mockDb.products.find((p) => p.id === PROD_READY_ID)?.product_variants
        .length,
    ).toBe(1);
  });
});
