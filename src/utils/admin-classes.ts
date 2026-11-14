import type {
  AdminClassProgramItem,
  AdminClassSessionItem,
  ProgramFormState,
  SessionFormState,
} from '@/types/classes';
import { toJakartaDateTimeInputValue } from '@/utils/admin-promotions';

/**
 * Converts a class program title into a clean URL slug capped at 100 chars.
 */
export function slugifyClassTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 100);
}

/**
 * Parses an optional integer input string; returns null when empty and NaN when invalid.
 */
export function parseOptionalIntInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

/**
 * Splits newline-delimited class included items into trimmed non-empty lines.
 */
export function parseIncludedItemsText(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function createEmptyProgramForm(): ProgramFormState {
  return {
    id: null,
    expectedUpdatedAt: null,
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    basePriceIdr: '185000',
    ageMin: '4',
    ageMax: '12',
    durationMinutes: '90',
    includedItemsText: '',
    draftCoverPath: null,
    clearCover: false,
    coverAltText: '',
    coverPreviewUrl: null,
    coverIsApproved: false,
    needsOwnerReview: true,
    status: 'draft',
  };
}

export function createProgramFormFromItem(
  item: AdminClassProgramItem,
): ProgramFormState {
  return {
    id: item.id,
    expectedUpdatedAt: item.updatedAt,
    title: item.title,
    slug: item.slug,
    shortDescription: item.shortDescription ?? '',
    description: item.description ?? '',
    basePriceIdr: String(item.basePriceIdr),
    ageMin: item.ageMin === null ? '' : String(item.ageMin),
    ageMax: item.ageMax === null ? '' : String(item.ageMax),
    durationMinutes:
      item.durationMinutes === null ? '' : String(item.durationMinutes),
    includedItemsText: item.includedItems.join('\n'),
    draftCoverPath: null,
    clearCover: false,
    coverAltText: item.coverAltText ?? '',
    coverPreviewUrl: item.coverPreviewUrl,
    coverIsApproved: item.coverIsApproved,
    needsOwnerReview: item.needsOwnerReview,
    status: item.status,
  };
}

export function createEmptySessionForm(
  defaultProgramId: string,
  defaultBranchId: string,
): SessionFormState {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(tomorrow.getTime() + 90 * 60 * 1000);
  const deadline = new Date(tomorrow.getTime() - 2 * 60 * 60 * 1000);

  return {
    id: null,
    expectedUpdatedAt: null,
    programId: defaultProgramId,
    branchId: defaultBranchId,
    startsAtLocal: toJakartaDateTimeInputValue(tomorrow.toISOString()),
    endsAtLocal: toJakartaDateTimeInputValue(tomorrowEnd.toISOString()),
    deadlineAtLocal: toJakartaDateTimeInputValue(deadline.toISOString()),
    capacity: '12',
    seatsLeft: '',
    priceOverrideIdr: '',
    status: 'scheduled',
    isRegistrationOpen: false,
  };
}

export function createSessionFormFromItem(
  item: AdminClassSessionItem,
): SessionFormState {
  return {
    id: item.id,
    expectedUpdatedAt: item.updatedAt,
    programId: item.programId,
    branchId: item.branchId,
    startsAtLocal: toJakartaDateTimeInputValue(item.startsAt),
    endsAtLocal: toJakartaDateTimeInputValue(item.endsAt),
    deadlineAtLocal: item.registrationDeadlineAt
      ? toJakartaDateTimeInputValue(item.registrationDeadlineAt)
      : '',
    capacity: String(item.capacity),
    seatsLeft: item.seatsLeft === null ? '' : String(item.seatsLeft),
    priceOverrideIdr:
      item.priceOverrideIdr === null ? '' : String(item.priceOverrideIdr),
    status: item.status,
    isRegistrationOpen: item.isRegistrationOpen,
  };
}
