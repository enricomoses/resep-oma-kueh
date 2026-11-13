import { describe, expect, it } from 'vitest';

import {
  buildAskNextClassWhatsAppUrl,
  composeClassRegistrationWhatsAppPayload,
  computeEffectiveClassPriceIdr,
  evaluateClassSessionAvailability,
  formatClassAgeRange,
  formatClassScheduleJakarta,
  sortClassSessionsAscending,
} from '@/utils/classes';
import {
  createAdminClassProgramInputSchema,
  prepareClassRegistrationRequestSchema,
} from '@/validations/classes.schema';

const SESSION_ID = 'f2100000-0000-4000-8000-000000000001';
const BASE_START = '2027-06-15T03:00:00.000Z'; // 10:00 WIB
const BASE_END = '2027-06-15T04:30:00.000Z'; // 11:30 WIB
const BASE_DEADLINE = '2027-06-14T10:00:00.000Z'; // 17:00 WIB

function buildAvailabilityInput(
  overrides: Partial<
    Parameters<typeof evaluateClassSessionAvailability>[0]
  > = {},
) {
  return {
    startsAt: BASE_START,
    endsAt: BASE_END,
    registrationDeadlineAt: BASE_DEADLINE,
    capacity: 12,
    seatsLeft: 4,
    status: 'scheduled' as const,
    isRegistrationOpen: true,
    branchIsActive: true,
    programIsPublic: true,
    ...overrides,
  };
}

