import { describe, expect, it } from 'vitest';

import {
  buildPromotionPreviewExamples,
  derivePromotionClockState,
  formatJakartaDateTimeDisplay,
  fromJakartaDateTimeInputValue,
  toJakartaDateTimeInputValue,
} from '@/utils/admin-promotions';
import {
  calculateCandidateDiscountIdr,
  type CartPricingLineInput,
  evaluateCartPromotions,
  isPromotionInActiveWindow,
  type PricingPromotionInput,
} from '@/utils/catalog-pricing';
import { saveAdminPromotionSchema } from '@/validations/promotion.schema';

const BRANCH_SBY = 'f0400000-0000-4000-8000-000000000001';
const BRANCH_BTR = 'f0400000-0000-4000-8000-000000000002';
const CAT_CHIFFON = 'c1900000-0000-4000-8000-000000000001';
const CAT_BREAD = 'c1900000-0000-4000-8000-000000000002';
const PROD_CHIFFON = 'a1900000-0000-4000-8000-000000000001';
const PROD_BREAD = 'a1900000-0000-4000-8000-000000000002';
const VAR_CHIFFON = 'b1900000-0000-4000-8000-000000000001';
const VAR_BREAD = 'b1900000-0000-4000-8000-000000000002';

function makePromo(
  overrides: Partial<PricingPromotionInput> = {},
): PricingPromotionInput {
  return {
    id: 'd1900000-0000-4000-8000-000000000010',
    title: 'Promo Chiffon',
    slug: 'promo-chiffon',
    discountType: 'percentage',
    discountValue: 10,
    minSpendIdr: 0,
    maxDiscountIdr: null,
    scope: 'all',
    startsAt: '2026-11-10T02:00:00.000Z', // 09:00 WIB
    endsAt: '2026-11-17T02:00:00.000Z', // 09:00 WIB
    status: 'published',
    isEnabled: true,
    isStackable: false,
    priority: 10,
    branchIds: [],
    categoryIds: [],
    productIds: [],
    variantIds: [],
    ...overrides,
  };
}

function makeLine(
  overrides: Partial<CartPricingLineInput> = {},
): CartPricingLineInput {
  return {
    lineId: 'line-1',
    productId: PROD_CHIFFON,
    variantId: VAR_CHIFFON,
    categoryIds: [CAT_CHIFFON],
    basePriceIdr: 100_000,
    priceOverrideIdr: null,
    selectedOptionDeltasIdr: [],
    quantity: 1,
    ...overrides,
  };
}

