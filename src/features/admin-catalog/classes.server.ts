import 'server-only';

import {
  ADMIN_CATALOG_COPY,
  ADMIN_CATALOG_LIMITS,
} from '@/constants/admin-catalog.constant';
import {
  AdminCatalogConflictError,
  AdminCatalogNotFoundError,
  AdminCatalogUpstreamError,
  AdminCatalogValidationError,
  mapPostgresClassError,
} from '@/features/admin-catalog/errors.server';
import {
  rejectImmutableSlugOnPatch,
  revalidatePublicClassPaths,
  stripUnchangedSlugForPatch,
} from '@/features/admin-catalog/http.server';
import {
  cleanupOrphanStorageObjects,
  promoteDraftMediaToPublicBucket,
  resolveAdminMediaPreviewUrl,
} from '@/features/admin-catalog/media.server';
import type { AdminRepoContext } from '@/features/admin-catalog/repository.server';
import { isPublicClassProgramPublishReady } from '@/features/classes/service.server';
import { AuthForbiddenError } from '@/features/auth/errors.server';
import { createServerAuthClient } from '@/lib/supabase/server';
import type { AdminSessionProfile } from '@/types/auth';
import type {
  AdminClassProgramItem,
  AdminClassSessionItem,
  CreateAdminClassProgramInput,
  CreateAdminClassSessionInput,
  UpdateAdminClassProgramInput,
  UpdateAdminClassSessionInput,
} from '@/types/classes';
import { ADMIN_MEDIA_BUCKETS } from '@/utils/admin-media';
import { computeEffectiveClassPriceIdr } from '@/utils/classes';
import {
  adminClassProgramItemSchema,
  adminClassSessionItemSchema,
} from '@/validations/classes.schema';

interface RawProgramRow {
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
  included_items: unknown;
  status: string;
  created_at: string;
  updated_at: string;
}

interface RawSessionRow {
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
  branches: {
    id: string;
    code: string;
    name: string;
    is_active: boolean;
  } | null;
  class_programs: {
    id: string;
    title: string;
    slug: string;
    status: string;
    base_price_idr: number;
  } | null;
}

const PROGRAM_ADMIN_SELECT =
  'id,title,slug,short_description,description,base_price_idr,age_min,age_max,duration_minutes,cover_image_path,cover_storage_bucket,cover_is_approved,cover_alt_text,needs_owner_review,included_items,status,created_at,updated_at';

const SESSION_ADMIN_SELECT =
  'id,program_id,branch_id,starts_at,ends_at,registration_deadline_at,capacity,seats_left,price_override_idr,status,is_registration_open,created_at,updated_at,branches(id,code,name,is_active),class_programs(id,title,slug,status,base_price_idr)';

function withDeadline(signal?: AbortSignal) {
  const deadline = AbortSignal.timeout(ADMIN_CATALOG_LIMITS.READ_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, deadline]) : deadline;
}

function assertOwnerForProgram(profile: AdminSessionProfile): void {
  if (profile.role !== 'owner') {
    throw new AuthForbiddenError(ADMIN_CATALOG_COPY.CLASSES.ERRORS.OWNER_ONLY);
  }
}

