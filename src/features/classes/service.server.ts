import 'server-only';

import { CLASSES_COPY, CLASSES_LIMITS } from '@/constants/classes.constant';
import {
  PublicClassConflictError,
  PublicClassNotFoundError,
  PublicClassUpstreamError,
  PublicClassValidationError,
} from '@/features/classes/errors.server';
import {
  readActiveClassBranchesRepo,
  readClassSessionForPrepareRepo,
  readPublicClassProgramBySlugRepo,
  readPublicClassProgramsRepo,
  readPublicClassSessionsRepo,
  resolvePublicClassCoverUrl,
} from '@/features/classes/repository.server';
import { ADMIN_MEDIA_BUCKETS } from '@/utils/admin-media';
import {
  composeClassRegistrationWhatsAppPayload,
  computeEffectiveClassPriceIdr,
  evaluateClassSessionAvailability,
  formatClassAgeRange,
  sortClassSessionsAscending,
} from '@/utils/classes';
import { formatWhatsappDigits } from '@/utils/checkout';
import type {
  ClassProgramStatus,
  ClassSessionStatus,
  PrepareClassRegistrationInput,
  PrepareClassRegistrationResult,
  PublicClassProgram,
  PublicClassSession,
  PublicClassesListData,
} from '@/types/classes';
import {
  classProgramStatusSchema,
  classSessionStatusSchema,
  prepareClassRegistrationDataSchema,
  publicClassProgramSummarySchema,
  publicClassSessionSchema,
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
}

interface RawBranchNested {
  id: string;
  code: string;
  name: string;
  city: string;
  whatsapp_number: string;
  address: string | null;
  is_active: boolean;
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
  branches: RawBranchNested | null;
}

export function isPublicClassProgramPublishReady(
  program: Pick<
    RawProgramRow,
    | 'status'
    | 'needs_owner_review'
    | 'cover_is_approved'
    | 'cover_storage_bucket'
    | 'cover_image_path'
    | 'cover_alt_text'
    | 'description'
  >,
): boolean {
  return (
    program.status === 'published' &&
    !program.needs_owner_review &&
    program.cover_is_approved &&
    program.cover_storage_bucket === ADMIN_MEDIA_BUCKETS.CLASS_IMAGES &&
    Boolean(program.cover_image_path && program.cover_image_path.trim()) &&
    Boolean(program.cover_alt_text && program.cover_alt_text.trim()) &&
    Boolean(program.description && program.description.trim())
  );
}

function normalizeIncludedItems(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .slice(0, CLASSES_LIMITS.MAX_INCLUDED_ITEMS);
}

function mapSessionRow(
  row: RawSessionRow,
  program: RawProgramRow,
  nowMs: number,
): PublicClassSession | null {
  const branch = row.branches;
  if (!branch || !branch.is_active) {
    return null;
  }

  const parsedStatus = classSessionStatusSchema.safeParse(row.status);
  const status: ClassSessionStatus = parsedStatus.success
    ? parsedStatus.data
    : 'completed';

  const programIsPublic = isPublicClassProgramPublishReady(program);
  const availability = evaluateClassSessionAvailability(
    {
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      registrationDeadlineAt: row.registration_deadline_at,
      capacity: row.capacity,
      seatsLeft: row.seats_left,
      status,
      isRegistrationOpen: row.is_registration_open,
      branchIsActive: branch.is_active,
      programIsPublic,
    },
    nowMs,
  );

  // Past/completed sessions are never presented in customer upcoming schedules.
  if (availability.isPast) {
    return null;
  }

  const effectivePriceIdr = computeEffectiveClassPriceIdr(
    program.base_price_idr,
    row.price_override_idr,
  );

  return publicClassSessionSchema.parse({
    id: row.id,
    programId: row.program_id,
    branch: {
      id: branch.id,
      code: branch.code,
      name: branch.name,
      city: branch.city,
      whatsappNumber: formatWhatsappDigits(branch.whatsapp_number),
      address: branch.address,
    },
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    registrationDeadlineAt: row.registration_deadline_at,
    capacity: row.capacity,
    seatsLeft: row.seats_left,
    capacityIsEstimate: true,
    effectivePriceIdr,
    hasPriceOverride:
      row.price_override_idr !== null &&
      row.price_override_idr !== program.base_price_idr,
    status,
    isRegistrationOpen: row.is_registration_open,
    isRegisterable: availability.isRegisterable,
    unavailableReason: availability.unavailableReason,
  });
}

