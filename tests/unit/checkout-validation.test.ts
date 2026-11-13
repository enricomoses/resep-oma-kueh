import { describe, expect, it } from 'vitest';
import { CHECKOUT_COPY, CHECKOUT_LIMITS } from '@/constants/checkout.constant';
import type {
  CheckoutFulfillmentInput,
  CheckoutItemInput,
  CheckoutWarning,
} from '@/types/checkout';
import {
  buildWhatsAppUrl,
  composeWhatsAppMessage,
  formatJakartaDateIso,
  formatJakartaDateLong,
  formatWhatsappDigits,
  isValidJakartaDate,
  sanitizeUserInput,
} from '@/utils/checkout';
import {
  checkoutFulfillmentInputSchema,
  checkoutItemInputSchema,
  checkoutPrepareRequestSchema,
} from '@/validations/checkout.schema';

describe('Checkout Validation & Utils Unit Tests', () => {
  describe('Jakarta Calendar Date Validation (PRD §27.3)', () => {
    // Reference base time: 2026-11-13 12:00:00 UTC (19:00:00 Asia/Jakarta)
    const baseDate = new Date('2026-11-13T12:00:00Z');

    it('accepts today in Asia/Jakarta', () => {
      const todayIso = formatJakartaDateIso(baseDate);
      expect(isValidJakartaDate(todayIso, baseDate)).toBe(true);
    });

    it('accepts date within 90 days in Asia/Jakarta', () => {
      expect(isValidJakartaDate('2026-11-20', baseDate)).toBe(true);
      expect(isValidJakartaDate('2026-12-25', baseDate)).toBe(true);
      expect(isValidJakartaDate('2027-01-10', baseDate)).toBe(true);
    });

    it('rejects past dates', () => {
      expect(isValidJakartaDate('2026-11-12', baseDate)).toBe(false);
      expect(isValidJakartaDate('2026-10-01', baseDate)).toBe(false);
      expect(isValidJakartaDate('2025-11-13', baseDate)).toBe(false);
    });

    it('rejects dates beyond 90 days limit', () => {
      // 90 days after Nov 13, 2026 is approx Feb 11, 2027
      expect(isValidJakartaDate('2027-03-01', baseDate)).toBe(false);
      expect(isValidJakartaDate('2027-11-13', baseDate)).toBe(false);
    });

    it('rejects invalid calendar dates (non-leap Feb 29, Feb 31, Apr 31)', () => {
      expect(isValidJakartaDate('2027-02-29', baseDate)).toBe(false); // 2027 is non-leap
      expect(isValidJakartaDate('2027-02-30', baseDate)).toBe(false);
      expect(isValidJakartaDate('2027-02-31', baseDate)).toBe(false);
      expect(isValidJakartaDate('2027-04-31', baseDate)).toBe(false); // April has 30 days
    });

    it('rejects malformed date strings', () => {
      expect(isValidJakartaDate('13-11-2026', baseDate)).toBe(false);
      expect(isValidJakartaDate('2026/11/13', baseDate)).toBe(false);
      expect(isValidJakartaDate('invalid-date', baseDate)).toBe(false);
      expect(isValidJakartaDate('', baseDate)).toBe(false);
    });

    it('formats date into long Indonesian date string', () => {
      expect(formatJakartaDateLong('2026-11-13')).toBe('13 November 2026');
      expect(formatJakartaDateLong('2026-01-01')).toBe('1 Januari 2026');
      expect(formatJakartaDateLong('invalid')).toBe('invalid');
    });
  });

  describe('Input Sanitization & Markup Stripping (PRD §8.3)', () => {
    it('strips control characters and WhatsApp formatting markup', () => {
      const raw =
        'Halo \x00\x1F*Admin* _Oma_ ~Promo~ `Kode` <script>alert(1)</script>';
      const sanitized = sanitizeUserInput(raw);
      expect(sanitized).toBe('Halo Admin Oma Promo Kode scriptalert(1)/script');
    });

    it('handles empty or nullish values gracefully', () => {
      expect(sanitizeUserInput('')).toBe('');
      expect(sanitizeUserInput(null)).toBe('');
      expect(sanitizeUserInput(undefined)).toBe('');
    });
  });

  describe('WhatsApp Phone Number Formatting', () => {
    it('formats numbers with +62, leading zero, or raw international digits', () => {
      expect(formatWhatsappDigits('+62 817-0338-4308')).toBe('6281703384308');
      expect(formatWhatsappDigits('081703384308')).toBe('6281703384308');
      expect(formatWhatsappDigits('6285119785194')).toBe('6285119785194');
    });
  });

  describe('WhatsApp Message Composition (PRD §8.3)', () => {
    it('composes exact multiline message with bundle breakdown and fulfillment details', () => {
      const message = composeWhatsAppMessage({
        branchName: 'Surabaya',
        lines: [
          {
            productName: 'Paket Chiffon Slice Mix',
            variantName: '12 Potong',
            sizeLabel: '12 Potong',
            quantity: 1,
            unitPriceIdr: 160_000,
            lineTotalIdr: 160_000,
            bundleBreakdown: [
              {
                slotOrGroup: 'cheese',
                label: 'Keju (Cheese)',
                quantity: 3,
                priceDeltaIdr: 0,
                isFixed: true,
              },
              {
                slotOrGroup: 'choco',
                label: 'Cokelat (Choco)',
                quantity: 3,
                priceDeltaIdr: 0,
                isFixed: true,
              },
              {
                slotOrGroup: 'Pilihan Rasa 1',
                label: 'Pandan',
                quantity: 3,
                priceDeltaIdr: 5_000,
                isFixed: false,
              },
              {
                slotOrGroup: 'Pilihan Rasa 2',
                label: 'Earl Grey',
                quantity: 3,
                priceDeltaIdr: 5_000,
                isFixed: false,
              },
            ],
          },
        ],
        subtotalIdr: 160_000,
        discountIdr: 0,
        estimatedTotalIdr: 160_000,
        customerName: 'Budi Santoso',
        fulfillmentMethod: 'delivery',
        requestedDate: '2026-11-20',
        requestedTimeWindow: 'Siang (12:00 - 15:00)',
        deliveryAddress: 'Jl. Rungkut Asri Timur No. 12, Surabaya',
        note: 'Tolong jangan dibanting',
      });

      expect(message).toContain(CHECKOUT_COPY.GREETING);
      expect(message).toContain('*CABANG:* Surabaya');
      expect(message).toContain('*DETAIL PESANAN:*');
      expect(message).toContain('1. Paket Chiffon Slice Mix — 12 Potong');
      expect(message).toContain('1 × Rp160.000 = Rp160.000');
      expect(message).toContain('• Keju (Cheese) (3 potong) [Termasuk]');
      expect(message).toContain('• Cokelat (Choco) (3 potong) [Termasuk]');
      expect(message).toContain('• Pandan (3 potong) (+Rp5.000)');
      expect(message).toContain('• Earl Grey (3 potong) (+Rp5.000)');
      expect(message).toContain('Subtotal: Rp160.000');
      expect(message).toContain('Diskon: Rp0');
      expect(message).toContain('*ESTIMASI TOTAL: Rp160.000*');
      expect(message).toContain(
        `Ongkir: ${CHECKOUT_COPY.SHIPPING_PENDING_LABEL}`,
      );
      expect(message).toContain('*PEMESAN:* Budi Santoso');
      expect(message).toContain('*METODE:* Delivery');
      expect(message).toContain(
        '*TANGGAL:* 20 November 2026 (Siang (12:00 - 15:00))',
      );
      expect(message).toContain(
        '*ALAMAT:* Jl. Rungkut Asri Timur No. 12, Surabaya',
      );
      expect(message).toContain('*CATATAN:* Tolong jangan dibanting');
      expect(message).toContain(CHECKOUT_COPY.CLOSING);
    });

    it('formats pickup method without address', () => {
      const message = composeWhatsAppMessage({
        branchName: 'Bintaro',
        lines: [
          {
            productName: 'Chiffon Pandan Asli',
            variantName: 'Medium 18cm',
            quantity: 2,
            unitPriceIdr: 85_000,
            lineTotalIdr: 170_000,
          },
        ],
        subtotalIdr: 170_000,
        discountIdr: 0,
        estimatedTotalIdr: 170_000,
        customerName: 'Siti',
        fulfillmentMethod: 'pickup',
        requestedDate: '2026-11-25',
      });

      expect(message).toContain('*METODE:* Pickup');
      expect(message).not.toContain('*ALAMAT:*');
    });
  });

  describe('WhatsApp URL Generation & Fallback (PRD §27.3)', () => {
    it('generates direct prefilled wa.me URL when under 4000 characters', () => {
      const { whatsappUrl, requiresCopy } = buildWhatsAppUrl(
        '6281703384308',
        'Short message test',
      );

      expect(requiresCopy).toBe(false);
      expect(whatsappUrl).toBe(
        'https://wa.me/6281703384308?text=Short%20message%20test',
      );
    });

    it('falls back to bare wa.me URL and requiresCopy=true when exceeding 4000 characters', () => {
      const longMessage = 'A'.repeat(4100);
      const { whatsappUrl, requiresCopy } = buildWhatsAppUrl(
        '6281703384308',
        longMessage,
      );

      expect(requiresCopy).toBe(true);
      expect(whatsappUrl).toBe('https://wa.me/6281703384308');
    });
  });

  describe('Zod Schema Validation Rules', () => {
    const validBranchId = 'f0400000-0000-4000-8000-000000000001';
    const validVariantId = 'f0400000-0000-4000-8000-000000000600';

    it('enforces address requirement for delivery method', () => {
      // Valid delivery with address >= 5 chars
      const validDelivery: CheckoutFulfillmentInput = {
        method: 'delivery',
        requestedDate: formatJakartaDateIso(),
        address: 'Jl. Ahmad Yani No. 10',
      };
      expect(
        checkoutFulfillmentInputSchema.safeParse(validDelivery).success,
      ).toBe(true);

      // Invalid delivery without address
      const invalidDelivery = {
        method: 'delivery',
        requestedDate: formatJakartaDateIso(),
        address: '',
      };
      const result = checkoutFulfillmentInputSchema.safeParse(invalidDelivery);
      expect(result.success).toBe(false);
    });

    it('allows pickup without delivery address', () => {
      const validPickup: CheckoutFulfillmentInput = {
        method: 'pickup',
        requestedDate: formatJakartaDateIso(),
      };
      expect(
        checkoutFulfillmentInputSchema.safeParse(validPickup).success,
      ).toBe(true);
    });

    it('enforces line quantity boundaries (1 to 99)', () => {
      const item: CheckoutItemInput = {
        variantId: validVariantId,
        quantity: 1,
        choiceIds: [],
      };
      expect(checkoutItemInputSchema.safeParse(item).success).toBe(true);

      expect(
        checkoutItemInputSchema.safeParse({
          variantId: validVariantId,
          quantity: 99,
        }).success,
      ).toBe(true);

      expect(
        checkoutItemInputSchema.safeParse({
          variantId: validVariantId,
          quantity: 0,
        }).success,
      ).toBe(false);

      expect(
        checkoutItemInputSchema.safeParse({
          variantId: validVariantId,
          quantity: 100,
        }).success,
      ).toBe(false);
    });

    it('verifies checkout warning structure', () => {
      const warning: CheckoutWarning = {
        code: 'MANUAL_CONFIRMATION_REQUIRED',
        message: 'Info',
      };
      expect(warning.code).toBe('MANUAL_CONFIRMATION_REQUIRED');
    });

    it('enforces max 15 distinct lines in prepare request', () => {
      const items = Array.from(
        { length: CHECKOUT_LIMITS.MAX_DISTINCT_LINES + 1 },
        () => ({
          variantId: validVariantId,
          quantity: 1,
        }),
      );

      const invalidPayload = {
        branchId: validBranchId,
        items,
        fulfillment: {
          method: 'pickup',
          requestedDate: formatJakartaDateIso(),
        },
        customerName: 'Budi',
        acknowledgedManualConfirmation: true,
      };

      expect(
        checkoutPrepareRequestSchema.safeParse(invalidPayload).success,
      ).toBe(false);
    });

    it('requires acknowledgedManualConfirmation to be true', () => {
      const payload = {
        branchId: validBranchId,
        items: [{ variantId: validVariantId, quantity: 1 }],
        fulfillment: {
          method: 'pickup',
          requestedDate: formatJakartaDateIso(),
        },
        customerName: 'Budi',
        acknowledgedManualConfirmation: false,
      };

      expect(checkoutPrepareRequestSchema.safeParse(payload).success).toBe(
        false,
      );
    });
  });
});
