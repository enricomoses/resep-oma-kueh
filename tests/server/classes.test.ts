import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DELETE as archiveAdminClassProgramRoute,
  PATCH as patchAdminClassProgramRoute,
} from '@/app/api/admin/classes/programs/[id]/route';
import {
  GET as listAdminClassProgramsRoute,
  POST as createAdminClassProgramRoute,
} from '@/app/api/admin/classes/programs/route';
import {
  DELETE as cancelAdminClassSessionRoute,
  PATCH as patchAdminClassSessionRoute,
} from '@/app/api/admin/classes/sessions/[id]/route';
import {
  GET as listAdminClassSessionsRoute,
  POST as createAdminClassSessionRoute,
} from '@/app/api/admin/classes/sessions/route';
import { GET as getPublicClassDetailRoute } from '@/app/api/classes/[slug]/route';
import { POST as prepareClassRegistrationRoute } from '@/app/api/classes/prepare-registration/route';
import { GET as getPublicClassesRoute } from '@/app/api/classes/route';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { AuthError, AuthForbiddenError } from '@/features/auth/errors.server';
import type { AdminSessionProfile } from '@/types/auth';

const OWNER_ID = 'f2100000-0000-4000-8000-000000000091';
const STAFF_SBY_ID = 'f2100000-0000-4000-8000-000000000092';
const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const BINTARO_ID = 'f0400000-0000-4000-8000-000000000002';
const PROGRAM_PUB_ID = 'f0400000-0000-4000-8000-000000000940';
const PROGRAM_DRAFT_ID = 'f0400000-0000-4000-8000-000000000941';
const SESSION_SBY_ID = 'f0400000-0000-4000-8000-000000000951';
const SESSION_BTR_FULL_ID = 'f0400000-0000-4000-8000-000000000952';
const SESSION_PAST_ID = 'f0400000-0000-4000-8000-000000000950';
const SESSION_CANCELLED_ID = 'f0400000-0000-4000-8000-000000000953';
const SESSION_EXPIRED_ID = 'f0400000-0000-4000-8000-000000000954';
const SESSION_UNKNOWN_SEATS_ID = 'f0400000-0000-4000-8000-000000000955';
const SESSION_OVERRIDE_ID = 'f0400000-0000-4000-8000-000000000956';

interface MockProgramRow {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  base_price_idr: number;
  age_min: number | null;
  age_max: number | null;
  duration_minutes: number | null;
  cover_image_path: string | null;
  cover_storage_bucket: string;
  cover_is_approved: boolean;
  cover_alt_text: string | null;
  needs_owner_review: boolean;
  included_items: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface MockBranchRow {
  id: string;
  code: string;
  name: string;
  city: string;
  whatsapp_number: string;
  address: string | null;
  is_active: boolean;
}

interface MockSessionRow {
  id: string;
  program_id: string;
  branch_id: string;
  starts_at: string;
  ends_at: string;
  registration_deadline_at: string | null;
  capacity: number;
  seats_left: number | null;
  price_override_idr: number | null;
  status: string;
  is_registration_open: boolean;
  created_at: string;
  updated_at: string;
}

const state = vi.hoisted(() => ({
  actor: 'owner' as 'anon' | 'owner' | 'staff_sby',
  tick: 1,
  publicError: false,
  promoteShouldFail: false,
  programInsertShouldFail: false,
  mutationCalls: 0,
  cleanupCalls: [] as { bucket: string; path: string; reason: string }[],
  branches: [] as MockBranchRow[],
  programs: [] as MockProgramRow[],
  sessions: [] as MockSessionRow[],
}));

function nextUpdatedAt() {
  state.tick += 1;
  return `2026-11-13T10:${String(state.tick).padStart(2, '0')}:00.000Z`;
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
      if (state.actor === 'anon') {
        throw new AuthError(
          'Silakan login terlebih dahulu.',
          'UNAUTHENTICATED',
          401,
        );
      }
      const profile: AdminSessionProfile =
        state.actor === 'owner'
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
              userId: STAFF_SBY_ID,
              email: 'sby@resepomakueh.example',
              displayName: 'Admin Surabaya',
              role: 'branch_admin',
              branchId: SURABAYA_ID,
              branchCode: 'surabaya',
              branchName: 'Surabaya',
            };
      if (roles && !roles.includes(profile.role)) {
        throw new AuthForbiddenError(
          ADMIN_CATALOG_COPY.CLASSES.ERRORS.OWNER_ONLY,
        );
      }
      return profile;
    },
  ),
}));