function mapProgramSummary(
  program: RawProgramRow,
  sessionRows: readonly RawSessionRow[],
  resolvedBranchId: string | null,
  nowMs: number,
): PublicClassProgram {
  const mappedSessions = sortClassSessionsAscending(
    sessionRows
      .filter((session) => session.program_id === program.id)
      .map((session) => mapSessionRow(session, program, nowMs))
      .filter((item): item is PublicClassSession => item !== null)
      .filter((item) =>
        resolvedBranchId ? item.branch.id === resolvedBranchId : true,
      ),
  );

  const registerableSessionCount = mappedSessions.filter(
    (session) => session.isRegisterable,
  ).length;

  return publicClassProgramSummarySchema.parse({
    id: program.id,
    title: program.title,
    slug: program.slug,
    shortDescription: program.short_description,
    description: program.description ?? program.title,
    basePriceIdr: program.base_price_idr,
    ageMin: program.age_min,
    ageMax: program.age_max,
    durationMinutes: program.duration_minutes,
    coverImageUrl: resolvePublicClassCoverUrl(
      program.cover_storage_bucket,
      program.cover_image_path,
      program.cover_is_approved,
    ),
    coverAltText: program.cover_alt_text ?? program.title,
    includedItems: normalizeIncludedItems(program.included_items),
    upcomingSessions: mappedSessions,
    registerableSessionCount,
  });
}

export async function getPublicClassesDirectory(
  query: { branch?: string } = {},
  signal?: AbortSignal,
  now: Date = new Date(),
): Promise<PublicClassesListData> {
  const nowMs = now.getTime();
  let branches: Awaited<ReturnType<typeof readActiveClassBranchesRepo>>;
  let programs: Awaited<ReturnType<typeof readPublicClassProgramsRepo>>;
  try {
    [branches, programs] = await Promise.all([
      readActiveClassBranchesRepo(signal),
      readPublicClassProgramsRepo(signal),
    ]);
  } catch {
    throw new PublicClassUpstreamError();
  }

  const resolvedBranchId = query.branch
    ? (branches.find((b) => b.code === query.branch)?.id ?? null)
    : null;

  const publishablePrograms = programs.filter((p) =>
    isPublicClassProgramPublishReady(p as RawProgramRow),
  );

  if (publishablePrograms.length === 0) {
    return {
      items: [],
      resolvedBranchId,
      evaluatedAtUtc: now.toISOString(),
    };
  }

  let sessionRows: Awaited<ReturnType<typeof readPublicClassSessionsRepo>>;
  try {
    sessionRows = await readPublicClassSessionsRepo(
      publishablePrograms.map((p) => p.id),
      signal,
    );
  } catch {
    throw new PublicClassUpstreamError();
  }

  const items = publishablePrograms
    .map((program) =>
      mapProgramSummary(
        program as RawProgramRow,
        sessionRows as RawSessionRow[],
        resolvedBranchId,
        nowMs,
      ),
    )
    .sort((left, right) => {
      const leftNext = left.upcomingSessions[0]?.startsAt ?? null;
      const rightNext = right.upcomingSessions[0]?.startsAt ?? null;
      if (leftNext && rightNext) {
        return Date.parse(leftNext) - Date.parse(rightNext);
      }
      if (leftNext && !rightNext) return -1;
      if (!leftNext && rightNext) return 1;
      return left.title.localeCompare(right.title);
    });

  return {
    items,
    resolvedBranchId,
    evaluatedAtUtc: now.toISOString(),
  };
}

