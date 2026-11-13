import { CLASSES_COPY, CLASSES_LIMITS } from '@/constants/classes.constant';
import type {
  ClassSessionStatus,
  ClassUnavailableReason,
} from '@/types/classes';
import { formatJakartaDateTimeDisplay } from '@/utils/admin-promotions';
import { buildWhatsAppUrl, sanitizeUserInput } from '@/utils/checkout';
import { formatIdr } from '@/utils/currency';

const JAKARTA_TIME_ONLY = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function computeEffectiveClassPriceIdr(
  basePriceIdr: number,
  priceOverrideIdr: number | null | undefined,
): number {
  return priceOverrideIdr ?? basePriceIdr;
}

export function formatClassAgeRange(
  ageMin: number | null,
  ageMax: number | null,
): string | null {
  if (ageMin !== null && ageMax !== null) {
    return ageMin === ageMax
      ? `Usia ${ageMin} tahun`
      : `Usia ${ageMin}–${ageMax} tahun`;
  }
  if (ageMin !== null) {
    return `Minimal usia ${ageMin} tahun`;
  }
  if (ageMax !== null) {
    return `Hingga usia ${ageMax} tahun`;
  }
  return null;
}

export function formatClassScheduleJakarta(
  startsAtIso: string,
  endsAtIso: string,
): string {
  const startLabel = formatJakartaDateTimeDisplay(startsAtIso);
  const endDate = new Date(endsAtIso);
  if (Number.isNaN(endDate.getTime())) {
    return startLabel;
  }
  const endTimeLabel = `${JAKARTA_TIME_ONLY.format(endDate)} WIB`;
  return `${startLabel} – ${endTimeLabel}`;
}

export interface ClassAvailabilityInput {
  startsAt: string;
  endsAt: string;
  registrationDeadlineAt: string | null;
  capacity: number;
  seatsLeft: number | null;
  status: ClassSessionStatus;
  isRegistrationOpen: boolean;
  branchIsActive: boolean;
  programIsPublic: boolean;
}

export interface ClassAvailabilityEvaluation {
  isPast: boolean;
  isDeadlinePassed: boolean;
  isRegisterable: boolean;
  unavailableReason: ClassUnavailableReason | null;
  statusBadgeLabel: string;
}

export function evaluateClassSessionAvailability(
  input: ClassAvailabilityInput,
  nowMs: number = Date.now(),
): ClassAvailabilityEvaluation {
  const startsMs = Date.parse(input.startsAt);
  const endsMs = Date.parse(input.endsAt);
  const deadlineMs =
    input.registrationDeadlineAt !== null
      ? Date.parse(input.registrationDeadlineAt)
      : null;

  const isPast =
    !Number.isFinite(startsMs) ||
    !Number.isFinite(endsMs) ||
    startsMs <= nowMs ||
    input.status === 'completed';

  const isDeadlinePassed =
    deadlineMs !== null && (!Number.isFinite(deadlineMs) || deadlineMs < nowMs);

  if (isPast) {
    return {
      isPast: true,
      isDeadlinePassed,
      isRegisterable: false,
      unavailableReason: 'SESSION_ENDED',
      statusBadgeLabel: CLASSES_COPY.STATUS_BADGE.ENDED,
    };
  }

  if (input.status === 'cancelled') {
    return {
      isPast: false,
      isDeadlinePassed,
      isRegisterable: false,
      unavailableReason: 'SESSION_CANCELLED',
      statusBadgeLabel: CLASSES_COPY.STATUS_BADGE.CANCELLED,
    };
  }

  if (
    input.status === 'full' ||
    (input.seatsLeft !== null && input.seatsLeft <= 0)
  ) {
    return {
      isPast: false,
      isDeadlinePassed,
      isRegisterable: false,
      unavailableReason: 'SESSION_FULL',
      statusBadgeLabel: CLASSES_COPY.STATUS_BADGE.FULL,
    };
  }

  if (!input.isRegistrationOpen) {
    return {
      isPast: false,
      isDeadlinePassed,
      isRegisterable: false,
      unavailableReason: 'REGISTRATION_CLOSED',
      statusBadgeLabel: CLASSES_COPY.STATUS_BADGE.CLOSED,
    };
  }

  if (isDeadlinePassed) {
    return {
      isPast: false,
      isDeadlinePassed: true,
      isRegisterable: false,
      unavailableReason: 'DEADLINE_PASSED',
      statusBadgeLabel: CLASSES_COPY.STATUS_BADGE.DEADLINE_PASSED,
    };
  }

  if (!input.branchIsActive) {
    return {
      isPast: false,
      isDeadlinePassed: false,
      isRegisterable: false,
      unavailableReason: 'BRANCH_INACTIVE',
      statusBadgeLabel: CLASSES_COPY.STATUS_BADGE.UNAVAILABLE,
    };
  }

  if (!input.programIsPublic) {
    return {
      isPast: false,
      isDeadlinePassed: false,
      isRegisterable: false,
      unavailableReason: 'PROGRAM_UNAVAILABLE',
      statusBadgeLabel: CLASSES_COPY.STATUS_BADGE.UNAVAILABLE,
    };
  }

  return {
    isPast: false,
    isDeadlinePassed: false,
    isRegisterable: true,
    unavailableReason: null,
    statusBadgeLabel: CLASSES_COPY.STATUS_BADGE.AVAILABLE,
  };
}