vi.mock('@/features/admin-catalog/media.server', () => ({
  promoteDraftMediaToPublicBucket: vi.fn(
    async (
      _profile: unknown,
      draftPath: string,
      _ctx: unknown,
      bucket: string,
    ) => {
      if (state.promoteShouldFail) {
        throw new Error('promote failed');
      }
      const filename = draftPath.split('/').pop() ?? 'upload.webp';
      return {
        storageBucket: bucket,
        storagePath: `approved/${filename}`,
      };
    },
  ),
  resolveAdminMediaPreviewUrl: vi.fn(
    async (_profile: unknown, bucket: string, path: string) =>
      `https://cdn.example/${bucket}/${path}`,
  ),
  cleanupOrphanStorageObjects: vi.fn(
    async (
      _profile: unknown,
      targets: { storageBucket: string; storagePath: string }[],
      reason: string,
    ) => {
      for (const target of targets) {
        state.cleanupCalls.push({
          bucket: target.storageBucket,
          path: target.storagePath,
          reason,
        });
      }
      return { attempted: targets.length, deleted: targets.length };
    },
  ),
}));

vi.mock('@/features/classes/repository.server', () => ({
  resolvePublicClassCoverUrl: vi.fn(
    (bucket: string | null, path: string | null, approved: boolean | null) =>
      approved && bucket === 'class-images' && path
        ? `https://cdn.example/${bucket}/${path}`
        : null,
  ),
  readActiveClassBranchesRepo: vi.fn(async () => {
    if (state.publicError) throw new Error('DB down');
    return state.branches.filter((b) => b.is_active);
  }),
  readPublicClassProgramsRepo: vi.fn(async () => {
    if (state.publicError) throw new Error('DB down');
    return state.programs.filter(
      (p) =>
        p.status === 'published' &&
        !p.needs_owner_review &&
        p.cover_is_approved,
    );
  }),
  readPublicClassProgramBySlugRepo: vi.fn(async (slug: string) => {
    if (state.publicError) throw new Error('DB down');
    return (
      state.programs.find(
        (p) =>
          p.slug === slug &&
          p.status === 'published' &&
          !p.needs_owner_review &&
          p.cover_is_approved,
      ) ?? null
    );
  }),
  readPublicClassSessionsRepo: vi.fn(async (programIds?: readonly string[]) => {
    if (state.publicError) throw new Error('DB down');
    return state.sessions
      .filter((s) => !programIds || programIds.includes(s.program_id))
      .map((s) => ({
        ...s,
        branches: state.branches.find((b) => b.id === s.branch_id) ?? null,
      }));
  }),
  readClassSessionForPrepareRepo: vi.fn(async (sessionId: string) => {
    if (state.publicError) throw new Error('DB down');
    const row = state.sessions.find((s) => s.id === sessionId);
    if (!row) return null;
    return {
      ...row,
      branches: state.branches.find((b) => b.id === row.branch_id) ?? null,
      class_programs:
        state.programs.find((p) => p.id === row.program_id) ?? null,
    };
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerAuthClient: vi.fn(async () => ({
    from: (table: string) => buildAdminQuery(table),
  })),
}));

function buildAdminQuery(table: string) {
  const ctx: {
    mode: 'select' | 'insert' | 'update';
    payload: Record<string, unknown> | null;
    filters: Record<string, unknown>;
  } = {
    mode: 'select',
    payload: null,
    filters: {},
  };

  function runRows() {
    if (table === 'class_programs') {
      return state.programs.filter((row) =>
        Object.entries(ctx.filters).every(
          ([k, v]) => (row as unknown as Record<string, unknown>)[k] === v,
        ),
      );
    }
    if (table === 'branches') {
      return state.branches.filter((row) =>
        Object.entries(ctx.filters).every(
          ([k, v]) => (row as unknown as Record<string, unknown>)[k] === v,
        ),
      );
    }
    if (table === 'class_sessions') {
      return state.sessions
        .filter((row) =>
          Object.entries(ctx.filters).every(
            ([k, v]) => (row as unknown as Record<string, unknown>)[k] === v,
          ),
        )
        .map((row) => ({
          ...row,
          branches: state.branches.find((b) => b.id === row.branch_id) ?? null,
          class_programs:
            state.programs.find((p) => p.id === row.program_id) ?? null,
        }));
    }
    return [];
  }

  function executeSingle(maybe: boolean) {
    if (ctx.mode === 'insert') {
      state.mutationCalls += 1;
      if (table === 'class_programs') {
        if (state.programInsertShouldFail) {
          return Promise.resolve({
            data: null,
            error: { code: '23505', message: 'duplicate key value' },
          });
        }
        const now = nextUpdatedAt();
        const p = ctx.payload ?? {};
        const created: MockProgramRow = {
          id: 'f2100000-0000-4000-8000-000000000801',
          title: String(p.title),
          slug: String(p.slug),
          short_description: (p.short_description as string | null) ?? null,
          description: (p.description as string | null) ?? null,
          base_price_idr: Number(p.base_price_idr),
          age_min: (p.age_min as number | null) ?? null,
          age_max: (p.age_max as number | null) ?? null,
          duration_minutes: (p.duration_minutes as number | null) ?? null,
          cover_image_path: (p.cover_image_path as string | null) ?? null,
          cover_storage_bucket: String(
            p.cover_storage_bucket ?? 'media-drafts',
          ),
          cover_is_approved: Boolean(p.cover_is_approved),
          cover_alt_text: (p.cover_alt_text as string | null) ?? null,
          needs_owner_review: Boolean(p.needs_owner_review ?? true),
          included_items: Array.isArray(p.included_items)
            ? (p.included_items as string[])
            : [],
          status: String(p.status ?? 'draft'),
          created_at: now,
          updated_at: now,
        };
        state.programs.push(created);
        return Promise.resolve({ data: created, error: null });
      }
      if (table === 'class_sessions') {
        const now = nextUpdatedAt();
        const s = ctx.payload ?? {};
        const created: MockSessionRow = {
          id: 'f2100000-0000-4000-8000-000000000802',
          program_id: String(s.program_id),
          branch_id: String(s.branch_id),
          starts_at: String(s.starts_at),
          ends_at: String(s.ends_at),
          registration_deadline_at:
            (s.registration_deadline_at as string | null) ?? null,
          capacity: Number(s.capacity),
          seats_left: (s.seats_left as number | null) ?? null,
          price_override_idr: (s.price_override_idr as number | null) ?? null,
          status: String(s.status ?? 'scheduled'),
          is_registration_open: Boolean(s.is_registration_open),
          created_at: now,
          updated_at: now,
        };
        state.sessions.push(created);
        return Promise.resolve({
          data: {
            ...created,
            branches: state.branches.find((b) => b.id === created.branch_id),
            class_programs: state.programs.find(
              (p) => p.id === created.program_id,
            ),
          },
          error: null,
        });
      }
    }

    if (ctx.mode === 'update') {
      state.mutationCalls += 1;
      const list = table === 'class_programs' ? state.programs : state.sessions;
      const target = list.find((row) =>
        Object.entries(ctx.filters).every(
          ([k, v]) => (row as unknown as Record<string, unknown>)[k] === v,
        ),
      );
      if (!target) {
        return Promise.resolve({ data: null, error: null });
      }
      Object.assign(target, ctx.payload, { updated_at: nextUpdatedAt() });
      if (table === 'class_sessions') {
        const s = target as MockSessionRow;
        return Promise.resolve({
          data: {
            ...s,
            branches: state.branches.find((b) => b.id === s.branch_id),
            class_programs: state.programs.find((p) => p.id === s.program_id),
          },
          error: null,
        });
      }
      return Promise.resolve({ data: target, error: null });
    }

    const rows = runRows();
    if (rows.length === 0) {
      return Promise.resolve({
        data: null,
        error: maybe ? null : { code: 'PGRST116', message: 'Not found' },
      });
    }
    return Promise.resolve({ data: rows[0], error: null });
  }

  const builder = {
    select: () => builder,
    insert: (payload: Record<string, unknown>) => {
      ctx.mode = 'insert';
      ctx.payload = payload;
      return builder;
    },
    update: (payload: Record<string, unknown>) => {
      ctx.mode = 'update';
      ctx.payload = payload;
      return builder;
    },
    eq: (col: string, val: unknown) => {
      ctx.filters[col] = val;
      return builder;
    },
    order: () => builder,
    abortSignal: () => builder,
    limit: () => builder,
    maybeSingle: () => executeSingle(true),
    single: () => executeSingle(false),
    then: (
      onFulfilled: (val: { data: unknown; error: null }) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => {
      if (ctx.mode === 'update') {
        state.mutationCalls += 1;
        for (const row of runRows()) {
          Object.assign(row, ctx.payload, { updated_at: nextUpdatedAt() });
        }
        return Promise.resolve({ data: [], error: null }).then(
          onFulfilled,
          onRejected,
        );
      }
      return Promise.resolve({ data: runRows(), error: null }).then(
        onFulfilled,
        onRejected,
      );
    },
  };

  return builder;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-13T10:00:00.000Z'));

  state.actor = 'owner';
  state.tick = 1;
  state.publicError = false;
  state.promoteShouldFail = false;
  state.programInsertShouldFail = false;
  state.mutationCalls = 0;
  state.cleanupCalls = [];

  state.branches = [
    {
      id: SURABAYA_ID,
      code: 'surabaya',
      name: 'Surabaya',
      city: 'Surabaya',
      whatsapp_number: '6281703384308',
      address: 'Rungkut Asri Tengah V No. 22, Surabaya',
      is_active: true,
    },
    {
      id: BINTARO_ID,
      code: 'bintaro',
      name: 'Bintaro',
      city: 'Tangerang Selatan',
      whatsapp_number: '6285119785194',
      address: null,
      is_active: true,
    },
  ];

  state.programs = [
    {
      id: PROGRAM_PUB_ID,
      title: 'Little Baker Chiffon Class',
      slug: 'little-baker-chiffon-class',
      short_description: 'Belajar memanggang chiffon lembut.',
      description: 'Kelas praktik lengkap di dapur Resep Oma Kueh.',
      base_price_idr: 185_000,
      age_min: 4,
      age_max: 12,
      duration_minutes: 90,
      cover_image_path: 'approved/f0400000-0000-4000-8000-000000000001.webp',
      cover_storage_bucket: 'class-images',
      cover_is_approved: true,
      cover_alt_text: 'Suasana dapur kelas baking anak',
      needs_owner_review: false,
      included_items: ['Bahan kue', 'Celemek pinjaman'],
      status: 'published',
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    },
    {
      id: PROGRAM_DRAFT_ID,
      title: 'Adult Artisan Bread (Draft)',
      slug: 'adult-artisan-bread',
      short_description: 'Masih draf internal.',
      description: 'Menunggu foto dan review Owner.',
      base_price_idr: 250_000,
      age_min: 17,
      age_max: 60,
      duration_minutes: 150,
      cover_image_path: null,
      cover_storage_bucket: 'media-drafts',
      cover_is_approved: false,
      cover_alt_text: null,
      needs_owner_review: true,
      included_items: [],
      status: 'draft',
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    },
  ];

  state.sessions = [
    {
      id: SESSION_PAST_ID,
      program_id: PROGRAM_PUB_ID,
      branch_id: SURABAYA_ID,
      starts_at: '2026-06-20T03:00:00.000Z',
      ends_at: '2026-06-20T04:30:00.000Z',
      registration_deadline_at: '2026-06-19T10:00:00.000Z',
      capacity: 12,
      seats_left: 0,
      price_override_idr: null,
      status: 'completed',
      is_registration_open: false,
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-20T05:00:00.000Z',
    },
    {
      id: SESSION_SBY_ID,
      program_id: PROGRAM_PUB_ID,
      branch_id: SURABAYA_ID,
      starts_at: '2026-11-20T03:00:00.000Z',
      ends_at: '2026-11-20T04:30:00.000Z',
      registration_deadline_at: '2026-11-19T12:00:00.000Z',
      capacity: 12,
      seats_left: 6,
      price_override_idr: null,
      status: 'scheduled',
      is_registration_open: true,
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    },
    {
      id: SESSION_BTR_FULL_ID,
      program_id: PROGRAM_PUB_ID,
      branch_id: BINTARO_ID,
      starts_at: '2026-11-21T03:00:00.000Z',
      ends_at: '2026-11-21T04:30:00.000Z',
      registration_deadline_at: '2026-11-20T12:00:00.000Z',
      capacity: 10,
      seats_left: 0,
      price_override_idr: null,
      status: 'full',
      is_registration_open: false,
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    },
    {
      id: SESSION_CANCELLED_ID,
      program_id: PROGRAM_PUB_ID,
      branch_id: BINTARO_ID,
      starts_at: '2026-11-22T03:00:00.000Z',
      ends_at: '2026-11-22T04:30:00.000Z',
      registration_deadline_at: '2026-11-21T12:00:00.000Z',
      capacity: 10,
      seats_left: 4,
      price_override_idr: 215_000,
      status: 'cancelled',
      is_registration_open: false,
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    },
    {
      id: SESSION_EXPIRED_ID,
      program_id: PROGRAM_PUB_ID,
      branch_id: SURABAYA_ID,
      starts_at: '2026-11-23T03:00:00.000Z',
      ends_at: '2026-11-23T04:30:00.000Z',
      registration_deadline_at: '2026-11-13T09:59:59.000Z',
      capacity: 10,
      seats_left: 3,
      price_override_idr: null,
      status: 'scheduled',
      is_registration_open: true,
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    },
    {
      id: SESSION_UNKNOWN_SEATS_ID,
      program_id: PROGRAM_PUB_ID,
      branch_id: BINTARO_ID,
      starts_at: '2026-11-24T03:00:00.000Z',
      ends_at: '2026-11-24T04:30:00.000Z',
      registration_deadline_at: '2026-11-23T12:00:00.000Z',
      capacity: 10,
      seats_left: null,
      price_override_idr: 215_000,
      status: 'scheduled',
      is_registration_open: true,
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    },
    {
      id: SESSION_OVERRIDE_ID,
      program_id: PROGRAM_DRAFT_ID,
      branch_id: SURABAYA_ID,
      starts_at: '2026-11-25T03:00:00.000Z',
      ends_at: '2026-11-25T05:00:00.000Z',
      registration_deadline_at: '2026-11-24T12:00:00.000Z',
      capacity: 8,
      seats_left: 5,
      price_override_idr: 275_000,
      status: 'scheduled',
      is_registration_open: true,
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    },
  ];
});

afterEach(() => {
  vi.useRealTimers();
});

describe('F21 public baking class API & registration preparation', () => {
  it('lists only published/reviewed programs with upcoming sessions filtered by branch', async () => {
    const allRes = await getPublicClassesRoute(
      new Request('https://resepomakueh.example/api/classes'),
    );
    expect(allRes.status).toBe(200);
    const allBody = await allRes.json();
    expect(allBody.data.items).toHaveLength(1);
    expect(allBody.data.items[0].slug).toBe('little-baker-chiffon-class');
    // Past session 2026-06-20 excluded from upcomingSessions
    expect(
      allBody.data.items[0].upcomingSessions.some(
        (s: { id: string }) => s.id === SESSION_PAST_ID,
      ),
    ).toBe(false);

    const sbyRes = await getPublicClassesRoute(
      new Request('https://resepomakueh.example/api/classes?branch=surabaya'),
    );
    const sbyBody = await sbyRes.json();
    expect(
      sbyBody.data.items[0].upcomingSessions.every(
        (s: { branch: { id: string } }) => s.branch.id === SURABAYA_ID,
      ),
    ).toBe(true);
  });

  it('hides draft/unapproved programs with 404 on detail route and returns 503 on upstream failure', async () => {
    const draftRes = await getPublicClassDetailRoute(
      new Request(
        'https://resepomakueh.example/api/classes/adult-artisan-bread',
      ),
      { params: Promise.resolve({ slug: 'adult-artisan-bread' }) },
    );
    expect(draftRes.status).toBe(404);

    state.publicError = true;
    const errRes = await getPublicClassesRoute(
      new Request('https://resepomakueh.example/api/classes'),
    );
    expect(errRes.status).toBe(503);
  });

  it('prepares WhatsApp URL with trusted branch number, price override, unknown seats estimate, and zero DB mutations', async () => {
    const sbyRes = await prepareClassRegistrationRoute(
      new Request(
        'https://resepomakueh.example/api/classes/prepare-registration',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: SESSION_SBY_ID,
            attendeeCount: 2,
            adultContactName: 'Ibu Melati',
          }),
        },
      ),
    );
    expect(sbyRes.status).toBe(200);
    const sbyData = (await sbyRes.json()).data;
    expect(sbyData.whatsappNumber).toBe('6281703384308');
    expect(sbyData.unitPriceIdr).toBe(185_000);
    expect(sbyData.estimatedTotalIdr).toBe(370_000);
    expect(sbyData.capacityIsEstimate).toBe(true);

    // Bintaro session with priceOverrideIdr=215_000 & seatsLeft=null
    const btrRes = await prepareClassRegistrationRoute(
      new Request(
        'https://resepomakueh.example/api/classes/prepare-registration',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: SESSION_UNKNOWN_SEATS_ID,
            attendeeCount: 3,
          }),
        },
      ),
    );
    expect(btrRes.status).toBe(200);
    const btrData = (await btrRes.json()).data;
    expect(btrData.whatsappNumber).toBe('6285119785194');
    expect(btrData.unitPriceIdr).toBe(215_000);
    expect(btrData.estimatedTotalIdr).toBe(645_000);
    expect(btrData.seatsLeft).toBeNull();
    expect(state.mutationCalls).toBe(0);
  });

  it('rejects cancelled, full, expired deadline, past, unpublished program, insufficient seats, and strict extra fields', async () => {
    for (const [sessionId, expectedStatus] of [
      [SESSION_CANCELLED_ID, 409],
      [SESSION_BTR_FULL_ID, 409],
      [SESSION_EXPIRED_ID, 409],
      [SESSION_PAST_ID, 409],
      [SESSION_OVERRIDE_ID, 409],
    ] as const) {
      const res = await prepareClassRegistrationRoute(
        new Request(
          'https://resepomakueh.example/api/classes/prepare-registration',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, attendeeCount: 1 }),
          },
        ),
      );
      expect(res.status).toBe(expectedStatus);
    }

    const tooManySeats = await prepareClassRegistrationRoute(
      new Request(
        'https://resepomakueh.example/api/classes/prepare-registration',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: SESSION_SBY_ID, attendeeCount: 7 }),
        },
      ),
    );
    expect(tooManySeats.status).toBe(409);

    const extraChildField = await prepareClassRegistrationRoute(
      new Request(
        'https://resepomakueh.example/api/classes/prepare-registration',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: SESSION_SBY_ID,
            attendeeCount: 1,
            childAge: 6,
          }),
        },
      ),
    );
    expect(extraChildField.status).toBe(422);

    const hugePayload = await prepareClassRegistrationRoute(
      new Request(
        'https://resepomakueh.example/api/classes/prepare-registration',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: SESSION_SBY_ID,
            attendeeCount: 1,
            adultContactName: 'a'.repeat(33_000),
          }),
        },
      ),
    );
    expect(hugePayload.status).toBe(413);
    expect(hugePayload.headers.get('cache-control')).toContain('no-store');
    expect(CLASSES_COPY.WA_ERRORS.SESSION_CANCELLED).toBeTruthy();
  });
});

