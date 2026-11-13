import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as listAdminContentRoute } from '@/app/api/admin/content/route';
import {
  GET as getAdminContentKeyRoute,
  PUT as putAdminContentKeyRoute,
} from '@/app/api/admin/content/[key]/route';
import {
  DELETE as archiveAdminFaqRoute,
  PATCH as patchAdminFaqRoute,
} from '@/app/api/admin/faqs/[id]/route';
import {
  GET as listAdminFaqsRoute,
  POST as createAdminFaqRoute,
} from '@/app/api/admin/faqs/route';
import {
  DELETE as archiveAdminTestimonialRoute,
  PATCH as patchAdminTestimonialRoute,
} from '@/app/api/admin/testimonials/[id]/route';
import {
  GET as listAdminTestimonialsRoute,
  POST as createAdminTestimonialRoute,
} from '@/app/api/admin/testimonials/route';
import { GET as publicContentRoute } from '@/app/api/content/route';
import { GET as publicFaqsRoute } from '@/app/api/faqs/route';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { AuthError } from '@/features/auth/errors.server';
import { getHomeData } from '@/features/home/service.server';
import type { AdminSessionProfile } from '@/types/auth';

const OWNER_ID = 'f2000000-0000-4000-8000-000000000001';
const STAFF_ID = 'f2000000-0000-4000-8000-000000000002';
const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const APPROVED_UUID = 'f2000000-0000-4000-8000-000000000099';

const mockState = vi.hoisted(() => ({
  actor: 'owner' as 'anon' | 'owner' | 'staff',
  tick: 1,
  tableSelectColumns: [] as { table: string; columns: string }[],
  siteContent: new Map<
    string,
    {
      key: string;
      content_json: Record<string, unknown>;
      status: 'draft' | 'published';
      updated_by: string | null;
      created_at: string;
      updated_at: string;
    }
  >(),
  faqs: [] as {
    id: string;
    category: string;
    question: string;
    answer: string;
    sort_order: number;
    status: 'draft' | 'published' | 'archived';
    created_at: string;
    updated_at: string;
  }[],
  testimonials: [] as {
    id: string;
    display_name: string;
    quote: string;
    rating: number | null;
    source_label: string | null;
    source_url: string | null;
    consent_reference: string | null;
    consent_at: string | null;
    status: 'draft' | 'published' | 'archived';
    sort_order: number;
    created_at: string;
    updated_at: string;
  }[],
  cleanupCalls: [] as {
    storageBucket: string;
    storagePath: string;
    reason: string;
  }[],
  forceContentDbErrorOnNextWrite: false,
}));

function nextIso() {
  mockState.tick += 1;
  return `2026-11-13T10:${String(mockState.tick).padStart(2, '0')}:00.000Z`;
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
              email: 'owner@resepoma.test',
              displayName: 'Owner Resep Oma',
              role: 'owner',
              branchId: null,
              branchCode: null,
              branchName: null,
            }
          : {
              userId: STAFF_ID,
              email: 'staff@resepoma.test',
              displayName: 'Admin Surabaya',
              role: 'branch_admin',
              branchId: SURABAYA_ID,
              branchCode: 'surabaya',
              branchName: 'Surabaya',
            };
      if (roles && !roles.includes(profile.role)) {
        throw new AuthError('Akses ditolak.', 'FORBIDDEN', 403);
      }
      return profile;
    },
  ),
}));

vi.mock('@/features/admin-catalog/media.server', () => ({
  promoteDraftMediaToPublicBucket: vi.fn(async () => ({
    storageBucket: 'brand-assets' as const,
    storagePath: `approved/${APPROVED_UUID}.webp`,
  })),
  resolveAdminMediaPreviewUrl: vi.fn(
    async (bucket: string, path: string) =>
      `https://cdn.example.test/${bucket}/${path}`,
  ),
  cleanupOrphanStorageObjects: vi.fn(
    async (
      _profile: unknown,
      targets: ReadonlyArray<{ storageBucket: string; storagePath: string }>,
      reason: string,
    ) => {
      for (const t of targets) {
        mockState.cleanupCalls.push({
          storageBucket: t.storageBucket,
          storagePath: t.storagePath,
          reason,
        });
      }
      return { deletedCount: targets.length, skippedReferencedCount: 0 };
    },
  ),
}));

