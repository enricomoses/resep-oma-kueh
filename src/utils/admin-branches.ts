const WHATSAPP_DIGITS_REGEX = /^[1-9][0-9]{7,14}$/;
const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

const ALLOWED_GOOGLE_MAPS_DOMAINS = new Set([
  'maps.google.com',
  'maps.app.goo.gl',
]);

const ALLOWED_GOOGLE_PATH_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'google.co.id',
  'www.google.co.id',
]);

export function normalizeWhatsappDigits(raw: string): string | null {
  const stripped = raw.trim().replace(/[\s().-]+/g, '');
  if (!stripped) {
    return null;
  }

  let digits = stripped.startsWith('+') ? stripped.slice(1) : stripped;
  if (!/^[0-9]+$/.test(digits)) {
    return null;
  }

  if (digits.startsWith('00') && digits.length > 2) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length > 1) {
    digits = `62${digits.slice(1)}`;
  }

  return WHATSAPP_DIGITS_REGEX.test(digits) ? digits : null;
}

export function buildWhatsappTargetUrl(rawDigits: string): string | null {
  const normalized = normalizeWhatsappDigits(rawDigits);
  return normalized ? `https://wa.me/${normalized}` : null;
}

export function isAllowedMapsUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2000) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    if (parsed.username || parsed.password) {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    if (ALLOWED_GOOGLE_MAPS_DOMAINS.has(host)) {
      return true;
    }
    if (ALLOWED_GOOGLE_PATH_HOSTS.has(host)) {
      return path === '/maps' || path.startsWith('/maps/');
    }
    if (host === 'goo.gl') {
      return path.startsWith('/maps/');
    }
    return false;
  } catch {
    return false;
  }
}

export function normalizeTimeHHMM(
  raw: string | null | undefined,
): string | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const match = TIME_24H_REGEX.exec(trimmed);
  if (!match) {
    return null;
  }
  return `${match[1]}:${match[2]}`;
}

function toMinutesOfDay(hhmm: string): number {
  const [hoursText, minutesText] = hhmm.split(':');
  return Number(hoursText) * 60 + Number(minutesText);
}

export interface WeeklyHourIntervalInput {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
  note?: string | null;
}

type WeeklyHourValidationIssueCode =
  | 'duplicate_day'
  | 'missing_days'
  | 'invalid_closed_hours'
  | 'incomplete_hours'
  | 'invalid_time_format'
  | 'invalid_overnight_range';

export interface WeeklyHourValidationIssue {
  dayOfWeek: number | null;
  code: WeeklyHourValidationIssueCode;
}

export function validateWeeklyHoursIntervals(
  hours: readonly WeeklyHourIntervalInput[],
): WeeklyHourValidationIssue[] {
  const issues: WeeklyHourValidationIssue[] = [];
  const seenDays = new Set<number>();

  for (const item of hours) {
    if (
      !Number.isInteger(item.dayOfWeek) ||
      item.dayOfWeek < 0 ||
      item.dayOfWeek > 6
    ) {
      issues.push({ dayOfWeek: item.dayOfWeek, code: 'missing_days' });
      continue;
    }

    if (seenDays.has(item.dayOfWeek)) {
      issues.push({ dayOfWeek: item.dayOfWeek, code: 'duplicate_day' });
    }
    seenDays.add(item.dayOfWeek);

    const opensRaw = item.opensAt?.trim() ?? '';
    const closesRaw = item.closesAt?.trim() ?? '';
    const opens = normalizeTimeHHMM(opensRaw);
    const closes = normalizeTimeHHMM(closesRaw);

    if ((opensRaw && !opens) || (closesRaw && !closes)) {
      issues.push({ dayOfWeek: item.dayOfWeek, code: 'invalid_time_format' });
      continue;
    }

    if (item.isClosed) {
      if (opens !== null || closes !== null) {
        issues.push({
          dayOfWeek: item.dayOfWeek,
          code: 'invalid_closed_hours',
        });
      }
      continue;
    }

    if ((opens === null) !== (closes === null)) {
      issues.push({ dayOfWeek: item.dayOfWeek, code: 'incomplete_hours' });
      continue;
    }

    if (opens !== null && closes !== null) {
      if (toMinutesOfDay(closes) <= toMinutesOfDay(opens)) {
        issues.push({
          dayOfWeek: item.dayOfWeek,
          code: 'invalid_overnight_range',
        });
      }
    }
  }

  for (let day = 0; day < 7; day += 1) {
    if (!seenDays.has(day)) {
      issues.push({ dayOfWeek: day, code: 'missing_days' });
    }
  }

  return issues;
}

export function isZeroStockStatusValid(
  stockQuantity: number | null,
  availabilityStatus: 'available' | 'sold_out' | 'unconfirmed',
): boolean {
  return (
    stockQuantity === null ||
    stockQuantity > 0 ||
    availabilityStatus === 'sold_out'
  );
}