function normalizeIncludedItems(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

async function mapProgramRowToDto(
  row: RawProgramRow,
  ctx: AdminRepoContext,
): Promise<AdminClassProgramItem> {
  const coverPreviewUrl = row.cover_image_path
    ? await resolveAdminMediaPreviewUrl(
        row.cover_storage_bucket,
        row.cover_image_path,
        ctx,
      )
    : null;

  return adminClassProgramItemSchema.parse({
    id: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription: row.short_description,
    description: row.description,
    basePriceIdr: row.base_price_idr,
    ageMin: row.age_min,
    ageMax: row.age_max,
    durationMinutes: row.duration_minutes,
    coverImagePath: row.cover_image_path,
    coverStorageBucket: row.cover_storage_bucket,
    coverIsApproved: row.cover_is_approved,
    coverAltText: row.cover_alt_text,
    coverPreviewUrl,
    needsOwnerReview: row.needs_owner_review,
    includedItems: normalizeIncludedItems(row.included_items),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function mapSessionRowToDto(row: RawSessionRow): AdminClassSessionItem {
  if (!row.branches || !row.class_programs) {
    throw new AdminCatalogUpstreamError();
  }

  return adminClassSessionItemSchema.parse({
    id: row.id,
    programId: row.program_id,
    programTitle: row.class_programs.title,
    programSlug: row.class_programs.slug,
    programStatus: row.class_programs.status,
    programBasePriceIdr: row.class_programs.base_price_idr,
    branchId: row.branch_id,
    branchCode: row.branches.code,
    branchName: row.branches.name,
    branchIsActive: row.branches.is_active,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    registrationDeadlineAt: row.registration_deadline_at,
    capacity: row.capacity,
    seatsLeft: row.seats_left,
    priceOverrideIdr: row.price_override_idr,
    effectivePriceIdr: computeEffectiveClassPriceIdr(
      row.class_programs.base_price_idr,
      row.price_override_idr,
    ),
    status: row.status,
    isRegistrationOpen: row.is_registration_open,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function validateProgramPublishReadiness(program: {
  status: string;
  description: string | null;
  needsOwnerReview: boolean;
  coverIsApproved: boolean;
  coverStorageBucket: string;
  coverImagePath: string | null;
  coverAltText: string | null;
}): void {
  if (program.status !== 'published') {
    return;
  }

  if (
    program.needsOwnerReview ||
    !program.description ||
    !program.description.trim() ||
    !program.coverIsApproved ||
    program.coverStorageBucket !== ADMIN_MEDIA_BUCKETS.CLASS_IMAGES ||
    !program.coverImagePath ||
    !program.coverAltText ||
    !program.coverAltText.trim()
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CLASSES.ERRORS.PROGRAM_NOT_PUBLISH_READY,
      {
        status: [ADMIN_CATALOG_COPY.CLASSES.ERRORS.PROGRAM_NOT_PUBLISH_READY],
      },
    );
  }
}

export async function listAdminClassPrograms(
  profile: AdminSessionProfile,
  ctx: AdminRepoContext = {},
): Promise<{ items: AdminClassProgramItem[] }> {
  const client = await createServerAuthClient(ctx.response);
  let query = client
    .from('class_programs')
    .select(PROGRAM_ADMIN_SELECT)
    .order('created_at', { ascending: false })
    .order('id');

  if (profile.role === 'branch_admin') {
    query = query
      .eq('status', 'published')
      .eq('needs_owner_review', false)
      .eq('cover_is_approved', true);
  }

  const { data, error } = await query
    .limit(100)
    .abortSignal(withDeadline(ctx.signal));

  if (error) {
    throw new AdminCatalogUpstreamError();
  }

  const items = await Promise.all(
    ((data ?? []) as RawProgramRow[]).map((row) =>
      mapProgramRowToDto(row, ctx),
    ),
  );

  return { items };
}

export async function createAdminClassProgram(
  profile: AdminSessionProfile,
  input: CreateAdminClassProgramInput,
  ctx: AdminRepoContext = {},
): Promise<AdminClassProgramItem> {
  assertOwnerForProgram(profile);

  if (
    input.ageMin !== undefined &&
    input.ageMin !== null &&
    input.ageMax !== undefined &&
    input.ageMax !== null &&
    input.ageMin > input.ageMax
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_AGE_RANGE,
      { ageMin: [ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_AGE_RANGE] },
    );
  }

  let coverStorageBucket: 'media-drafts' | 'class-images' =
    ADMIN_MEDIA_BUCKETS.DRAFTS;
  let coverImagePath: string | null = null;
  let promotedTarget: { storageBucket: string; storagePath: string } | null =
    null;

  if (input.draftCoverPath) {
    const promoted = await promoteDraftMediaToPublicBucket(
      profile,
      input.draftCoverPath,
      ctx,
      ADMIN_MEDIA_BUCKETS.CLASS_IMAGES,
    );
    coverStorageBucket = promoted.storageBucket;
    coverImagePath = promoted.storagePath;
    promotedTarget = promoted;
  }

  const coverIsApproved = Boolean(
    input.coverIsApproved &&
    coverStorageBucket === ADMIN_MEDIA_BUCKETS.CLASS_IMAGES &&
    coverImagePath &&
    input.coverAltText?.trim(),
  );

  try {
    validateProgramPublishReadiness({
      status: input.status,
      description: input.description ?? null,
      needsOwnerReview: input.needsOwnerReview,
      coverIsApproved,
      coverStorageBucket,
      coverImagePath,
      coverAltText: input.coverAltText ?? null,
    });
  } catch (err) {
    if (promotedTarget) {
      await cleanupOrphanStorageObjects(
        profile,
        [promotedTarget],
        'class_save_rollback',
        ctx,
      );
    }
    throw err;
  }

  const client = await createServerAuthClient(ctx.response);
  const { data, error } = await client
    .from('class_programs')
    .insert({
      title: input.title,
      slug: input.slug,
      short_description: input.shortDescription ?? null,
      description: input.description ?? null,
      base_price_idr: input.basePriceIdr,
      age_min: input.ageMin ?? null,
      age_max: input.ageMax ?? null,
      duration_minutes: input.durationMinutes ?? null,
      included_items: input.includedItems ?? [],
      cover_image_path: coverImagePath,
      cover_storage_bucket: coverStorageBucket,
      cover_is_approved: coverIsApproved,
      cover_alt_text: input.coverAltText ?? null,
      needs_owner_review: input.needsOwnerReview,
      status: input.status,
    })
    .select(PROGRAM_ADMIN_SELECT)
    .abortSignal(withDeadline(ctx.signal))
    .maybeSingle();

  if (error || !data) {
    if (promotedTarget) {
      await cleanupOrphanStorageObjects(
        profile,
        [promotedTarget],
        'class_save_rollback',
        ctx,
      );
    }
    if (error) {
      mapPostgresClassError(error, 'program');
    }
    throw new AdminCatalogUpstreamError();
  }

  const item = await mapProgramRowToDto(data as RawProgramRow, ctx);
  revalidatePublicClassPaths(item.slug);
  return item;
}

export async function updateAdminClassProgram(
  profile: AdminSessionProfile,
  programId: string,
  rawBody: unknown,
  parseInput: (cleanedBody: unknown) => UpdateAdminClassProgramInput,
  ctx: AdminRepoContext = {},
): Promise<AdminClassProgramItem> {
  assertOwnerForProgram(profile);

  const client = await createServerAuthClient(ctx.response);
  const { data: existingData, error: existingErr } = await client
    .from('class_programs')
    .select(PROGRAM_ADMIN_SELECT)
    .eq('id', programId)
    .abortSignal(withDeadline(ctx.signal))
    .maybeSingle();

  if (existingErr) {
    throw new AdminCatalogUpstreamError();
  }
  if (!existingData) {
    throw new AdminCatalogNotFoundError();
  }

  const existing = existingData as RawProgramRow;
  rejectImmutableSlugOnPatch(rawBody, existing.slug, 'product');
  const input = parseInput(stripUnchangedSlugForPatch(rawBody));

  const mergedAgeMin =
    input.ageMin !== undefined ? input.ageMin : existing.age_min;
  const mergedAgeMax =
    input.ageMax !== undefined ? input.ageMax : existing.age_max;

  if (
    mergedAgeMin !== null &&
    mergedAgeMax !== null &&
    mergedAgeMin > mergedAgeMax
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_AGE_RANGE,
      { ageMin: [ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_AGE_RANGE] },
    );
  }

  let nextCoverBucket = existing.cover_storage_bucket as
    'media-drafts' | 'class-images';
  let nextCoverPath = existing.cover_image_path;
  let promotedTarget: { storageBucket: string; storagePath: string } | null =
    null;

  if (input.clearCover) {
    nextCoverBucket = ADMIN_MEDIA_BUCKETS.DRAFTS;
    nextCoverPath = null;
  } else if (input.draftCoverPath) {
    const promoted = await promoteDraftMediaToPublicBucket(
      profile,
      input.draftCoverPath,
      ctx,
      ADMIN_MEDIA_BUCKETS.CLASS_IMAGES,
    );
    nextCoverBucket = promoted.storageBucket;
    nextCoverPath = promoted.storagePath;
    promotedTarget = promoted;
  }

  const nextAltText =
    input.coverAltText !== undefined
      ? input.coverAltText
      : existing.cover_alt_text;
  const nextCoverApproved =
    input.clearCover === true
      ? false
      : input.coverIsApproved !== undefined
        ? Boolean(
            input.coverIsApproved &&
            nextCoverBucket === ADMIN_MEDIA_BUCKETS.CLASS_IMAGES &&
            nextCoverPath &&
            nextAltText?.trim(),
          )
        : Boolean(
            existing.cover_is_approved &&
            nextCoverBucket === ADMIN_MEDIA_BUCKETS.CLASS_IMAGES &&
            nextCoverPath &&
            nextAltText?.trim(),
          );
  const nextNeedsReview =
    input.needsOwnerReview !== undefined
      ? input.needsOwnerReview
      : existing.needs_owner_review;
  const nextStatus =
    input.status ?? (existing.status as 'draft' | 'published' | 'archived');
  const nextDescription =
    input.description !== undefined ? input.description : existing.description;

  try {
    validateProgramPublishReadiness({
      status: nextStatus,
      description: nextDescription,
      needsOwnerReview: nextNeedsReview,
      coverIsApproved: nextCoverApproved,
      coverStorageBucket: nextCoverBucket,
      coverImagePath: nextCoverPath,
      coverAltText: nextAltText,
    });
  } catch (err) {
    if (promotedTarget) {
      await cleanupOrphanStorageObjects(
        profile,
        [promotedTarget],
        'class_save_rollback',
        ctx,
      );
    }
    throw err;
  }

  // Close open sessions first when moving a program out of published so DB deferred trigger stays satisfied.
  if (existing.status === 'published' && nextStatus !== 'published') {
    const { error: closeErr } = await client
      .from('class_sessions')
      .update({ is_registration_open: false })
      .eq('program_id', programId)
      .eq('is_registration_open', true)
      .abortSignal(withDeadline(ctx.signal));
    if (closeErr) {
      if (promotedTarget) {
        await cleanupOrphanStorageObjects(
          profile,
          [promotedTarget],
          'class_save_rollback',
          ctx,
        );
      }
      mapPostgresClassError(closeErr, 'session');
    }
  }

  const { data: updatedData, error: updateErr } = await client
    .from('class_programs')
    .update({
      title: input.title ?? existing.title,
      short_description:
        input.shortDescription !== undefined
          ? input.shortDescription
          : existing.short_description,
      description: nextDescription,
      base_price_idr: input.basePriceIdr ?? existing.base_price_idr,
      age_min: mergedAgeMin,
      age_max: mergedAgeMax,
      duration_minutes:
        input.durationMinutes !== undefined
          ? input.durationMinutes
          : existing.duration_minutes,
      included_items:
        input.includedItems !== undefined
          ? input.includedItems
          : normalizeIncludedItems(existing.included_items),
      cover_image_path: nextCoverPath,
      cover_storage_bucket: nextCoverBucket,
      cover_is_approved: nextCoverApproved,
      cover_alt_text: nextAltText,
      needs_owner_review: nextNeedsReview,
      status: nextStatus,
    })
    .eq('id', programId)
    .eq('updated_at', input.expectedUpdatedAt)
    .select(PROGRAM_ADMIN_SELECT)
    .abortSignal(withDeadline(ctx.signal))
    .maybeSingle();

  if (updateErr) {
    if (promotedTarget) {
      await cleanupOrphanStorageObjects(
        profile,
        [promotedTarget],
        'class_save_rollback',
        ctx,
      );
    }
    mapPostgresClassError(updateErr, 'program');
  }

  if (!updatedData) {
    if (promotedTarget) {
      await cleanupOrphanStorageObjects(
        profile,
        [promotedTarget],
        'class_save_rollback',
        ctx,
      );
    }
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.CLASSES.ERRORS.STALE_CONFLICT,
    );
  }

  if (
    existing.cover_image_path &&
    existing.cover_storage_bucket === ADMIN_MEDIA_BUCKETS.CLASS_IMAGES &&
    (nextCoverPath !== existing.cover_image_path ||
      nextCoverBucket !== existing.cover_storage_bucket)
  ) {
    await cleanupOrphanStorageObjects(
      profile,
      [
        {
          storageBucket: existing.cover_storage_bucket,
          storagePath: existing.cover_image_path,
        },
      ],
      'removed_from_class',
      ctx,
    );
  }

  const item = await mapProgramRowToDto(updatedData as RawProgramRow, ctx);
  revalidatePublicClassPaths(item.slug);
  return item;
}

export async function archiveAdminClassProgram(
  profile: AdminSessionProfile,
  programId: string,
  expectedUpdatedAt: string,
  ctx: AdminRepoContext = {},
): Promise<AdminClassProgramItem> {
  assertOwnerForProgram(profile);

  const client = await createServerAuthClient(ctx.response);
  const { data: existingData, error: existingErr } = await client
    .from('class_programs')
    .select(PROGRAM_ADMIN_SELECT)
    .eq('id', programId)
    .abortSignal(withDeadline(ctx.signal))
    .maybeSingle();

  if (existingErr) {
    throw new AdminCatalogUpstreamError();
  }
  if (!existingData) {
    throw new AdminCatalogNotFoundError();
  }

  const { error: closeErr } = await client
    .from('class_sessions')
    .update({ is_registration_open: false })
    .eq('program_id', programId)
    .eq('is_registration_open', true)
    .abortSignal(withDeadline(ctx.signal));

  if (closeErr) {
    mapPostgresClassError(closeErr, 'session');
  }

  const { data: archivedData, error: archiveErr } = await client
    .from('class_programs')
    .update({ status: 'archived' })
    .eq('id', programId)
    .eq('updated_at', expectedUpdatedAt)
    .select(PROGRAM_ADMIN_SELECT)
    .abortSignal(withDeadline(ctx.signal))
    .maybeSingle();

  if (archiveErr) {
    mapPostgresClassError(archiveErr, 'program');
  }
  if (!archivedData) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.CLASSES.ERRORS.STALE_CONFLICT,
    );
  }

  const item = await mapProgramRowToDto(archivedData as RawProgramRow, ctx);
  revalidatePublicClassPaths(item.slug);
  return item;
}

function validateSessionScheduleAndStatus(input: {
  startsAt: string;
  endsAt: string;
  registrationDeadlineAt: string | null;
  capacity: number;
  seatsLeft: number | null;
  status: 'scheduled' | 'full' | 'cancelled' | 'completed';
  isRegistrationOpen: boolean;
}): void {
  const startsMs = Date.parse(input.startsAt);
  const endsMs = Date.parse(input.endsAt);
  if (
    !Number.isFinite(startsMs) ||
    !Number.isFinite(endsMs) ||
    endsMs <= startsMs
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_INTERVAL,
      { endsAt: [ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_INTERVAL] },
    );
  }

  if (input.registrationDeadlineAt !== null) {
    const deadlineMs = Date.parse(input.registrationDeadlineAt);
    if (!Number.isFinite(deadlineMs) || deadlineMs > startsMs) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_DEADLINE,
        {
          registrationDeadlineAt: [
            ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_DEADLINE,
          ],
        },
      );
    }
  }

  if (
    input.seatsLeft !== null &&
    (input.seatsLeft < 0 || input.seatsLeft > input.capacity)
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_SEATS,
      { seatsLeft: [ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_SEATS] },
    );
  }

  if (
    input.isRegistrationOpen &&
    (input.status !== 'scheduled' ||
      (input.seatsLeft !== null && input.seatsLeft <= 0))
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CLASSES.ERRORS.SESSION_NOT_REGISTRATION_READY,
      {
        isRegistrationOpen: [
          ADMIN_CATALOG_COPY.CLASSES.ERRORS.SESSION_NOT_REGISTRATION_READY,
        ],
      },
    );
  }
}