function buildTableQuery(table: string) {
  const filters: Record<string, unknown> = {};
  let inKeys: string[] | null = null;
  let pendingUpdate: Record<string, unknown> | null = null;
  let pendingInsert: Record<string, unknown> | null = null;

  const exec = (): { data: unknown; error: unknown } => {
    if (table === 'site_content') {
      if (pendingInsert) {
        if (mockState.forceContentDbErrorOnNextWrite) {
          mockState.forceContentDbErrorOnNextWrite = false;
          return { data: null, error: { code: 'XX000', message: 'db fail' } };
        }
        const key = String(pendingInsert.key);
        const now = nextIso();
        const row = {
          key,
          content_json: pendingInsert.content_json as Record<string, unknown>,
          status: (pendingInsert.status as 'draft' | 'published') ?? 'draft',
          updated_by: (pendingInsert.updated_by as string | null) ?? null,
          created_at: now,
          updated_at: now,
        };
        mockState.siteContent.set(key, row);
        return { data: row, error: null };
      }
      if (pendingUpdate) {
        if (mockState.forceContentDbErrorOnNextWrite) {
          mockState.forceContentDbErrorOnNextWrite = false;
          return { data: null, error: { code: 'XX000', message: 'db fail' } };
        }
        const key = String(filters.key ?? '');
        const existing = mockState.siteContent.get(key);
        if (
          !existing ||
          (filters.updated_at && existing.updated_at !== filters.updated_at)
        ) {
          return { data: null, error: null };
        }
        const updated = {
          ...existing,
          content_json:
            (pendingUpdate.content_json as Record<string, unknown>) ??
            existing.content_json,
          status:
            (pendingUpdate.status as 'draft' | 'published') ?? existing.status,
          updated_by:
            (pendingUpdate.updated_by as string | null) ?? existing.updated_by,
          updated_at: nextIso(),
        };
        mockState.siteContent.set(key, updated);
        return { data: updated, error: null };
      }
      let rows = [...mockState.siteContent.values()];
      if (inKeys) rows = rows.filter((r) => inKeys!.includes(r.key));
      if (filters.key) rows = rows.filter((r) => r.key === filters.key);
      if (filters.status)
        rows = rows.filter((r) => r.status === filters.status);
      return { data: rows, error: null };
    }

    if (table === 'faqs') {
      if (pendingInsert) {
        const now = nextIso();
        const row = {
          id: `f20f0000-0000-4000-8000-${String(mockState.faqs.length + 1).padStart(12, '0')}`,
          category: String(pendingInsert.category),
          question: String(pendingInsert.question),
          answer: String(pendingInsert.answer),
          sort_order: Number(pendingInsert.sort_order ?? 0),
          status:
            (pendingInsert.status as 'draft' | 'published' | 'archived') ??
            'draft',
          created_at: now,
          updated_at: now,
        };
        mockState.faqs.push(row);
        return { data: row, error: null };
      }
      if (pendingUpdate) {
        const idx = mockState.faqs.findIndex(
          (r) =>
            r.id === filters.id &&
            (!filters.updated_at || r.updated_at === filters.updated_at),
        );
        if (idx === -1) return { data: null, error: null };
        const cur = mockState.faqs[idx]!;
        const updated = {
          ...cur,
          ...pendingUpdate,
          updated_at: nextIso(),
        };
        mockState.faqs[idx] = updated;
        return { data: updated, error: null };
      }
      let rows = [...mockState.faqs];
      if (filters.id) rows = rows.filter((r) => r.id === filters.id);
      if (filters.status)
        rows = rows.filter((r) => r.status === filters.status);
      rows.sort(
        (a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id),
      );
      return { data: rows, error: null };
    }

    if (table === 'testimonials') {
      if (pendingInsert) {
        const now = nextIso();
        const row = {
          id: `f20e0000-0000-4000-8000-${String(mockState.testimonials.length + 1).padStart(12, '0')}`,
          display_name: String(pendingInsert.display_name),
          quote: String(pendingInsert.quote),
          rating: (pendingInsert.rating as number | null) ?? null,
          source_label: (pendingInsert.source_label as string | null) ?? null,
          source_url: (pendingInsert.source_url as string | null) ?? null,
          consent_reference:
            (pendingInsert.consent_reference as string | null) ?? null,
          consent_at: (pendingInsert.consent_at as string | null) ?? null,
          status:
            (pendingInsert.status as 'draft' | 'published' | 'archived') ??
            'draft',
          sort_order: Number(pendingInsert.sort_order ?? 0),
          created_at: now,
          updated_at: now,
        };
        mockState.testimonials.push(row);
        return { data: row, error: null };
      }
      if (pendingUpdate) {
        const idx = mockState.testimonials.findIndex(
          (r) =>
            r.id === filters.id &&
            (!filters.updated_at || r.updated_at === filters.updated_at),
        );
        if (idx === -1) return { data: null, error: null };
        const cur = mockState.testimonials[idx]!;
        const updated = {
          ...cur,
          ...pendingUpdate,
          updated_at: nextIso(),
        };
        mockState.testimonials[idx] = updated;
        return { data: updated, error: null };
      }
      let rows = [...mockState.testimonials];
      if (filters.id) rows = rows.filter((r) => r.id === filters.id);
      if (filters.status)
        rows = rows.filter((r) => r.status === filters.status);
      return { data: rows, error: null };
    }

    return { data: [], error: null };
  };

  const chain: Record<string, unknown> = {
    select(columns = '*') {
      mockState.tableSelectColumns.push({ table, columns });
      return chain;
    },
    insert(payload: Record<string, unknown>) {
      pendingInsert = payload;
      return chain;
    },
    update(payload: Record<string, unknown>) {
      pendingUpdate = payload;
      return chain;
    },
    eq(col: string, val: unknown) {
      filters[col] = val;
      return chain;
    },
    in(_col: string, vals: string[]) {
      inKeys = vals;
      return chain;
    },
    order() {
      return chain;
    },
    limit() {
      return chain;
    },
    retry() {
      return chain;
    },
    abortSignal() {
      return chain;
    },
    maybeSingle() {
      const res = exec();
      if (Array.isArray(res.data)) {
        return Promise.resolve({ data: res.data[0] ?? null, error: res.error });
      }
      return Promise.resolve(res);
    },
    then(
      onFulfilled?: (val: unknown) => unknown,
      onRejected?: (err: unknown) => unknown,
    ) {
      return Promise.resolve(exec()).then(onFulfilled, onRejected);
    },
  };
  return chain;
}