describe('F19 promotion math, Jakarta clock & boundaries', () => {
  it('picks best monetary discount (non-stackable) and breaks exact ties by priority then ordinal UUID', () => {
    const now = new Date('2026-11-12T05:00:00.000Z');
    const promo10Percent = makePromo({
      id: 'd1900000-0000-4000-8000-000000000099',
      slug: 'pct-10',
      discountType: 'percentage',
      discountValue: 10, // 10,000 on 100,000
      priority: 50,
    });
    const promo15kFixed = makePromo({
      id: 'd1900000-0000-4000-8000-000000000020',
      slug: 'fixed-15k',
      discountType: 'fixed',
      discountValue: 15_000, // 15,000 on 100,000 beats 10,000 despite lower priority
      priority: 1,
    });

    const bestMoney = evaluateCartPromotions(
      [makeLine()],
      [promo10Percent, promo15kFixed],
      BRANCH_SBY,
      now,
    );
    expect(bestMoney.lines[0].appliedPromotion?.slug).toBe('fixed-15k');
    expect(bestMoney.discountTotalIdr).toBe(15_000);

    // Exact monetary tie: priority wins; equal priority: smaller ordinal UUID wins
    const tieHighUuid = makePromo({
      id: 'ffffffff-0000-4000-8000-000000000001',
      slug: 'tie-high-uuid',
      discountType: 'fixed',
      discountValue: 10_000,
      priority: 10,
    });
    const tieLowUuid = makePromo({
      id: '00000000-0000-4000-8000-000000000001',
      slug: 'tie-low-uuid',
      discountType: 'percentage',
      discountValue: 10,
      priority: 10,
    });
    const tieHighestPriority = makePromo({
      id: 'eeeeeeee-0000-4000-8000-000000000001',
      slug: 'tie-higher-priority',
      discountType: 'fixed',
      discountValue: 10_000,
      priority: 20,
    });

    const uuidTie = evaluateCartPromotions(
      [makeLine()],
      [tieHighUuid, tieLowUuid],
      BRANCH_SBY,
      now,
    );
    expect(uuidTie.lines[0].appliedPromotion?.slug).toBe('tie-low-uuid');

    const priorityTie = evaluateCartPromotions(
      [makeLine()],
      [tieLowUuid, tieHighestPriority],
      BRANCH_SBY,
      now,
    );
    expect(priorityTie.lines[0].appliedPromotion?.slug).toBe(
      'tie-higher-priority',
    );
  });

  it('computes eligible multi-line minSpendIdr strictly across matching scope lines', () => {
    const now = new Date('2026-11-12T05:00:00.000Z');
    const categoryPromo = makePromo({
      scope: 'category',
      categoryIds: [CAT_CHIFFON],
      minSpendIdr: 180_000,
      discountType: 'percentage',
      discountValue: 10,
    });

    // Two eligible lines in CAT_CHIFFON (95k + 95k = 190k >= 180k)
    const eligibleMultiLine = evaluateCartPromotions(
      [
        makeLine({ lineId: 'l1', basePriceIdr: 95_000 }),
        makeLine({
          lineId: 'l2',
          productId: PROD_BREAD,
          variantId: VAR_BREAD,
          categoryIds: [CAT_CHIFFON],
          basePriceIdr: 95_000,
        }),
      ],
      [categoryPromo],
      BRANCH_SBY,
      now,
    );
    expect(eligibleMultiLine.discountTotalIdr).toBe(19_000);

    // One eligible line (95k) + one non-target line in CAT_BREAD (150k) -> only 95k eligible < 180k
    const ineligibleCrossCategory = evaluateCartPromotions(
      [
        makeLine({ lineId: 'l1', basePriceIdr: 95_000 }),
        makeLine({
          lineId: 'l2',
          productId: PROD_BREAD,
          variantId: VAR_BREAD,
          categoryIds: [CAT_BREAD],
          basePriceIdr: 150_000,
        }),
      ],
      [categoryPromo],
      BRANCH_SBY,
      now,
    );
    expect(ineligibleCrossCategory.discountTotalIdr).toBe(0);
    expect(ineligibleCrossCategory.lines[0].appliedPromotion).toBeNull();
  });

  it('applies percentage fractional half-up rounding, fixed qty scaling + per-line cap, and rejects disabled/stackable', () => {
    const pctDiscount = calculateCandidateDiscountIdr(33_333, 1, {
      discountType: 'percentage',
      discountValue: 12.5, // 33333 * 1250 / 10000 = 4166.625 -> half-up 4167
      maxDiscountIdr: null,
    });
    expect(pctDiscount).toBe(4_167);

    const fixedScaledUncapped = calculateCandidateDiscountIdr(120_000, 3, {
      discountType: 'fixed',
      discountValue: 15_000, // 15,000 * 3 = 45,000
      maxDiscountIdr: null,
    });
    expect(fixedScaledUncapped).toBe(45_000);

    const fixedScaledCapped = calculateCandidateDiscountIdr(120_000, 3, {
      discountType: 'fixed',
      discountValue: 15_000,
      maxDiscountIdr: 30_000,
    });
    expect(fixedScaledCapped).toBe(30_000);

    const now = new Date('2026-11-12T05:00:00.000Z');
    const disabledOrStackable = evaluateCartPromotions(
      [makeLine()],
      [
        makePromo({ slug: 'disabled', isEnabled: false }),
        makePromo({ slug: 'stackable', isStackable: true }),
      ],
      BRANCH_SBY,
      now,
    );
    expect(disabledOrStackable.discountTotalIdr).toBe(0);
  });

  it('enforces exact startsAt inclusive, endsAt exclusive boundaries, branch scope, and Jakarta clock helpers', () => {
    const startIso = '2026-11-12T02:00:00.000Z'; // 09:00 WIB
    const endIso = '2026-11-12T10:00:00.000Z'; // 17:00 WIB
    const promo = makePromo({
      startsAt: startIso,
      endsAt: endIso,
      branchIds: [BRANCH_SBY],
    });

    const beforeStart = new Date('2026-11-12T01:59:59.999Z');
    const atExactStart = new Date(startIso);
    const atExactEnd = new Date(endIso);

    expect(isPromotionInActiveWindow(promo, beforeStart)).toBe(false);
    expect(isPromotionInActiveWindow(promo, atExactStart)).toBe(true);
    expect(isPromotionInActiveWindow(promo, atExactEnd)).toBe(false);

    expect(derivePromotionClockState(startIso, endIso, beforeStart)).toBe(
      'scheduled',
    );
    expect(derivePromotionClockState(startIso, endIso, atExactStart)).toBe(
      'active',
    );
    expect(derivePromotionClockState(startIso, endIso, atExactEnd)).toBe(
      'ended',
    );

    // Branch scoping: active in SBY, excluded in BTR; empty branchIds = all active branches
    expect(
      evaluateCartPromotions([makeLine()], [promo], BRANCH_SBY, atExactStart)
        .discountTotalIdr,
    ).toBe(10_000);
    expect(
      evaluateCartPromotions([makeLine()], [promo], BRANCH_BTR, atExactStart)
        .discountTotalIdr,
    ).toBe(0);

    const allBranchesPromo = makePromo({
      startsAt: startIso,
      endsAt: endIso,
      branchIds: [],
    });
    expect(
      evaluateCartPromotions(
        [makeLine()],
        [allBranchesPromo],
        BRANCH_BTR,
        atExactStart,
      ).discountTotalIdr,
    ).toBe(10_000);

    // Jakarta timezone conversion (+07:00)
    const utcIso = fromJakartaDateTimeInputValue('2026-11-12T09:00');
    expect(utcIso).toBe('2026-11-12T02:00:00.000Z');
    expect(toJakartaDateTimeInputValue('2026-11-12T02:00:00.000Z')).toBe(
      '2026-11-12T09:00',
    );
    expect(formatJakartaDateTimeDisplay('2026-11-12T02:00:00.000Z')).toContain(
      'WIB',
    );

    // Shared calc preview scenarios
    const examples = buildPromotionPreviewExamples({
      discountType: 'fixed',
      discountValue: 15_000,
      minSpendIdr: 100_000,
      maxDiscountIdr: 35_000,
      priority: 1,
    });
    expect(examples[0].meetsMinSpend).toBe(false);
    expect(examples[0].discountIdr).toBe(0);
    expect(examples[1].discountIdr).toBe(30_000); // 150k x 2 = 300k, fixed 15k*2 = 30k
    expect(examples[2].discountIdr).toBe(35_000); // 320k x 3 = 960k, capped at 35k
    expect(examples[2].wasCapped).toBe(true);
  });

  it('rejects stackable, invalid periods, and missing publish targets in Zod payload validation', () => {
    const missingTargets = saveAdminPromotionSchema.safeParse({
      expectedUpdatedAt: null,
      title: 'Promo Kategori Kosong',
      slug: 'promo-kat-kosong',
      description: null,
      discountType: 'percentage',
      discountValue: 15,
      maxDiscountIdr: null,
      minSpendIdr: 0,
      scope: 'category',
      startsAt: '2026-11-12T02:00:00.000Z',
      endsAt: '2026-11-15T02:00:00.000Z',
      priority: 5,
      status: 'published',
      isEnabled: true,
      isStackable: false,
      bannerImagePath: null,
      branchIds: [],
      categoryIds: [],
      productIds: [],
      variantIds: [],
    });
    expect(missingTargets.success).toBe(false);

    const stackablePayload = saveAdminPromotionSchema.safeParse({
      expectedUpdatedAt: null,
      title: 'Promo Stackable',
      slug: 'promo-stackable',
      description: null,
      discountType: 'percentage',
      discountValue: 10,
      maxDiscountIdr: null,
      minSpendIdr: 0,
      scope: 'all',
      startsAt: '2026-11-12T02:00:00.000Z',
      endsAt: '2026-11-15T02:00:00.000Z',
      priority: 5,
      status: 'draft',
      isEnabled: false,
      isStackable: true,
      bannerImagePath: null,
      branchIds: [],
      categoryIds: [],
      productIds: [],
      variantIds: [],
    });
    expect(stackablePayload.success).toBe(false);
  });
});
