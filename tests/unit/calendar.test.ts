import { describe, expect, it } from 'vitest';

import {
  formatDisplayDate,
  getCalendarGrid,
  getDaysInMonth,
  isIsoDateWithinBounds,
  isLeapYear,
  parseIsoDateParts,
} from '@/utils/calendar';

describe('calendar utilities', () => {
  it('computes leap years and exact days per month accurately', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2026)).toBe(false);

    // February: 28 days in non-leap year, 29 days in leap year
    expect(getDaysInMonth(2026, 1)).toBe(28);
    expect(getDaysInMonth(2024, 1)).toBe(29);
    expect(getDaysInMonth(1900, 1)).toBe(28);
    expect(getDaysInMonth(2000, 1)).toBe(29);

    // 30-day & 31-day months
    expect(getDaysInMonth(2026, 3)).toBe(30); // April
    expect(getDaysInMonth(2026, 0)).toBe(31); // January
  });

  it('validates ISO date parts including Feb 29 leap year edge case', () => {
    expect(parseIsoDateParts('2026-02-29')).toBeNull();
    expect(parseIsoDateParts('2026-04-31')).toBeNull();
    expect(parseIsoDateParts('2024-02-29')).toEqual({
      year: 2024,
      monthIndex: 1,
      day: 29,
      hour: '00',
      minute: '00',
    });
    expect(parseIsoDateParts('2026-11-16T14:30')).toEqual({
      year: 2026,
      monthIndex: 10,
      day: 16,
      hour: '14',
      minute: '30',
    });
  });

  it('builds Monday-first calendar grid and checks min/max bounds', () => {
    const feb2026 = getCalendarGrid(2026, 1);
    const days = feb2026.filter((d): d is number => d !== null);
    expect(days).toHaveLength(28);
    expect(days[0]).toBe(1);
    expect(days[days.length - 1]).toBe(28);

    const feb2024 = getCalendarGrid(2024, 1);
    expect(feb2024.filter((d) => d !== null)).toHaveLength(29);

    expect(
      isIsoDateWithinBounds('2026-11-16', '2026-11-16', '2026-11-30'),
    ).toBe(true);
    expect(
      isIsoDateWithinBounds('2026-11-15', '2026-11-16', '2026-11-30'),
    ).toBe(false);
    expect(
      isIsoDateWithinBounds('2026-12-01', '2026-11-16', '2026-11-30'),
    ).toBe(false);
  });

  it('formats display dates and datetimes cleanly', () => {
    expect(formatDisplayDate('2026-11-16', false)).toBe('16 Nov 2026');
    expect(formatDisplayDate('2026-11-16T09:30', true)).toBe(
      '16 Nov 2026, 09:30',
    );
    expect(formatDisplayDate('2026-02-29', false)).toBe('');
  });
});
