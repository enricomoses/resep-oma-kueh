import { describe, expect, it } from 'vitest';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import {
  buildWhatsappTargetUrl,
  isAllowedMapsUrl,
  isZeroStockStatusValid,
  normalizeTimeHHMM,
  normalizeWhatsappDigits,
  validateWeeklyHoursIntervals,
} from '@/utils/admin-branches';
import {
  bulkUpdateAvailabilitySchema,
  replaceBranchHoursSchema,
  updateAdminBranchSchema,
  upsertBranchAvailabilitySchema,
} from '@/validations/admin-catalog.schema';

function makeValidWeek() {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    opensAt: dayOfWeek === 0 ? null : '09:00',
    closesAt: dayOfWeek === 0 ? null : '17:00',
    isClosed: dayOfWeek === 0,
    note: null,
  }));
}

describe('admin-branches pure helpers & schemas (F18)', () => {
  it('normalizes WhatsApp digits and rejects malformed inputs', () => {
    expect(normalizeWhatsappDigits('+62 817-0338-4308')).toBe('6281703384308');
    expect(normalizeWhatsappDigits('0817 0338 4308')).toBe('6281703384308');
    expect(normalizeWhatsappDigits('0062 851 1978 5194')).toBe('6285119785194');
    expect(buildWhatsappTargetUrl('0817-0338-4308')).toBe(
      'https://wa.me/6281703384308',
    );
    expect(normalizeWhatsappDigits('12345')).toBeNull();
    expect(normalizeWhatsappDigits('abc12345678')).toBeNull();
    expect(buildWhatsappTargetUrl('+6212')).toBeNull();
  });

  it('enforces strict HTTPS Google Maps allowlist and rejects unsafe schemes', () => {
    expect(isAllowedMapsUrl('https://maps.google.com/?q=Surabaya')).toBe(true);
    expect(
      isAllowedMapsUrl('https://www.google.com/maps/place/Resep+Oma+Kueh'),
    ).toBe(true);
    expect(isAllowedMapsUrl('https://maps.app.goo.gl/abc123')).toBe(true);

    expect(isAllowedMapsUrl('http://maps.google.com/?q=Surabaya')).toBe(false);
    expect(isAllowedMapsUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedMapsUrl('https://evil.example/maps')).toBe(false);
    expect(isAllowedMapsUrl('https://www.google.com/search?q=maps')).toBe(
      false,
    );
  });

  it('validates weekly operational hours: rejects overnight, closed-with-times, incomplete, and allows unknown confirmation hours', () => {
    expect(validateWeeklyHoursIntervals(makeValidWeek())).toEqual([]);

    const unknownWeek = makeValidWeek().map((item) => ({
      ...item,
      opensAt: null,
      closesAt: null,
      isClosed: false,
    }));
    expect(validateWeeklyHoursIntervals(unknownWeek)).toEqual([]);
    expect(normalizeTimeHHMM('09:00:00')).toBe('09:00');

    const overnight = makeValidWeek();
    overnight[1] = {
      dayOfWeek: 1,
      opensAt: '22:00',
      closesAt: '02:00',
      isClosed: false,
      note: null,
    };
    const overnightResult = replaceBranchHoursSchema.safeParse({
      expectedUpdatedAt: '2026-11-12T00:00:00.000Z',
      hours: overnight,
    });
    expect(overnightResult.success).toBe(false);

    const closedWithTime = makeValidWeek();
    closedWithTime[0] = {
      dayOfWeek: 0,
      opensAt: '09:00',
      closesAt: '12:00',
      isClosed: true,
      note: null,
    };
    expect(
      validateWeeklyHoursIntervals(closedWithTime).some(
        (issue) => issue.code === 'invalid_closed_hours',
      ),
    ).toBe(true);

    const halfFilled = makeValidWeek();
    halfFilled[2] = {
      dayOfWeek: 2,
      opensAt: '09:00',
      closesAt: null,
      isClosed: false,
      note: null,
    };
    expect(
      validateWeeklyHoursIntervals(halfFilled).some(
        (issue) => issue.code === 'incomplete_hours',
      ),
    ).toBe(true);
  });

  it('rejects immutable fields on branch PATCH and zero-stock available contradictions on offers', () => {
    const branchWithCode = updateAdminBranchSchema.safeParse({
      expectedUpdatedAt: '2026-11-12T00:00:00.000Z',
      code: 'hacked',
      name: 'Cabang Surabaya',
      city: 'Surabaya',
      address: 'Rungkut Asri Tengah V No. 22, Surabaya',
      mapsUrl: null,
      whatsappNumber: '6281703384308',
      description: null,
      allowPickup: false,
      allowDelivery: false,
      sortOrder: 1,
    });
    expect(branchWithCode.success).toBe(false);

    expect(isZeroStockStatusValid(null, 'available')).toBe(true);
    expect(isZeroStockStatusValid(0, 'sold_out')).toBe(true);
    expect(isZeroStockStatusValid(0, 'available')).toBe(false);

    const contradiction = upsertBranchAvailabilitySchema.safeParse({
      expectedOfferUpdatedAt: null,
      isListed: true,
      availabilityStatus: 'available',
      stockQuantity: 0,
    });
    expect(contradiction.success).toBe(false);
    if (!contradiction.success) {
      expect(contradiction.error.issues[0]?.message).toBe(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.ZERO_STOCK_CONTRADICTION,
      );
    }

    const bulkTooMany = bulkUpdateAvailabilitySchema.safeParse({
      items: [],
    });
    expect(bulkTooMany.success).toBe(false);
  });
});