export async function listAdminClassSessions(
  profile: AdminSessionProfile,
  filters: { branchId?: string; programId?: string } = {},
  ctx: AdminRepoContext = {},
): Promise<{ items: AdminClassSessionItem[] }> {
  if (profile.role === 'branch_admin') {
    if (!profile.branchId) {
      return { items: [] };
    }
    if (filters.branchId && filters.branchId !== profile.branchId) {
      throw new AuthForbiddenError(
        ADMIN_CATALOG_COPY.CLASSES.ERRORS.BRANCH_DENIED,
      );
    }
  }

  const client = await createServerAuthClient(ctx.response);
  let query = client
    .from('class_sessions')
    .select(SESSION_ADMIN_SELECT)
    .order('starts_at', { ascending: true })
    .order('id', { ascending: true });

  const scopedBranchId =
    profile.role === 'branch_admin' ? profile.branchId : filters.branchId;
  if (scopedBranchId) {
    query = query.eq('branch_id', scopedBranchId);
  }
  if (filters.programId) {
    query = query.eq('program_id', filters.programId);
  }

  const { data, error } = await query
    .limit(200)
    .abortSignal(withDeadline(ctx.signal));

  if (error) {
    throw new AdminCatalogUpstreamError();
  }

  const items = ((data ?? []) as RawSessionRow[])
    .filter((row) => Boolean(row.branches && row.class_programs))
    .map(mapSessionRowToDto);

  return { items };
}

