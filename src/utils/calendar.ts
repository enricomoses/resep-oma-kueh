export const CALENDAR_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

const CALENDAR_MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

export const CALENDAR_WEEKDAYS = [
  'Sen',
  'Sel',
  'Rab',
  'Kam',
  'Jum',
  'Sab',
  'Min',
] as const;

export interface ParsedDateParts {
  year: number;
  monthIndex: number;
  day: number;
  hour: string;
  minute: string;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  if (monthIndex === 1) {
    return isLeapYear(year) ? 29 : 28;
  }
  if (
    monthIndex === 3 ||
    monthIndex === 5 ||
    monthIndex === 8 ||
    monthIndex === 10
  ) {
    return 30;
  }
  return 31;
}

export function padTwo(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatIsoDate(
  year: number,
  monthIndex: number,
  day: number,
): string {
  return `${String(year).padStart(4, '0')}-${padTwo(monthIndex + 1)}-${padTwo(day)}`;
}

export function formatIsoDateTime(
  year: number,
  monthIndex: number,
  day: number,
  hour: string,
  minute: string,
): string {
  return `${formatIsoDate(year, monthIndex, day)}T${hour}:${minute}`;
}

export function parseIsoDateParts(value: string): ParsedDateParts | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(trimmed);
  if (!match) return null;

  const year = Number.parseInt(match[1] ?? '', 10);
  const month = Number.parseInt(match[2] ?? '', 10);
  const day = Number.parseInt(match[3] ?? '', 10);
  const hour = match[4] ?? '00';
  const minute = match[5] ?? '00';

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const monthIndex = month - 1;
  const maxDay = getDaysInMonth(year, monthIndex);
  if (day < 1 || day > maxDay) {
    return null;
  }

  const hourNum = Number.parseInt(hour, 10);
  const minuteNum = Number.parseInt(minute, 10);
  if (hourNum < 0 || hourNum > 23 || minuteNum < 0 || minuteNum > 59) {
    return null;
  }

  return {
    year,
    monthIndex,
    day,
    hour,
    minute,
  };
}

export function getCalendarGrid(
  year: number,
  monthIndex: number,
): (number | null)[] {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  // Convert Sunday=0..Saturday=6 into Monday-first index (0..6)
  const leadingEmpty = (firstDay + 6) % 7;
  const totalDays = getDaysInMonth(year, monthIndex);

  const cells: (number | null)[] = Array.from(
    { length: leadingEmpty },
    () => null,
  );
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(day);
  }
  return cells;
}

export function isIsoDateWithinBounds(
  isoDate: string,
  minDate?: string,
  maxDate?: string,
): boolean {
  if (minDate && isoDate < minDate) return false;
  if (maxDate && isoDate > maxDate) return false;
  return true;
}

export function formatDisplayDate(value: string, includeTime: boolean): string {
  const parsed = parseIsoDateParts(value);
  if (!parsed) return '';

  const monthLabel = CALENDAR_MONTH_SHORT[parsed.monthIndex] ?? '';
  const datePart = `${parsed.day} ${monthLabel} ${parsed.year}`;
  if (!includeTime) return datePart;
  return `${datePart}, ${parsed.hour}:${parsed.minute}`;
}
