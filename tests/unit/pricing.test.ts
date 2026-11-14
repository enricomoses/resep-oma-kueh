import { describe, expect, it } from 'vitest';
import {
  calculateCandidateDiscountIdr,
  computeMinRequiredOptionDeltaIdr,
  computeVariantEffectivePrice,
  evaluateCartPromotions,
  formatIdr,
  isPromotionInActiveWindow,
  type PricingPromotionInput,
} from '@/utils/catalog-pricing';

const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const BINTARO_ID = 'f0400000-0000-4000-8000-000000000002';
const CATEGORY_CHIFFON_ID = 'f0400000-0000-4000-8000-000000000200';
const PRODUCT_COFFEE_ID = 'f0400000-0000-4000-8000-000000000400';
const PRODUCT_ROK_ID = 'f0400000-0000-4000-8000-000000000401';
const VARIANT_SLICE_ID = 'f0400000-0000-4000-8000-000000000600';
const VARIANT_MINI_ID = 'f0400000-0000-4000-8000-000000000601';

function buildPromo(
  overrides: Partial<PricingPromotionInput>,
): PricingPromotionInput {
  return {
    id: 'f0400000-0000-4000-8000-000000000931',
    title: 'DEMO Promo',
    slug: 'demo-promo',
    discountType: 'fixed',
    discountValue: 2000,
    minSpendIdr: 0,
    maxDiscountIdr: 5000,
    scope: 'product',
    startsAt: '2026-11-10T00:00:00+07:00',
    endsAt: '2026-11-18T00:00:00+07:00',
    status: 'published',
    isEnabled: true,
    isStackable: false,
    priority: 1,
    branchIds: [BINTARO_ID],
    categoryIds: [],
    productIds: [PRODUCT_COFFEE_ID],
    variantIds: [],
    ...overrides,
  };
}

