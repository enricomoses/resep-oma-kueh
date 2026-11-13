import { describe, expect, it } from 'vitest';
import {
  generateQuoteFingerprint,
  type FingerprintLineInput,
} from '@/features/checkout/fingerprint.server';

const BRANCH_SURABAYA = 'f0400000-0000-4000-8000-000000000001';
const BRANCH_BINTARO = 'f0400000-0000-4000-8000-000000000002';
const WA_SURABAYA = '6281703384308';
const WA_BINTARO = '6285119785194';

const LINE_CHIFFON: FingerprintLineInput = {
  variantId: 'f0400000-0000-4000-8000-000000000600',
  sku: 'DEMO-PANDAN-MED',
  quantity: 2,
  unitGrossIdr: 85_000,
  unitPriceIdr: 85_000,
  discountIdr: 0,
  lineTotalIdr: 170_000,
  options: [],
  appliedPromotionId: null,
};

const LINE_BUNDLE: FingerprintLineInput = {
  variantId: 'f0400000-0000-4000-8000-000000000602',
  sku: 'DEMO-BUNDLE-12',
  quantity: 1,
  unitGrossIdr: 160_000,
  unitPriceIdr: 160_000,
  discountIdr: 0,
  lineTotalIdr: 160_000,
  options: [
    {
      choiceId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      priceDeltaIdr: 5_000,
    },
    {
      choiceId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      priceDeltaIdr: 5_000,
    },
  ],
  appliedPromotionId: null,
};

describe('Checkout Quote Fingerprint Unit Tests (PRD §27.3)', () => {
  it('generates a 64-character hex SHA-256 fingerprint', () => {
    const fingerprint = generateQuoteFingerprint({
      branchId: BRANCH_SURABAYA,
      whatsappNumber: WA_SURABAYA,
      lines: [LINE_CHIFFON],
      subtotalIdr: 170_000,
      discountIdr: 0,
      estimatedTotalIdr: 170_000,
    });

    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is strictly deterministic regardless of line ordering in input', () => {
    const fp1 = generateQuoteFingerprint({
      branchId: BRANCH_SURABAYA,
      whatsappNumber: WA_SURABAYA,
      lines: [LINE_CHIFFON, LINE_BUNDLE],
      subtotalIdr: 330_000,
      discountIdr: 0,
      estimatedTotalIdr: 330_000,
    });

    const fp2 = generateQuoteFingerprint({
      branchId: BRANCH_SURABAYA,
      whatsappNumber: WA_SURABAYA,
      lines: [LINE_BUNDLE, LINE_CHIFFON],
      subtotalIdr: 330_000,
      discountIdr: 0,
      estimatedTotalIdr: 330_000,
    });

    expect(fp1).toBe(fp2);
  });

  it('is strictly deterministic regardless of option choice ordering within a line', () => {
    const lineWithOptions1: FingerprintLineInput = {
      ...LINE_BUNDLE,
      options: [
        {
          choiceId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          priceDeltaIdr: 5_000,
        },
        {
          choiceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          priceDeltaIdr: 0,
        },
      ],
    };

    const lineWithOptions2: FingerprintLineInput = {
      ...LINE_BUNDLE,
      options: [
        {
          choiceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          priceDeltaIdr: 0,
        },
        {
          choiceId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          priceDeltaIdr: 5_000,
        },
      ],
    };

    const fp1 = generateQuoteFingerprint({
      branchId: BRANCH_SURABAYA,
      whatsappNumber: WA_SURABAYA,
      lines: [lineWithOptions1],
      subtotalIdr: 165_000,
      discountIdr: 0,
      estimatedTotalIdr: 165_000,
    });

    const fp2 = generateQuoteFingerprint({
      branchId: BRANCH_SURABAYA,
      whatsappNumber: WA_SURABAYA,
      lines: [lineWithOptions2],
      subtotalIdr: 165_000,
      discountIdr: 0,
      estimatedTotalIdr: 165_000,
    });

    expect(fp1).toBe(fp2);
  });

  it('changes fingerprint when branch changes', () => {
    const fp1 = generateQuoteFingerprint({
      branchId: BRANCH_SURABAYA,
      whatsappNumber: WA_SURABAYA,
      lines: [LINE_CHIFFON],
      subtotalIdr: 170_000,
      discountIdr: 0,
      estimatedTotalIdr: 170_000,
    });

    const fp2 = generateQuoteFingerprint({
      branchId: BRANCH_BINTARO,
      whatsappNumber: WA_BINTARO,
      lines: [LINE_CHIFFON],
      subtotalIdr: 170_000,
      discountIdr: 0,
      estimatedTotalIdr: 170_000,
    });

    expect(fp1).not.toBe(fp2);
  });

  it('changes fingerprint when quantity changes', () => {
    const fp1 = generateQuoteFingerprint({
      branchId: BRANCH_SURABAYA,
      whatsappNumber: WA_SURABAYA,
      lines: [LINE_CHIFFON],
      subtotalIdr: 170_000,
      discountIdr: 0,
      estimatedTotalIdr: 170_000,
    });

    const fp2 = generateQuoteFingerprint({
      branchId: BRANCH_SURABAYA,
      whatsappNumber: WA_SURABAYA,
      lines: [{ ...LINE_CHIFFON, quantity: 3, lineTotalIdr: 255_000 }],
      subtotalIdr: 255_000,
      discountIdr: 0,
      estimatedTotalIdr: 255_000,
    });

    expect(fp1).not.toBe(fp2);
  });

  it('changes fingerprint when price delta or price changes', () => {
    const fp1 = generateQuoteFingerprint({
      branchId: BRANCH_SURABAYA,
      whatsappNumber: WA_SURABAYA,
      lines: [LINE_CHIFFON],
      subtotalIdr: 170_000,
      discountIdr: 0,
      estimatedTotalIdr: 170_000,
    });

    const fp2 = generateQuoteFingerprint({
      branchId: BRANCH_SURABAYA,
      whatsappNumber: WA_SURABAYA,
      lines: [{ ...LINE_CHIFFON, unitPriceIdr: 90_000, lineTotalIdr: 180_000 }],
      subtotalIdr: 180_000,
      discountIdr: 0,
      estimatedTotalIdr: 180_000,
    });

    expect(fp1).not.toBe(fp2);
  });

  it('changes fingerprint when applied promotion changes', () => {
    const fp1 = generateQuoteFingerprint({
      branchId: BRANCH_SURABAYA,
      whatsappNumber: WA_SURABAYA,
      lines: [LINE_CHIFFON],
      subtotalIdr: 170_000,
      discountIdr: 0,
      estimatedTotalIdr: 170_000,
    });

    const fp2 = generateQuoteFingerprint({
      branchId: BRANCH_SURABAYA,
      whatsappNumber: WA_SURABAYA,
      lines: [
        {
          ...LINE_CHIFFON,
          discountIdr: 10_000,
          lineTotalIdr: 160_000,
          appliedPromotionId: 'f0400000-0000-4000-8000-000000000500',
        },
      ],
      subtotalIdr: 170_000,
      discountIdr: 10_000,
      estimatedTotalIdr: 160_000,
    });

    expect(fp1).not.toBe(fp2);
  });
});