export async function getPublicClassDetail(
  slug: string,
  query: { branch?: string } = {},
  signal?: AbortSignal,
  now: Date = new Date(),
): Promise<{
  program: PublicClassProgram;
  resolvedBranchId: string | null;
  evaluatedAtUtc: string;
}> {
  const nowMs = now.getTime();
  let branches: Awaited<ReturnType<typeof readActiveClassBranchesRepo>>;
  let program: Awaited<ReturnType<typeof readPublicClassProgramBySlugRepo>>;
  try {
    [branches, program] = await Promise.all([
      readActiveClassBranchesRepo(signal),
      readPublicClassProgramBySlugRepo(slug, signal),
    ]);
  } catch {
    throw new PublicClassUpstreamError();
  }

  if (!program || !isPublicClassProgramPublishReady(program as RawProgramRow)) {
    throw new PublicClassNotFoundError('Program kelas tidak ditemukan.');
  }

  const resolvedBranchId = query.branch
    ? (branches.find((b) => b.code === query.branch)?.id ?? null)
    : null;

  let sessionRows: Awaited<ReturnType<typeof readPublicClassSessionsRepo>>;
  try {
    sessionRows = await readPublicClassSessionsRepo([program.id], signal);
  } catch {
    throw new PublicClassUpstreamError();
  }

  return {
    program: mapProgramSummary(
      program as RawProgramRow,
      sessionRows as RawSessionRow[],
      resolvedBranchId,
      nowMs,
    ),
    resolvedBranchId,
    evaluatedAtUtc: now.toISOString(),
  };
}