export function sortClassSessionsAscending<
  T extends { startsAt: string; id: string },
>(sessions: readonly T[]): T[] {
  return [...sessions].sort((left, right) => {
    const leftMs = Date.parse(left.startsAt);
    const rightMs = Date.parse(right.startsAt);
    if (leftMs !== rightMs) {
      return leftMs - rightMs;
    }
    return left.id.localeCompare(right.id);
  });
}

export interface ComposeClassRegistrationMessageParams {
  sessionId: string;
  programTitle: string;
  branchName: string;
  startsAt: string;
  endsAt: string;
  attendeeCount: number;
  unitPriceIdr: number;
  estimatedTotalIdr: number;
  capacity: number;
  seatsLeft: number | null;
  ageRangeLabel: string | null;
  adultContactName: string | null;
}

function sanitizeClassLineText(input: string | null | undefined): string {
  return sanitizeUserInput(input)
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,
      '',
    )
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function composeClassRegistrationWhatsAppPayload(
  rawWhatsappNumber: string,
  params: ComposeClassRegistrationMessageParams,
  maxUrlLength: number = CLASSES_LIMITS.MAX_WA_URL_LENGTH,
): {
  formattedScheduleJakarta: string;
  whatsappMessage: string;
  whatsappUrl: string;
  requiresCopy: boolean;
} {
  const formattedScheduleJakarta = formatClassScheduleJakarta(
    params.startsAt,
    params.endsAt,
  );
  const safeProgram = sanitizeClassLineText(params.programTitle);
  const safeBranch = sanitizeClassLineText(params.branchName);
  const safeAdultName = sanitizeClassLineText(params.adultContactName);

  const lines: string[] = [
    'Halo Admin Resep Oma Kueh,',
    'Saya ingin mengajukan konfirmasi pendaftaran ROK Baking Class:',
    '',
    `*PROGRAM:* ${safeProgram}`,
    `*SESSION ID:* ${params.sessionId}`,
    `*CABANG:* ${safeBranch}`,
    `*JADWAL:* ${formattedScheduleJakarta}`,
  ];

  if (params.ageRangeLabel) {
    lines.push(`*KATEGORI USIA:* ${params.ageRangeLabel}`);
  }

  lines.push(`*JUMLAH PESERTA:* ${params.attendeeCount} orang`);

  if (safeAdultName) {
    lines.push(`*KONTAK WALI/DEWASA:* ${safeAdultName}`);
  }

  lines.push(
    `*ESTIMASI BIAYA:* ${formatIdr(params.unitPriceIdr)} x ${params.attendeeCount} = ${formatIdr(params.estimatedTotalIdr)}`,
  );

  if (params.seatsLeft !== null) {
    lines.push(
      `*SISA KUOTA TERCATAT:* ${params.seatsLeft} dari ${params.capacity} kursi (perkiraan manual)`,
    );
  } else {
    lines.push(
      `*KAPASITAS PERKIRAAN:* ${params.capacity} kursi (sisa kuota dikonfirmasi langsung oleh admin)`,
    );
  }

  lines.push(
    '',
    'Mohon konfirmasi ketersediaan kursi dan total biaya akhir sebelum pendaftaran dinyatakan tercatat. Terima kasih!',
  );

  const whatsappMessage = lines.join('\n');
  const { whatsappUrl, requiresCopy } = buildWhatsAppUrl(
    rawWhatsappNumber,
    whatsappMessage,
    maxUrlLength,
  );

  return {
    formattedScheduleJakarta,
    whatsappMessage,
    whatsappUrl,
    requiresCopy,
  };
}

export function buildAskNextClassWhatsAppUrl(
  rawWhatsappNumber: string,
  branchName: string,
  programTitle?: string | null,
): string {
  const safeBranch = sanitizeClassLineText(branchName);
  const safeProgram = sanitizeClassLineText(programTitle);
  const message = safeProgram
    ? `Halo Admin Resep Oma Kueh Cabang ${safeBranch}, saya ingin menanyakan perkiraan jadwal berikutnya untuk kelas "${safeProgram}". Terima kasih!`
    : `Halo Admin Resep Oma Kueh Cabang ${safeBranch}, saya ingin menanyakan jadwal ROK Baking Class berikutnya. Terima kasih!`;

  return buildWhatsAppUrl(rawWhatsappNumber, message).whatsappUrl;
}
