import {
  PROMOTION_JAKARTA_OFFSET,
  PROMOTION_TIMEZONE,
} from '@/constants/promotion.constant';
import type { PromotionClockState } from '@/types/promotion';
import {
  calculateCandidateDiscountIdr,
  formatIdr,
} from '@/utils/catalog-pricing';

const JAKARTA_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  timeZone: PROMOTION_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const JAKARTA_INPUT_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: PROMOTION_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function derivePromotionClockState(
  startsAtIso: string,
  endsAtIso: string,
  now: Date = new Date(),
): PromotionClockState {
  const startMs = Date.parse(startsAtIso);
  const endMs = Date.parse(endsAtIso);
  const nowMs = now.getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return 'ended';
  }
  if (nowMs < startMs) return 'scheduled';
  if (nowMs >= endMs) return 'ended';
  return 'active';
}

export function formatJakartaDateTimeDisplay(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return `${JAKARTA_FORMATTER.format(date)} WIB`;
}

export function toJakartaDateTimeInputValue(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const parts = Object.fromEntries(
    JAKARTA_INPUT_PARTS.formatToParts(date).map((part) => [
      part.type,
      part.value,
    ]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function fromJakartaDateTimeInputValue(
  localInput: string,
): string | null {
  const trimmed = localInput.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return null;
  }
  const date = new Date(`${trimmed}:00${PROMOTION_JAKARTA_OFFSET}`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export interface PromotionPreviewScenario {
  unitPriceIdr: number;
  quantity: number;
  lineGrossIdr: number;
  discountIdr: number;
  netSubtotalIdr: number;
  meetsMinSpend: boolean;
  wasCapped: boolean;
  formattedSummary: string;
}

export function buildPromotionPreviewExamples(input: {
  id?: string;
  title?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountIdr: number | null;
  minSpendIdr: number;
  priority: number;
}): PromotionPreviewScenario[] {
  const scenarios = [
    { unitPriceIdr: 75_000, quantity: 1 },
    { unitPriceIdr: 150_000, quantity: 2 },
    { unitPriceIdr: 320_000, quantity: 3 },
  ];

  const hasValidValue =
    Number.isFinite(input.discountValue) && input.discountValue > 0;

  return scenarios.map(({ unitPriceIdr, quantity }) => {
    const lineGrossIdr = unitPriceIdr * quantity;
    const meetsMinSpend = lineGrossIdr >= Math.max(0, input.minSpendIdr);
    if (!hasValidValue || !meetsMinSpend) {
      return {
        unitPriceIdr,
        quantity,
        lineGrossIdr,
        discountIdr: 0,
        netSubtotalIdr: lineGrossIdr,
        meetsMinSpend,
        wasCapped: false,
        formattedSummary: meetsMinSpend
          ? `${formatIdr(lineGrossIdr)} -> ${formatIdr(lineGrossIdr)}`
          : `Belum memenuhi min. belanja ${formatIdr(input.minSpendIdr)}`,
      };
    }

    const discountIdr = calculateCandidateDiscountIdr(lineGrossIdr, quantity, {
      discountType: input.discountType,
      discountValue: input.discountValue,
      maxDiscountIdr: input.maxDiscountIdr,
    });

    const uncappedRaw =
      input.discountType === 'fixed'
        ? Math.min(lineGrossIdr, Math.round(input.discountValue) * quantity)
        : lineGrossIdr;
    const wasCapped =
      input.maxDiscountIdr !== null &&
      input.maxDiscountIdr >= 0 &&
      discountIdr === input.maxDiscountIdr &&
      (input.discountType === 'fixed'
        ? uncappedRaw > input.maxDiscountIdr
        : discountIdr > 0);
    const netSubtotalIdr = Math.max(0, lineGrossIdr - discountIdr);

    return {
      unitPriceIdr,
      quantity,
      lineGrossIdr,
      discountIdr,
      netSubtotalIdr,
      meetsMinSpend,
      wasCapped,
      formattedSummary: `${formatIdr(lineGrossIdr)} - ${formatIdr(discountIdr)} = ${formatIdr(netSubtotalIdr)}`,
    };
  });
}