describe('pure pricing & promotion calculator (§27.2)', () => {
  it('enforces starts_at inclusive and ends_at exclusive date boundaries and rejects stackable/draft promos', () => {
    const promo = buildPromo({});
    expect(
      isPromotionInActiveWindow(promo, new Date('2026-11-10T00:00:00+07:00')),
    ).toBe(true);
    expect(
      isPromotionInActiveWindow(promo, new Date('2026-11-09T23:59:59+07:00')),
    ).toBe(false);
    expect(
      isPromotionInActiveWindow(promo, new Date('2026-11-18T00:00:00+07:00')),
    ).toBe(false);
    expect(
      isPromotionInActiveWindow(
        buildPromo({ isStackable: true }),
        new Date('2026-11-12T00:00:00+07:00'),
      ),
    ).toBe(false);
    expect(
      isPromotionInActiveWindow(
        buildPromo({ status: 'draft' }),
        new Date('2026-11-12T00:00:00+07:00'),
      ),
    ).toBe(false);
  });

  it('computes minimum required option delta across active choices and rejects unfulfillable required groups', () => {
    const delta = computeMinRequiredOptionDeltaIdr([
      {
        id: 'group-1',
        minSelect: 2,
        maxSelect: 2,
        isRequired: true,
        choices: [
          { id: 'c1', priceDeltaIdr: 5000, isActive: true },
          { id: 'c2', priceDeltaIdr: 2000, isActive: true },
          { id: 'c3', priceDeltaIdr: 1000, isActive: false },
          { id: 'c4', priceDeltaIdr: 3000, isActive: true },
        ],
      },
      {
        id: 'group-optional',
        minSelect: 0,
        maxSelect: 2,
        isRequired: false,
        choices: [{ id: 'c5', priceDeltaIdr: 10000, isActive: true }],
      },
    ]);
    expect(delta).toBe(5000); // 2000 + 3000 (inactive 1000 ignored)

    const impossibleDelta = computeMinRequiredOptionDeltaIdr([
      {
        id: 'group-impossible',
        minSelect: 2,
        maxSelect: 2,
        isRequired: true,
        choices: [{ id: 'c1', priceDeltaIdr: 2000, isActive: true }],
      },
    ]);
    expect(impossibleDelta).toBeNull();
  });

  it('applies branch price override, minimum required option delta, unconditional promo, and separates conditional min_spend promo', () => {
    const now = new Date('2026-11-12T10:00:00+07:00');
    const unconditionalPromo = buildPromo({
      id: 'f0400000-0000-4000-8000-000000000931',
      discountType: 'fixed',
      discountValue: 2000,
      minSpendIdr: 0,
    });
    const conditionalPromo = buildPromo({
      id: 'f0400000-0000-4000-8000-000000000932',
      title: 'Min Spend 100k',
      slug: 'min-spend-100k',
      discountType: 'percentage',
      discountValue: 20,
      minSpendIdr: 100_000,
      maxDiscountIdr: 30_000,
    });

    const bintaroEval = computeVariantEffectivePrice(
      {
        basePriceIdr: 15_000,
        priceOverrideIdr: 16_000,
        optionGroups: [
          {
            id: 'g1',
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            choices: [{ id: 'c1', priceDeltaIdr: 1_000, isActive: true }],
          },
        ],
      },
      {
        branchId: BINTARO_ID,
        productId: PRODUCT_COFFEE_ID,
        variantId: VARIANT_SLICE_ID,
        categoryIds: [CATEGORY_CHIFFON_ID],
      },
      [unconditionalPromo, conditionalPromo],
      now,
    );

    expect(bintaroEval).not.toBeNull();
    expect(bintaroEval?.baseOrOverrideIdr).toBe(16_000);
    expect(bintaroEval?.minOptionDeltaIdr).toBe(1_000);
    expect(bintaroEval?.unitGrossIdr).toBe(17_000);
    expect(bintaroEval?.unconditionalDiscountIdr).toBe(2_000);
    expect(bintaroEval?.effectivePriceIdr).toBe(15_000);
    expect(bintaroEval?.appliedPromotion?.slug).toBe('demo-promo');
    expect(bintaroEval?.conditionalPromotion?.slug).toBe('min-spend-100k');

    // In Surabaya, branch-scoped Bintaro promo does not apply
    const surabayaEval = computeVariantEffectivePrice(
      {
        basePriceIdr: 15_000,
        priceOverrideIdr: null,
        optionGroups: [],
      },
      {
        branchId: SURABAYA_ID,
        productId: PRODUCT_COFFEE_ID,
        variantId: VARIANT_SLICE_ID,
        categoryIds: [CATEGORY_CHIFFON_ID],
      },
      [unconditionalPromo, conditionalPromo],
      now,
    );
    expect(surabayaEval?.effectivePriceIdr).toBe(15_000);
    expect(surabayaEval?.appliedPromotion).toBeNull();
    expect(surabayaEval?.conditionalPromotion).toBeNull();
  });

  it('calculates percentage basis-point half-up rounding, fixed per-unit discount, and max_discount_idr cap', () => {
    // 12.5% of 10,004 IDR = 1,250.5 IDR -> half-up rounds to 1,251 IDR
    const rounded = calculateCandidateDiscountIdr(10_004, 1, {
      discountType: 'percentage',
      discountValue: 12.5,
      maxDiscountIdr: null,
    });
    expect(rounded).toBe(1_251);

    // Fixed 2,000 IDR per unit * 3 units = 6,000 IDR, capped by maxDiscountIdr = 5,000 IDR
    const fixedCapped = calculateCandidateDiscountIdr(48_000, 3, {
      discountType: 'fixed',
      discountValue: 2_000,
      maxDiscountIdr: 5_000,
    });
    expect(fixedCapped).toBe(5_000);

    // Discount never exceeds lineGrossIdr
    const clampedToGross = calculateCandidateDiscountIdr(3_000, 2, {
      discountType: 'fixed',
      discountValue: 2_500,
      maxDiscountIdr: null,
    });
    expect(clampedToGross).toBe(3_000);
  });

  it('resolves min_spend_idr ambiguity across multiple target lines vs non-target lines and breaks ties by priority DESC then id ASC', () => {
    const now = new Date('2026-11-12T10:00:00+07:00');
    const productScopedMinSpend = buildPromo({
      id: 'f0400000-0000-4000-8000-000000000902',
      title: 'Coffee Min 80k',
      slug: 'coffee-min-80k',
      discountType: 'percentage',
      discountValue: 10,
      minSpendIdr: 80_000,
      maxDiscountIdr: null,
      scope: 'product',
      productIds: [PRODUCT_COFFEE_ID],
      branchIds: [],
      priority: 1,
    });

    // Two lines of PRODUCT_COFFEE_ID: 16,000 + 70,000 = 86,000 >= 80,000 target subtotal!
    const multiLineCart = evaluateCartPromotions(
      [
        {
          lineId: 'line-1',
          productId: PRODUCT_COFFEE_ID,
          variantId: VARIANT_SLICE_ID,
          categoryIds: [CATEGORY_CHIFFON_ID],
          basePriceIdr: 15_000,
          priceOverrideIdr: 16_000,
          selectedOptionDeltasIdr: [],
          quantity: 1,
        },
        {
          lineId: 'line-2',
          productId: PRODUCT_COFFEE_ID,
          variantId: VARIANT_MINI_ID,
          categoryIds: [CATEGORY_CHIFFON_ID],
          basePriceIdr: 70_000,
          priceOverrideIdr: null,
          selectedOptionDeltasIdr: [],
          quantity: 1,
        },
      ],
      [productScopedMinSpend],
      BINTARO_ID,
      now,
    );

    expect(multiLineCart.subtotalGrossIdr).toBe(86_000);
    expect(multiLineCart.discountTotalIdr).toBe(8_600); // 1,600 + 7,000
    expect(multiLineCart.totalEstimateIdr).toBe(77_400);

    // If Coffee subtotal is only 16,000 and another non-target product is 130,000, Coffee promo minSpend 80,000 is NOT met!
    const nonTargetCart = evaluateCartPromotions(
      [
        {
          lineId: 'line-1',
          productId: PRODUCT_COFFEE_ID,
          variantId: VARIANT_SLICE_ID,
          categoryIds: [CATEGORY_CHIFFON_ID],
          basePriceIdr: 16_000,
          priceOverrideIdr: null,
          selectedOptionDeltasIdr: [],
          quantity: 1,
        },
        {
          lineId: 'line-other',
          productId: PRODUCT_ROK_ID,
          variantId: 'f0400000-0000-4000-8000-000000000604',
          categoryIds: [CATEGORY_CHIFFON_ID],
          basePriceIdr: 130_000,
          priceOverrideIdr: null,
          selectedOptionDeltasIdr: [],
          quantity: 1,
        },
      ],
      [productScopedMinSpend],
      BINTARO_ID,
      now,
    );
    expect(nonTargetCart.discountTotalIdr).toBe(0);

    // Tie-break test: equal savings -> higher priority wins; equal priority -> lexicographically smaller UUID wins
    const promoLowPriority = buildPromo({
      id: 'f0400000-0000-4000-8000-000000000901',
      slug: 'low-priority',
      discountType: 'fixed',
      discountValue: 3_000,
      priority: 1,
    });
    const promoHighPriorityB = buildPromo({
      id: 'f0400000-0000-4000-8000-000000000905',
      slug: 'high-priority-b',
      discountType: 'fixed',
      discountValue: 3_000,
      priority: 5,
    });
    const promoHighPriorityA = buildPromo({
      id: 'f0400000-0000-4000-8000-000000000903',
      slug: 'high-priority-a',
      discountType: 'fixed',
      discountValue: 3_000,
      priority: 5,
    });

    const tieCart = evaluateCartPromotions(
      [
        {
          lineId: 'line-tie',
          productId: PRODUCT_COFFEE_ID,
          variantId: VARIANT_SLICE_ID,
          categoryIds: [CATEGORY_CHIFFON_ID],
          basePriceIdr: 15_000,
          priceOverrideIdr: null,
          selectedOptionDeltasIdr: [],
          quantity: 1,
        },
      ],
      [promoLowPriority, promoHighPriorityB, promoHighPriorityA],
      BINTARO_ID,
      now,
    );
    expect(tieCart.lines[0].appliedPromotion?.slug).toBe('high-priority-a');
  });

  it('formats IDR currency deterministically and rejects unsafe integer bounds', () => {
    expect(formatIdr(0)).toBe('Rp0');
    expect(formatIdr(15_000)).toBe('Rp15.000');
    expect(formatIdr(1_250_500)).toBe('Rp1.250.500');
    expect(() =>
      calculateCandidateDiscountIdr(1_000_000_000_001, 1, {
        discountType: 'fixed',
        discountValue: 1000,
        maxDiscountIdr: null,
      }),
    ).toThrow(RangeError);
  });
});