export async function createAdminClassSession(
  profile: AdminSessionProfile,
  input: CreateAdminClassSessionInput,
  rawBody: unknown,
  ctx: AdminRepoContext = {},
): Promise<AdminClassSessionItem> {
  if (profile.role === 'branch_admin') {
    if (!profile.branchId || input.branchId !== profile.branchId) {
      throw new AuthForbiddenError(
        ADMIN_CATALOG_COPY.CLASSES.ERRORS.BRANCH_DENIED,
      );
    }
    if (rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)) {
      const obj = rawBody as Record<string, unknown>;
      if (
        ('priceOverrideIdr' in obj && obj.priceOverrideIdr !== null) ||
        'price_override_idr' in obj
      ) {
        throw new AuthForbiddenError(
          ADMIN_CATALOG_COPY.CLASSES.ERRORS.STAFF_PRICE_DENIED,
        );
      }
    }
    if (
      input.priceOverrideIdr !== undefined &&
      input.priceOverrideIdr !== null
    ) {
      throw new AuthForbiddenError(
        ADMIN_CATALOG_COPY.CLASSES.ERRORS.STAFF_PRICE_DENIED,
      );
    }
  }

  const seatsLeft = input.seatsLeft !== undefined ? input.seatsLeft : null;
  const registrationDeadlineAt =
    input.registrationDeadlineAt !== undefined
      ? input.registrationDeadlineAt
      : null;

  validateSessionScheduleAndStatus({
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    registrationDeadlineAt,
    capacity: input.capacity,
    seatsLeft,
    status: input.status,
    isRegistrationOpen: input.isRegistrationOpen,
  });

  const client = await createServerAuthClient(ctx.response);
  const [
    { data: programData, error: programErr },
    { data: branchData, error: branchErr },
  ] = await Promise.all([
    client
      .from('class_programs')
      .select(
        'id,slug,status,needs_owner_review,cover_is_approved,cover_storage_bucket,cover_image_path,cover_alt_text,description',
      )
      .eq('id', input.programId)
      .abortSignal(withDeadline(ctx.signal))
      .maybeSingle(),
    client
      .from('branches')
      .select('id,is_active')
      .eq('id', input.branchId)
      .abortSignal(withDeadline(ctx.signal))
      .maybeSingle(),
  ]);

  if (programErr || branchErr) {
    throw new AdminCatalogUpstreamError();
  }
  if (!programData || !branchData) {
    throw new AdminCatalogValidationError(
      'Program kelas atau cabang target tidak ditemukan.',
      { root: ['Program kelas atau cabang target tidak ditemukan.'] },
    );
  }

  const programIsPublic = isPublicClassProgramPublishReady(programData);
  if (input.isRegistrationOpen && (!programIsPublic || !branchData.is_active)) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CLASSES.ERRORS.SESSION_NOT_REGISTRATION_READY,
      {
        isRegistrationOpen: [
          ADMIN_CATALOG_COPY.CLASSES.ERRORS.SESSION_NOT_REGISTRATION_READY,
        ],
      },
    );
  }

  const insertPayload = {
    program_id: input.programId,
    branch_id: input.branchId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    registration_deadline_at: registrationDeadlineAt,
    capacity: input.capacity,
    seats_left: seatsLeft,
    status: input.status,
    is_registration_open: input.isRegistrationOpen,
    ...(profile.role === 'owner'
      ? { price_override_idr: input.priceOverrideIdr ?? null }
      : {}),
  };

  const { data: inserted, error: insertErr } = await client
    .from('class_sessions')
    .insert(insertPayload)
    .select(SESSION_ADMIN_SELECT)
    .abortSignal(withDeadline(ctx.signal))
    .maybeSingle();

  if (insertErr || !inserted) {
    if (insertErr) {
      mapPostgresClassError(insertErr, 'session');
    }
    throw new AdminCatalogUpstreamError();
  }

  const item = mapSessionRowToDto(inserted as RawSessionRow);
  revalidatePublicClassPaths(item.programSlug);
  return item;
}