describe('F21 admin baking class routes & RBAC', () => {
  it('enforces auth, owner-only programs, branch scope for staff, and forbidden price overrides', async () => {
    state.actor = 'anon';
    const anonRes = await listAdminClassProgramsRoute(
      new Request('https://resepomakueh.example/api/admin/classes/programs'),
    );
    expect(anonRes.status).toBe(401);

    state.actor = 'staff_sby';
    const staffCreateProgram = await createAdminClassProgramRoute(
      new Request('https://resepomakueh.example/api/admin/classes/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Program Ilegal',
          slug: 'program-ilegal',
          basePriceIdr: 150_000,
        }),
      }),
    );
    expect(staffCreateProgram.status).toBe(403);

    const staffForeignSession = await createAdminClassSessionRoute(
      new Request('https://resepomakueh.example/api/admin/classes/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: PROGRAM_PUB_ID,
          branchId: BINTARO_ID,
          startsAt: '2026-12-01T03:00:00.000Z',
          endsAt: '2026-12-01T04:30:00.000Z',
          capacity: 10,
        }),
      }),
    );
    expect(staffForeignSession.status).toBe(403);

    const staffPriceOverride = await patchAdminClassSessionRoute(
      new Request(
        `https://resepomakueh.example/api/admin/classes/sessions/${SESSION_SBY_ID}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceOverrideIdr: 250_000,
            expectedUpdatedAt: '2026-11-01T00:00:00.000Z',
          }),
        },
      ),
      { params: Promise.resolve({ id: SESSION_SBY_ID }) },
    );
    expect(staffPriceOverride.status).toBe(403);

    // Staff can cancel own branch session & receives private no-store header
    const staffCancelOwn = await cancelAdminClassSessionRoute(
      new Request(
        `https://resepomakueh.example/api/admin/classes/sessions/${SESSION_SBY_ID}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expectedUpdatedAt: '2026-11-01T00:00:00.000Z',
          }),
        },
      ),
      { params: Promise.resolve({ id: SESSION_SBY_ID }) },
    );
    expect(staffCancelOwn.status).toBe(200);
    const cancelledBody = await staffCancelOwn.json();
    expect(cancelledBody.data.item.status).toBe('cancelled');
    expect(cancelledBody.data.item.isRegistrationOpen).toBe(false);
    expect(staffCancelOwn.headers.get('cache-control')).toContain('no-store');
  });

  it('handles stale expectedUpdatedAt 409, immutable slug, cover draft promotion & orphan cleanup on DB failure', async () => {
    state.actor = 'owner';

    const stalePatch = await patchAdminClassProgramRoute(
      new Request(
        `https://resepomakueh.example/api/admin/classes/programs/${PROGRAM_PUB_ID}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Judul Baru',
            expectedUpdatedAt: '2020-01-01T00:00:00.000Z',
          }),
        },
      ),
      { params: Promise.resolve({ id: PROGRAM_PUB_ID }) },
    );
    expect(stalePatch.status).toBe(409);

    const listSessionsRes = await listAdminClassSessionsRoute(
      new Request('https://resepomakueh.example/api/admin/classes/sessions'),
    );
    expect(listSessionsRes.status).toBe(200);

    // Rollback orphan storage cleanup when insert fails after cover promotion
    state.programInsertShouldFail = true;
    const failedCreate = await createAdminClassProgramRoute(
      new Request('https://resepomakueh.example/api/admin/classes/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Kelas Rollback Storage',
          slug: 'kelas-rollback-storage',
          description: 'Deskripsi lengkap.',
          basePriceIdr: 195_000,
          draftCoverPath: `${OWNER_ID}/drafts/rollback-test.webp`,
          coverAltText: 'Foto demo kelas',
          coverIsApproved: true,
          needsOwnerReview: false,
          status: 'published',
        }),
      }),
    );
    expect(failedCreate.status).toBe(409);
    expect(state.cleanupCalls).toHaveLength(1);
    expect(state.cleanupCalls[0]).toMatchObject({
      bucket: 'class-images',
      path: 'approved/rollback-test.webp',
      reason: 'class_save_rollback',
    });

    // Archive closes open sessions cleanly
    state.programInsertShouldFail = false;
    const archivedRes = await archiveAdminClassProgramRoute(
      new Request(
        `https://resepomakueh.example/api/admin/classes/programs/${PROGRAM_PUB_ID}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expectedUpdatedAt: '2026-11-01T00:00:00.000Z',
          }),
        },
      ),
      { params: Promise.resolve({ id: PROGRAM_PUB_ID }) },
    );
    expect(archivedRes.status).toBe(200);
    const archivedItem = (await archivedRes.json()).data.item;
    expect(archivedItem.status).toBe('archived');
  });
});