describe('classes utilities and schemas', () => {
  it('computes effective price override vs base price', () => {
    expect(computeEffectiveClassPriceIdr(185_000, null)).toBe(185_000);
    expect(computeEffectiveClassPriceIdr(185_000, undefined)).toBe(185_000);
    expect(computeEffectiveClassPriceIdr(185_000, 210_000)).toBe(210_000);
  });

  it('formats age range variations and Jakarta schedule window', () => {
    expect(formatClassAgeRange(4, 12)).toBe('Usia 4–12 tahun');
    expect(formatClassAgeRange(7, 7)).toBe('Usia 7 tahun');
    expect(formatClassAgeRange(5, null)).toBe('Minimal usia 5 tahun');
    expect(formatClassAgeRange(null, 10)).toBe('Hingga usia 10 tahun');
    expect(formatClassAgeRange(null, null)).toBeNull();

    const formatted = formatClassScheduleJakarta(BASE_START, BASE_END);
    expect(formatted).toContain('WIB');
    expect(formatted).toMatch(/10[.:]00/);
    expect(formatted).toMatch(/11[.:]30/);
  });

  it('evaluates exact deadline, start, full, zero/null seats, and cancelled boundaries with fixed clock', () => {
    const startMs = Date.parse(BASE_START);
    const deadlineMs = Date.parse(BASE_DEADLINE);

    // At exact deadline timestamp: still registerable
    expect(
      evaluateClassSessionAvailability(buildAvailabilityInput(), deadlineMs)
        .isRegisterable,
    ).toBe(true);

    // 1 ms past deadline: blocked with DEADLINE_PASSED
    const pastDeadline = evaluateClassSessionAvailability(
      buildAvailabilityInput(),
      deadlineMs + 1,
    );
    expect(pastDeadline.isRegisterable).toBe(false);
    expect(pastDeadline.unavailableReason).toBe('DEADLINE_PASSED');

    // At exact startsAt: SESSION_ENDED
    const atStart = evaluateClassSessionAvailability(
      buildAvailabilityInput(),
      startMs,
    );
    expect(atStart.isRegisterable).toBe(false);
    expect(atStart.isPast).toBe(true);
    expect(atStart.unavailableReason).toBe('SESSION_ENDED');

    // Unknown seats (null) stays registerable when scheduled & open
    const unknownSeats = evaluateClassSessionAvailability(
      buildAvailabilityInput({ seatsLeft: null }),
      deadlineMs - 10_000,
    );
    expect(unknownSeats.isRegisterable).toBe(true);

    // Zero seatsLeft blocks registration even if status was left 'scheduled'
    const zeroSeats = evaluateClassSessionAvailability(
      buildAvailabilityInput({ seatsLeft: 0 }),
      deadlineMs - 10_000,
    );
    expect(zeroSeats.isRegisterable).toBe(false);
    expect(zeroSeats.unavailableReason).toBe('SESSION_FULL');

    // Cancelled status & closed registration
    const cancelled = evaluateClassSessionAvailability(
      buildAvailabilityInput({ status: 'cancelled' }),
      deadlineMs - 10_000,
    );
    expect(cancelled.isRegisterable).toBe(false);
    expect(cancelled.unavailableReason).toBe('SESSION_CANCELLED');

    const closed = evaluateClassSessionAvailability(
      buildAvailabilityInput({ isRegistrationOpen: false }),
      deadlineMs - 10_000,
    );
    expect(closed.isRegisterable).toBe(false);
    expect(closed.unavailableReason).toBe('REGISTRATION_CLOSED');

    const inactiveBranch = evaluateClassSessionAvailability(
      buildAvailabilityInput({ branchIsActive: false }),
      deadlineMs - 10_000,
    );
    expect(inactiveBranch.isRegisterable).toBe(false);
    expect(inactiveBranch.unavailableReason).toBe('BRANCH_INACTIVE');
  });

  it('sorts upcoming sessions stably by start timestamp ascending then UUID', () => {
    const sorted = sortClassSessionsAscending([
      { id: 'b', startsAt: '2027-06-16T03:00:00.000Z' },
      { id: 'z', startsAt: '2027-06-15T03:00:00.000Z' },
      { id: 'a', startsAt: '2027-06-15T03:00:00.000Z' },
    ]);
    expect(sorted.map((s) => `${s.startsAt}:${s.id}`)).toEqual([
      '2027-06-15T03:00:00.000Z:a',
      '2027-06-15T03:00:00.000Z:z',
      '2027-06-16T03:00:00.000Z:b',
    ]);
  });

  it('composes clean WhatsApp registration payload, sanitizes adult name, and flags long URLs for copy', () => {
    const payload = composeClassRegistrationWhatsAppPayload('0817-0338-4308', {
      sessionId: SESSION_ID,
      programTitle: 'Little Baker Chiffon Class',
      branchName: 'Surabaya',
      startsAt: BASE_START,
      endsAt: BASE_END,
      attendeeCount: 2,
      unitPriceIdr: 185_000,
      estimatedTotalIdr: 370_000,
      capacity: 12,
      seatsLeft: null,
      ageRangeLabel: 'Usia 4–12 tahun',
      adultContactName: 'Ibu\u200B Sari\n\r\tWijaya',
    });

    expect(
      payload.whatsappUrl.startsWith('https://wa.me/6281703384308?text='),
    ).toBe(true);
    expect(payload.whatsappMessage).toContain('Little Baker Chiffon Class');
    expect(payload.whatsappMessage).toContain('Surabaya');
    expect(payload.whatsappMessage).toContain('2 orang');
    expect(payload.whatsappMessage).toContain('370.000');
    expect(payload.whatsappMessage).toContain('Ibu Sari Wijaya');
    expect(payload.whatsappMessage).not.toContain('\u200B');
    expect(payload.requiresCopy).toBe(false);

    const longPayload = composeClassRegistrationWhatsAppPayload(
      '6281703384308',
      {
        sessionId: SESSION_ID,
        programTitle: 'Little Baker Chiffon Class',
        branchName: 'Surabaya',
        startsAt: BASE_START,
        endsAt: BASE_END,
        attendeeCount: 2,
        unitPriceIdr: 185_000,
        estimatedTotalIdr: 370_000,
        capacity: 12,
        seatsLeft: 5,
        ageRangeLabel: null,
        adultContactName: 'Bapak Budi',
      },
      120,
    );
    expect(longPayload.requiresCopy).toBe(true);

    const inquiryUrl = buildAskNextClassWhatsAppUrl(
      '6285119785194',
      'Bintaro',
      'Klappertaart Kids Session',
    );
    expect(inquiryUrl.startsWith('https://wa.me/6285119785194?text=')).toBe(
      true,
    );
    expect(decodeURIComponent(inquiryUrl)).toContain(
      'Klappertaart Kids Session',
    );
  });

  it('rejects strict extra child identity fields and unsafe HTML or invalid age bounds', () => {
    const withExtraField = prepareClassRegistrationRequestSchema.safeParse({
      sessionId: SESSION_ID,
      attendeeCount: 1,
      adultContactName: 'Ibu Rina',
      childName: 'Ani',
    });
    expect(withExtraField.success).toBe(false);

    const withScript = prepareClassRegistrationRequestSchema.safeParse({
      sessionId: SESSION_ID,
      attendeeCount: 1,
      adultContactName: '<script>alert(1)</script>',
    });
    expect(withScript.success).toBe(false);

    const invalidAgeRange = createAdminClassProgramInputSchema.safeParse({
      title: 'Kelas Kue Anak',
      slug: 'kelas-kue-anak',
      basePriceIdr: 150_000,
      ageMin: 12,
      ageMax: 4,
    });
    expect(invalidAgeRange.success).toBe(false);
  });
});