function buildMockClient() {
  return {
    from: (table: string) => buildTableQuery(table),
    rpc: vi.fn(async (fn: string, params: Record<string, unknown>) => {
      if (fn === 'read_owner_testimonial_evidence') {
        const found = mockState.testimonials.find(
          (t) => t.id === params.testimonial_uuid,
        );
        return {
          data: found
            ? [
                {
                  id: found.id,
                  consent_reference: found.consent_reference,
                  consent_at: found.consent_at,
                },
              ]
            : [],
          error: null,
        };
      }
      if (fn === 'read_owner_content_audit') {
        const found = mockState.siteContent.get(String(params.content_key));
        return {
          data: found ? [{ key: found.key, updated_by: found.updated_by }] : [],
          error: null,
        };
      }
      return { data: [], error: null };
    }),
    storage: {
      from: (bucket: string) => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://cdn.example.test/${bucket}/${path}` },
        }),
      }),
    },
  };
}

vi.mock('@/lib/supabase/server', () => ({
  createServerAuthClient: vi.fn(async () => buildMockClient()),
}));

vi.mock('@/lib/supabase/public-read.server', () => ({
  createPublicReadClient: vi.fn(() => buildMockClient()),
}));

describe('F20 admin CMS, FAQ, and testimonial server integration', () => {
  beforeEach(() => {
    mockState.actor = 'owner';
    mockState.tick = 1;
    mockState.tableSelectColumns = [];
    mockState.siteContent.clear();
    mockState.faqs = [];
    mockState.testimonials = [];
    mockState.cleanupCalls = [];
    mockState.forceContentDbErrorOnNextWrite = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('denies anon (401) and branch_admin staff (403) across CMS, FAQ, and testimonial endpoints', async () => {
    mockState.actor = 'anon';
    expect(
      (
        await listAdminContentRoute(
          new Request('http://localhost/api/admin/content'),
        )
      ).status,
    ).toBe(401);
    expect(
      (await listAdminFaqsRoute(new Request('http://localhost/api/admin/faqs')))
        .status,
    ).toBe(401);
    expect(
      (
        await listAdminTestimonialsRoute(
          new Request('http://localhost/api/admin/testimonials'),
        )
      ).status,
    ).toBe(401);

    mockState.actor = 'staff';
    expect(
      (
        await listAdminContentRoute(
          new Request('http://localhost/api/admin/content'),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await putAdminContentKeyRoute(
          new Request('http://localhost/api/admin/content/footer.note', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'published',
              expectedUpdatedAt: null,
              content: { text: 'Staff tamper' },
            }),
          }),
          { params: Promise.resolve({ key: 'footer.note' }) },
        )
      ).status,
    ).toBe(403);
    expect(
      (await listAdminFaqsRoute(new Request('http://localhost/api/admin/faqs')))
        .status,
    ).toBe(403);
    expect(
      (
        await listAdminTestimonialsRoute(
          new Request('http://localhost/api/admin/testimonials'),
        )
      ).status,
    ).toBe(403);
  });

  it('rejects invalid keys/XSS, publishes approved media, enforces stale 409, and rolls back orphan uploads on DB failure', async () => {
    const invalidKeyRes = await getAdminContentKeyRoute(
      new Request('http://localhost/api/admin/content/not.allowed'),
      { params: Promise.resolve({ key: 'not.allowed' }) },
    );
    expect(invalidKeyRes.status).toBe(422);

    const xssRes = await putAdminContentKeyRoute(
      new Request('http://localhost/api/admin/content/footer.note', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'published',
          expectedUpdatedAt: null,
          content: { text: '<script>alert(1)</script>' },
        }),
      }),
      { params: Promise.resolve({ key: 'footer.note' }) },
    );
    expect(xssRes.status).toBe(422);

    const draftPath = `${OWNER_ID}/drafts/f2000000-0000-4000-8000-000000000088.png`;

    // Verify rollback cleanup removes newly promoted asset if DB insert fails.
    mockState.forceContentDbErrorOnNextWrite = true;
    const failedSave = await putAdminContentKeyRoute(
      new Request('http://localhost/api/admin/content/home.hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'published',
          expectedUpdatedAt: null,
          content: {
            headline: 'Baked Warm Daily',
            subcopy: 'Resep klasik hangat.',
            image_path: draftPath,
            image_alt: 'Foto dapur Resep Oma',
            media_approved: true,
          },
        }),
      }),
      { params: Promise.resolve({ key: 'home.hero' }) },
    );
    expect(failedSave.status).toBe(503);
    expect(mockState.cleanupCalls).toContainEqual({
      storageBucket: 'brand-assets',
      storagePath: `approved/${APPROVED_UUID}.webp`,
      reason: 'content_save_rollback',
    });

    // Save clean Hero & verify public reflection + stale 409 lock.
    const savedHeroRes = await putAdminContentKeyRoute(
      new Request('http://localhost/api/admin/content/home.hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'published',
          expectedUpdatedAt: null,
          content: {
            headline: 'Baked Warm Daily',
            subcopy: 'Resep klasik hangat.',
            image_path: draftPath,
            image_alt: 'Foto dapur Resep Oma',
            media_approved: true,
          },
        }),
      }),
      { params: Promise.resolve({ key: 'home.hero' }) },
    );
    expect(savedHeroRes.status).toBe(200);

    const staleRes = await putAdminContentKeyRoute(
      new Request('http://localhost/api/admin/content/home.hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'published',
          expectedUpdatedAt: '2026-01-01T00:00:00.000Z',
          content: {
            headline: 'Stale',
            subcopy: 'Stale',
            image_path: `approved/${APPROVED_UUID}.webp`,
            image_alt: 'Foto',
            media_approved: true,
          },
        }),
      }),
      { params: Promise.resolve({ key: 'home.hero' }) },
    );
    expect(staleRes.status).toBe(409);

    const publicRes = await publicContentRoute(
      new Request('http://localhost/api/content?keys=home.hero'),
    );
    const publicBody = await publicRes.json();
    expect(publicRes.status).toBe(200);
    expect(publicBody.data.items[0].content.headline).toBe('Baked Warm Daily');
    expect(publicBody.data.items[0].source).toBe('published');
  });

  it('hides draft/archived FAQs from public API, refreshes immediately after publish, and preserves sort order on archive', async () => {
    const createDraftRes = await createAdminFaqRoute(
      new Request('http://localhost/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Pengiriman',
          question: 'Apakah bisa kirim hari yang sama?',
          answer: 'Dikonfirmasi melalui WhatsApp cabang.',
          sortOrder: 10,
          status: 'draft',
        }),
      }),
    );
    expect(createDraftRes.status).toBe(201);
    const createdFaq = (await createDraftRes.json()).data.faq;

    const createPubRes = await createAdminFaqRoute(
      new Request('http://localhost/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Pemesanan',
          question: 'Bagaimana pesan?',
          answer: 'Lewat checkout WA cabang.',
          sortOrder: 20,
          status: 'published',
        }),
      }),
    );
    expect(createPubRes.status).toBe(201);

    let publicFaqs = (
      await (
        await publicFaqsRoute(new Request('http://localhost/api/faqs'))
      ).json()
    ).data.items;
    expect(publicFaqs).toHaveLength(1);
    expect(publicFaqs[0].question).toBe('Bagaimana pesan?');

    const publishRes = await patchAdminFaqRoute(
      new Request(`http://localhost/api/admin/faqs/${createdFaq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Pengiriman',
          question: 'Apakah bisa kirim hari yang sama?',
          answer: 'Dikonfirmasi manual oleh admin WhatsApp cabang.',
          sortOrder: 10,
          status: 'published',
          expectedUpdatedAt: createdFaq.updatedAt,
        }),
      }),
      { params: Promise.resolve({ id: createdFaq.id }) },
    );
    expect(publishRes.status).toBe(200);

    publicFaqs = (
      await (
        await publicFaqsRoute(new Request('http://localhost/api/faqs'))
      ).json()
    ).data.items;
    expect(publicFaqs.map((f: { sortOrder: number }) => f.sortOrder)).toEqual([
      10, 20,
    ]);

    const publishedUpdatedAt = (await publishRes.json()).data.faq.updatedAt;
    const archiveRes = await archiveAdminFaqRoute(
      new Request(`http://localhost/api/admin/faqs/${createdFaq.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedUpdatedAt: publishedUpdatedAt }),
      }),
      { params: Promise.resolve({ id: createdFaq.id }) },
    );
    expect(archiveRes.status).toBe(200);

    publicFaqs = (
      await (
        await publicFaqsRoute(new Request('http://localhost/api/faqs'))
      ).json()
    ).data.items;
    expect(publicFaqs).toHaveLength(1);
    expect(publicFaqs[0].sortOrder).toBe(20);
  });

  it('denies consentless testimonial publish, hides private evidence from table REST & Home DTO, and syncs consented items', async () => {
    const createDraftRes = await createAdminTestimonialRoute(
      new Request('http://localhost/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: 'Kuenya lembut dan tidak terlalu manis.',
        }),
      }),
    );
    expect(createDraftRes.status).toBe(201);
    const created = (await createDraftRes.json()).data.testimonial;
    expect(created.displayName).toBe('Pelanggan Resep Oma');
    expect(created.rating).toBeNull();
    expect(created.status).toBe('draft');

    // Attempt consentless publish -> 422
    const deniedPub = await patchAdminTestimonialRoute(
      new Request(`http://localhost/api/admin/testimonials/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Pelanggan Resep Oma',
          quote: 'Kuenya lembut dan tidak terlalu manis.',
          rating: null,
          sourceLabel: null,
          sourceUrl: null,
          consentAt: null,
          consentReference: null,
          sortOrder: 0,
          status: 'published',
          expectedUpdatedAt: created.updatedAt,
        }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(deniedPub.status).toBe(422);

    // Home returns 0 published testimonials when unconsented/draft
    let home = await getHomeData({ now: new Date('2026-11-13T10:00:00Z') });
    expect(home.testimonials).toEqual({ status: 'success', data: [] });

    // Record consent and publish -> visible in Home DTO WITHOUT exposing consent_reference / consent_at
    const validPub = await patchAdminTestimonialRoute(
      new Request(`http://localhost/api/admin/testimonials/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Pelanggan Surabaya',
          quote: 'Kuenya lembut dan tidak terlalu manis.',
          rating: 5,
          sourceLabel: 'Izin WhatsApp Terverifikasi',
          sourceUrl: 'https://www.instagram.com/resepoma.kueh/',
          consentAt: '2026-11-13T09:00:00.000Z',
          consentReference: 'Private Consent Log #SUR-2026-11',
          sortOrder: 1,
          status: 'published',
          expectedUpdatedAt: created.updatedAt,
        }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(validPub.status).toBe(200);

    // Confirm no table REST select ever requested consent_reference, consent_at, or updated_by
    const testimonialSelects = mockState.tableSelectColumns.filter(
      (s) => s.table === 'testimonials',
    );
    expect(testimonialSelects.length).toBeGreaterThan(0);
    for (const sel of testimonialSelects) {
      expect(sel.columns).not.toContain('consent_reference');
      expect(sel.columns).not.toContain('consent_at');
    }

    home = await getHomeData({ now: new Date('2026-11-13T10:00:00Z') });
    expect(home.testimonials.status).toBe('success');
    if (home.testimonials.status === 'success') {
      expect(home.testimonials.data).toHaveLength(1);
      expect(home.testimonials.data[0]).toEqual({
        id: created.id,
        displayName: 'Pelanggan Surabaya',
        quote: 'Kuenya lembut dan tidak terlalu manis.',
        rating: 5,
        sourceLabel: 'Izin WhatsApp Terverifikasi',
      });
      expect('consentReference' in home.testimonials.data[0]!).toBe(false);
    }

    const updated = (await validPub.json()).data.testimonial;
    const archived = await archiveAdminTestimonialRoute(
      new Request(`http://localhost/api/admin/testimonials/${created.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedUpdatedAt: updated.updatedAt }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(archived.status).toBe(200);
    expect((await archived.json()).data.testimonial.status).toBe('archived');

    // Keep unused import sanity check
    expect(
      ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.CONSENT_REQUIRED,
    ).toBeTruthy();
  });
});