export async function updateAdminClassSession(
  profile: AdminSessionProfile,
  sessionId: string,
  input: UpdateAdminClassSessionInput,
  rawBody: unknown,
  ctx: AdminRepoContext = {},
): Promise<AdminClassSessionItem> {
  if (profile.role === 'branch_admin') {
    if (rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)) {
      const obj = rawBody as Record<string, unknown>;
      if (
        'priceOverrideIdr' in obj ||
        'price_override_idr' in obj ||
        'branchId' in obj ||
        'branch_id' in obj ||
        'programId' in obj ||
        'program_id' in obj
      ) {
        throw new AuthForbiddenError(
          ADMIN_CATALOG_COPY.CLASSES.ERRORS.STAFF_PRICE_DENIED,
        );
      }
    }
    if (input.priceOverrideIdr !== undefined) {
      throw new AuthForbiddenError(
        ADMIN_CATALOG_COPY.CLASSES.ERRORS.STAFF_PRICE_DENIED,
      );
    }
  }

  const client = await createServerAuthClient(ctx.response);
  const { data: existingData, error: existingErr } = await client
    .from('class_sessions')
    .select(SESSION_ADMIN_SELECT)
    .eq('id', sessionId)
    .abortSignal(withDeadline(ctx.signal))
    .maybeSingle();

  if (existingErr) {
    throw new AdminCatalogUpstreamError();
  }
  if (!existingData) {
    throw new AdminCatalogNotFoundError();
  }

  const existing = existingData as RawSessionRow;
  if (
    profile.role === 'branch_admin' &&
    existing.branch_id !== profile.branchId
  ) {
    throw new AuthForbiddenError(
      ADMIN_CATALOG_COPY.CLASSES.ERRORS.BRANCH_DENIED,
    );
  }

  const nextStartsAt = input.startsAt ?? existing.starts_at;
  const nextEndsAt = input.endsAt ?? existing.ends_at;
  const nextDeadlineAt =
    input.registrationDeadlineAt !== undefined
      ? input.registrationDeadlineAt
      : existing.registration_deadline_at;
  const nextCapacity = input.capacity ?? existing.capacity;
  const nextSeatsLeft =
    input.seatsLeft !== undefined ? input.seatsLeft : existing.seats_left;
  const nextStatus = (input.status ?? existing.status) as
    'scheduled' | 'full' | 'cancelled' | 'completed';

  const nextIsOpen =
    input.isRegistrationOpen !== undefined
      ? input.isRegistrationOpen
      : nextStatus === 'scheduled'
        ? existing.is_registration_open
        : false;

  validateSessionScheduleAndStatus({
    startsAt: nextStartsAt,
    endsAt: nextEndsAt,
    registrationDeadlineAt: nextDeadlineAt,
    capacity: nextCapacity,
    seatsLeft: nextSeatsLeft,
    status: nextStatus,
    isRegistrationOpen: nextIsOpen,
  });

  if (
    nextIsOpen &&
    (!existing.branches?.is_active ||
      existing.class_programs?.status !== 'published')
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.CLASSES.ERRORS.SESSION_NOT_REGISTRATION_READY,
      {
        isRegistrationOpen: [
          ADMIN_CATALOG_COPY.CLASSES.ERRORS.SESSION_NOT_REGISTRATION_READY,
        ],
      },
    );
  }

  const updatePayload = {
    starts_at: nextStartsAt,
    ends_at: nextEndsAt,
    registration_deadline_at: nextDeadlineAt,
    capacity: nextCapacity,
    seats_left: nextSeatsLeft,
    status: nextStatus,
    is_registration_open: nextIsOpen,
    ...(profile.role === 'owner' && input.priceOverrideIdr !== undefined
      ? { price_override_idr: input.priceOverrideIdr }
      : {}),
  };

  const { data: updatedData, error: updateErr } = await client
    .from('class_sessions')
    .update(updatePayload)
    .eq('id', sessionId)
    .eq('updated_at', input.expectedUpdatedAt)
    .select(SESSION_ADMIN_SELECT)
    .abortSignal(withDeadline(ctx.signal))
    .maybeSingle();

  if (updateErr) {
    mapPostgresClassError(updateErr, 'session');
  }
  if (!updatedData) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.CLASSES.ERRORS.STALE_CONFLICT,
    );
  }

  const item = mapSessionRowToDto(updatedData as RawSessionRow);
  revalidatePublicClassPaths(item.programSlug);
  return item;
}

export async function cancelAdminClassSession(
  profile: AdminSessionProfile,
  sessionId: string,
  expectedUpdatedAt: string,
  ctx: AdminRepoContext = {},
): Promise<AdminClassSessionItem> {
  return updateAdminClassSession(
    profile,
    sessionId,
    {
      status: 'cancelled',
      isRegistrationOpen: false,
      expectedUpdatedAt,
    },
    { status: 'cancelled', isRegistrationOpen: false, expectedUpdatedAt },
    ctx,
  );
}