export async function prepareClassRegistration(
  input: PrepareClassRegistrationInput,
  signal?: AbortSignal,
  now: Date = new Date(),
): Promise<PrepareClassRegistrationResult> {
  const nowMs = now.getTime();
  let row: Awaited<ReturnType<typeof readClassSessionForPrepareRepo>>;
  try {
    row = await readClassSessionForPrepareRepo(input.sessionId, signal);
  } catch {
    throw new PublicClassUpstreamError();
  }

  if (!row || !row.class_programs || !row.branches) {
    throw new PublicClassNotFoundError(
      CLASSES_COPY.WA_ERRORS.SESSION_NOT_FOUND,
    );
  }

  const program = row.class_programs;
  const branch = row.branches;
  const parsedProgramStatus = classProgramStatusSchema.safeParse(
    program.status,
  );
  const parsedSessionStatus = classSessionStatusSchema.safeParse(row.status);
  const sessionStatus: ClassSessionStatus = parsedSessionStatus.success
    ? parsedSessionStatus.data
    : 'completed';
  const programStatus: ClassProgramStatus = parsedProgramStatus.success
    ? parsedProgramStatus.data
    : 'draft';

  const programIsPublic =
    programStatus === 'published' &&
    !program.needs_owner_review &&
    program.cover_is_approved &&
    program.cover_storage_bucket === ADMIN_MEDIA_BUCKETS.CLASS_IMAGES &&
    Boolean(program.cover_image_path) &&
    Boolean(program.cover_alt_text);

  const availability = evaluateClassSessionAvailability(
    {
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      registrationDeadlineAt: row.registration_deadline_at,
      capacity: row.capacity,
      seatsLeft: row.seats_left,
      status: sessionStatus,
      isRegistrationOpen: row.is_registration_open,
      branchIsActive: branch.is_active,
      programIsPublic,
    },
    nowMs,
  );

  if (!availability.isRegisterable) {
    switch (availability.unavailableReason) {
      case 'PROGRAM_UNAVAILABLE':
        throw new PublicClassConflictError(
          'PROGRAM_UNAVAILABLE',
          CLASSES_COPY.WA_ERRORS.PROGRAM_UNAVAILABLE,
          { sessionId: [CLASSES_COPY.WA_ERRORS.PROGRAM_UNAVAILABLE] },
        );
      case 'BRANCH_INACTIVE':
        throw new PublicClassConflictError(
          'BRANCH_UNAVAILABLE',
          CLASSES_COPY.WA_ERRORS.BRANCH_UNAVAILABLE,
          { sessionId: [CLASSES_COPY.WA_ERRORS.BRANCH_UNAVAILABLE] },
        );
      case 'SESSION_CANCELLED':
        throw new PublicClassConflictError(
          'SESSION_CANCELLED',
          CLASSES_COPY.WA_ERRORS.SESSION_CANCELLED,
          { sessionId: [CLASSES_COPY.WA_ERRORS.SESSION_CANCELLED] },
        );
      case 'SESSION_FULL':
        throw new PublicClassConflictError(
          'SESSION_FULL',
          CLASSES_COPY.WA_ERRORS.SESSION_FULL,
          { sessionId: [CLASSES_COPY.WA_ERRORS.SESSION_FULL] },
        );
      case 'REGISTRATION_CLOSED':
        throw new PublicClassConflictError(
          'REGISTRATION_CLOSED',
          CLASSES_COPY.WA_ERRORS.REGISTRATION_CLOSED,
          { sessionId: [CLASSES_COPY.WA_ERRORS.REGISTRATION_CLOSED] },
        );
      case 'DEADLINE_PASSED':
        throw new PublicClassConflictError(
          'DEADLINE_PASSED',
          CLASSES_COPY.WA_ERRORS.DEADLINE_PASSED,
          { sessionId: [CLASSES_COPY.WA_ERRORS.DEADLINE_PASSED] },
        );
      case 'SESSION_ENDED':
      default:
        throw new PublicClassConflictError(
          'SESSION_ENDED',
          CLASSES_COPY.WA_ERRORS.SESSION_ENDED,
          { sessionId: [CLASSES_COPY.WA_ERRORS.SESSION_ENDED] },
        );
    }
  }

  if (input.attendeeCount > row.capacity) {
    throw new PublicClassValidationError(
      CLASSES_COPY.WA_ERRORS.CAPACITY_EXCEEDED,
      { attendeeCount: [CLASSES_COPY.WA_ERRORS.CAPACITY_EXCEEDED] },
    );
  }

  if (row.seats_left !== null && input.attendeeCount > row.seats_left) {
    throw new PublicClassConflictError(
      'INSUFFICIENT_SEATS',
      CLASSES_COPY.WA_ERRORS.INSUFFICIENT_SEATS,
      { attendeeCount: [CLASSES_COPY.WA_ERRORS.INSUFFICIENT_SEATS] },
    );
  }

  const branchDigits = formatWhatsappDigits(branch.whatsapp_number);
  if (!branchDigits || branchDigits.length < 8) {
    throw new PublicClassConflictError(
      'BRANCH_UNAVAILABLE',
      CLASSES_COPY.WA_ERRORS.BRANCH_UNAVAILABLE,
    );
  }

  const unitPriceIdr = computeEffectiveClassPriceIdr(
    program.base_price_idr,
    row.price_override_idr,
  );
  const estimatedTotalIdr = unitPriceIdr * input.attendeeCount;
  if (!Number.isSafeInteger(estimatedTotalIdr) || estimatedTotalIdr <= 0) {
    throw new PublicClassUpstreamError();
  }

  const adultContactName = input.adultContactName?.trim() || null;
  const ageRangeLabel = formatClassAgeRange(program.age_min, program.age_max);
  const waPayload = composeClassRegistrationWhatsAppPayload(branchDigits, {
    sessionId: row.id,
    programTitle: program.title,
    branchName: branch.name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    attendeeCount: input.attendeeCount,
    unitPriceIdr,
    estimatedTotalIdr,
    capacity: row.capacity,
    seatsLeft: row.seats_left,
    ageRangeLabel,
    adultContactName,
  });

  return prepareClassRegistrationDataSchema.parse({
    sessionId: row.id,
    programId: program.id,
    programTitle: program.title,
    programSlug: program.slug,
    branchId: branch.id,
    branchCode: branch.code,
    branchName: branch.name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    registrationDeadlineAt: row.registration_deadline_at,
    formattedScheduleJakarta: waPayload.formattedScheduleJakarta,
    attendeeCount: input.attendeeCount,
    unitPriceIdr,
    estimatedTotalIdr,
    capacity: row.capacity,
    seatsLeft: row.seats_left,
    capacityIsEstimate: true,
    adultContactName,
    whatsappNumber: branchDigits,
    whatsappUrl: waPayload.whatsappUrl,
    whatsappMessage: waPayload.whatsappMessage,
    requiresCopy: waPayload.requiresCopy,
    manualConfirmationNote: CLASSES_COPY.CAPACITY_DISCLAIMER,
  });
}
