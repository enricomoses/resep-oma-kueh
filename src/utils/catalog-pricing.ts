import { CATALOG_LIMITS } from '@/constants/catalog.constant';

interface PricingOptionChoiceInput {
  id: string;
  priceDeltaIdr: number;
  isActive: boolean;
}

export interface PricingOptionGroupInput {
  id: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  choices: readonly PricingOptionChoiceInput[];
}

export interface PricingPromotionInput {
  id: string;
  title: string;
  slug: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpendIdr: number;
  maxDiscountIdr: number | null;
  scope: 'all' | 'category' | 'product' | 'variant';
  startsAt: string;
  endsAt: string;
  status: 'draft' | 'published' | 'archived';
  isEnabled: boolean;
  isStackable: boolean;
  priority: number;
  branchIds: readonly string[];
  categoryIds: readonly string[];
  productIds: readonly string[];
  variantIds: readonly string[];
}

export interface PricingTargetContext {
  branchId: string;
  productId: string;
  variantId: string;
  categoryIds: readonly string[];
}

export interface PricingVariantOfferInput {
  basePriceIdr: number;
  priceOverrideIdr: number | null;
  optionGroups: readonly PricingOptionGroupInput[];
}

interface EvaluatedPromotionBadge {
  id: string;
  title: string;
  slug: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpendIdr: number;
  maxDiscountIdr: number | null;
}

export interface VariantEffectivePriceResult {
  baseOrOverrideIdr: number;
  minOptionDeltaIdr: number;
  unitGrossIdr: number;
  unconditionalDiscountIdr: number;
  effectivePriceIdr: number;
  appliedPromotion: EvaluatedPromotionBadge | null;
  conditionalPromotion: EvaluatedPromotionBadge | null;
}

export interface CartPricingLineInput {
  lineId: string;
  productId: string;
  variantId: string;
  categoryIds: readonly string[];
  basePriceIdr: number;
  priceOverrideIdr: number | null;
  selectedOptionDeltasIdr: readonly number[];
  quantity: number;
}

interface CartEvaluatedLine {
  lineId: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitGrossIdr: number;
  lineGrossIdr: number;
  lineDiscountIdr: number;
  lineNetIdr: number;
  appliedPromotion: EvaluatedPromotionBadge | null;
}

export interface CartEvaluationResult {
  lines: CartEvaluatedLine[];
  subtotalGrossIdr: number;
  discountTotalIdr: number;
  totalEstimateIdr: number;
}

const ZERO_BIGINT = BigInt(0);
const HALF_BPS_BIGINT = BigInt(5000);
const BPS_SCALE_BIGINT = BigInt(10000);

function assertSafeUnitPriceIdr(value: number, label = 'Unit price') {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > CATALOG_LIMITS.MAX_UNIT_IDR
  ) {
    throw new RangeError(`${label} out of safe IDR bounds`);
  }
}

function assertSafeCartGrossIdr(value: number, label = 'Cart gross') {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > CATALOG_LIMITS.MAX_CART_GROSS_IDR
  ) {
    throw new RangeError(`${label} out of safe IDR bounds`);
  }
}

export function computeMinRequiredOptionDeltaIdr(
  optionGroups: readonly PricingOptionGroupInput[],
): number | null {
  let totalDelta = 0;

  for (const group of optionGroups) {
    const requiredSelections = group.isRequired
      ? Math.max(group.minSelect, 1)
      : group.minSelect;

    if (requiredSelections <= 0) continue;

    if (group.maxSelect > 0 && requiredSelections > group.maxSelect) {
      return null;
    }

    const activeChoices = group.choices
      .filter((choice) => choice.isActive)
      .map((choice) => {
        assertSafeUnitPriceIdr(choice.priceDeltaIdr, 'Option choice delta');
        return choice.priceDeltaIdr;
      })
      .sort((a, b) => a - b);

    if (activeChoices.length < requiredSelections) {
      return null;
    }

    for (let index = 0; index < requiredSelections; index += 1) {
      totalDelta += activeChoices[index];
      assertSafeUnitPriceIdr(totalDelta, 'Accumulated option delta');
    }
  }

  return totalDelta;
}

export function isPromotionInActiveWindow(
  promotion: Pick<
    PricingPromotionInput,
    'status' | 'isEnabled' | 'isStackable' | 'startsAt' | 'endsAt'
  >,
  now: Date,
): boolean {
  if (
    promotion.status !== 'published' ||
    !promotion.isEnabled ||
    promotion.isStackable
  ) {
    return false;
  }
  const nowMs = now.getTime();
  const startsMs = Date.parse(promotion.startsAt);
  const endsMs = Date.parse(promotion.endsAt);
  if (
    Number.isNaN(nowMs) ||
    Number.isNaN(startsMs) ||
    Number.isNaN(endsMs) ||
    endsMs <= startsMs
  ) {
    return false;
  }
  return startsMs <= nowMs && nowMs < endsMs;
}

function doesPromotionMatchTarget(
  promotion: PricingPromotionInput,
  target: PricingTargetContext,
): boolean {
  if (
    promotion.branchIds.length > 0 &&
    !promotion.branchIds.includes(target.branchId)
  ) {
    return false;
  }

  switch (promotion.scope) {
    case 'all':
      return true;
    case 'category':
      return (
        promotion.categoryIds.length > 0 &&
        target.categoryIds.some((categoryId) =>
          promotion.categoryIds.includes(categoryId),
        )
      );
    case 'product':
      return (
        promotion.productIds.length > 0 &&
        promotion.productIds.includes(target.productId)
      );
    case 'variant':
      return (
        promotion.variantIds.length > 0 &&
        promotion.variantIds.includes(target.variantId)
      );
  }
}

export function calculateCandidateDiscountIdr(
  lineGrossIdr: number,
  quantity: number,
  promotion: Pick<
    PricingPromotionInput,
    'discountType' | 'discountValue' | 'maxDiscountIdr'
  >,
): number {
  assertSafeCartGrossIdr(lineGrossIdr, 'Line gross');
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new RangeError('Quantity must be a positive safe integer');
  }
  if (
    !Number.isFinite(promotion.discountValue) ||
    promotion.discountValue <= 0
  ) {
    return 0;
  }

  let candidate: number;
  if (promotion.discountType === 'percentage') {
    const clampedPercent = Math.min(promotion.discountValue, 100);
    const bps = Math.round(clampedPercent * 100);
    candidate = Number(
      (BigInt(lineGrossIdr) * BigInt(bps) + HALF_BPS_BIGINT) / BPS_SCALE_BIGINT,
    );
  } else {
    const fixedRupiah = Math.round(promotion.discountValue);
    assertSafeUnitPriceIdr(fixedRupiah, 'Fixed discount');
    candidate = Number(BigInt(fixedRupiah) * BigInt(quantity));
  }

  const maxCap =
    promotion.maxDiscountIdr !== null && promotion.maxDiscountIdr >= 0
      ? promotion.maxDiscountIdr
      : candidate;

  return Math.min(candidate, maxCap, lineGrossIdr);
}

function comparePromotionCandidates(
  a: { discountIdr: number; promotion: PricingPromotionInput },
  b: { discountIdr: number; promotion: PricingPromotionInput },
): number {
  if (b.discountIdr !== a.discountIdr) {
    return b.discountIdr - a.discountIdr;
  }
  if (b.promotion.priority !== a.promotion.priority) {
    return b.promotion.priority - a.promotion.priority;
  }
  if (a.promotion.id < b.promotion.id) return -1;
  if (a.promotion.id > b.promotion.id) return 1;
  return 0;
}

function toPromotionBadge(
  promotion: PricingPromotionInput,
): EvaluatedPromotionBadge {
  return {
    id: promotion.id,
    title: promotion.title,
    slug: promotion.slug,
    discountType: promotion.discountType,
    discountValue: promotion.discountValue,
    minSpendIdr: promotion.minSpendIdr,
    maxDiscountIdr: promotion.maxDiscountIdr,
  };
}

export function computeVariantEffectivePrice(
  input: PricingVariantOfferInput,
  target: PricingTargetContext,
  promotions: readonly PricingPromotionInput[],
  now: Date,
): VariantEffectivePriceResult | null {
  const baseOrOverrideIdr = input.priceOverrideIdr ?? input.basePriceIdr;
  assertSafeUnitPriceIdr(baseOrOverrideIdr, 'Variant base/override price');

  const minOptionDeltaIdr = computeMinRequiredOptionDeltaIdr(
    input.optionGroups,
  );
  if (minOptionDeltaIdr === null) {
    return null;
  }

  const unitGrossIdr = baseOrOverrideIdr + minOptionDeltaIdr;
  assertSafeUnitPriceIdr(unitGrossIdr, 'Unit gross price');

  const matchingPromotions = promotions.filter(
    (promo) =>
      isPromotionInActiveWindow(promo, now) &&
      doesPromotionMatchTarget(promo, target),
  );

  const unconditionalCandidates = matchingPromotions
    .filter((promo) => promo.minSpendIdr === 0)
    .map((promotion) => ({
      promotion,
      discountIdr: calculateCandidateDiscountIdr(unitGrossIdr, 1, promotion),
    }))
    .filter((item) => item.discountIdr > 0)
    .sort(comparePromotionCandidates);

  const conditionalCandidates = matchingPromotions
    .filter((promo) => promo.minSpendIdr > 0)
    .map((promotion) => ({
      promotion,
      discountIdr: calculateCandidateDiscountIdr(unitGrossIdr, 1, promotion),
    }))
    .filter((item) => item.discountIdr > 0)
    .sort(comparePromotionCandidates);

  const bestUnconditional = unconditionalCandidates[0] ?? null;
  const bestConditional = conditionalCandidates[0] ?? null;

  const unconditionalDiscountIdr = bestUnconditional?.discountIdr ?? 0;
  const effectivePriceIdr = unitGrossIdr - unconditionalDiscountIdr;

  return {
    baseOrOverrideIdr,
    minOptionDeltaIdr,
    unitGrossIdr,
    unconditionalDiscountIdr,
    effectivePriceIdr,
    appliedPromotion: bestUnconditional
      ? toPromotionBadge(bestUnconditional.promotion)
      : null,
    conditionalPromotion: bestConditional
      ? toPromotionBadge(bestConditional.promotion)
      : null,
  };
}

export function evaluateCartPromotions(
  lines: readonly CartPricingLineInput[],
  promotions: readonly PricingPromotionInput[],
  branchId: string,
  now: Date,
): CartEvaluationResult {
  const activePromotions = promotions.filter((promo) =>
    isPromotionInActiveWindow(promo, now),
  );

  const preparedLines = lines.map((line) => {
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new RangeError(
        'Cart line quantity must be a positive safe integer',
      );
    }
    const baseOrOverrideIdr = line.priceOverrideIdr ?? line.basePriceIdr;
    assertSafeUnitPriceIdr(baseOrOverrideIdr, 'Cart line base/override price');

    let optionDeltaSum = 0;
    for (const delta of line.selectedOptionDeltasIdr) {
      assertSafeUnitPriceIdr(delta, 'Selected option delta');
      optionDeltaSum += delta;
      assertSafeUnitPriceIdr(optionDeltaSum, 'Selected option delta sum');
    }

    const unitGrossIdr = baseOrOverrideIdr + optionDeltaSum;
    assertSafeUnitPriceIdr(unitGrossIdr, 'Cart line unit gross');

    const lineGrossBig = BigInt(unitGrossIdr) * BigInt(line.quantity);
    if (lineGrossBig > BigInt(CATALOG_LIMITS.MAX_CART_GROSS_IDR)) {
      throw new RangeError('Line gross exceeds safe IDR bounds');
    }
    const lineGrossIdr = Number(lineGrossBig);
    assertSafeCartGrossIdr(lineGrossIdr, 'Cart line gross');

    const target: PricingTargetContext = {
      branchId,
      productId: line.productId,
      variantId: line.variantId,
      categoryIds: line.categoryIds,
    };

    return {
      input: line,
      target,
      unitGrossIdr,
      lineGrossIdr,
    };
  });

  // Compute eligible target gross subtotal per promotion across all matching lines before discounts (§27.2).
  const eligiblePromotions = activePromotions.filter((promo) => {
    let targetSubtotalBig = ZERO_BIGINT;
    for (const prepared of preparedLines) {
      if (doesPromotionMatchTarget(promo, prepared.target)) {
        targetSubtotalBig += BigInt(prepared.lineGrossIdr);
      }
    }
    return targetSubtotalBig >= BigInt(promo.minSpendIdr);
  });

  let subtotalGrossBig = ZERO_BIGINT;
  let discountTotalBig = ZERO_BIGINT;

  const evaluatedLines: CartEvaluatedLine[] = preparedLines.map((prepared) => {
    const candidates = eligiblePromotions
      .filter((promo) => doesPromotionMatchTarget(promo, prepared.target))
      .map((promotion) => ({
        promotion,
        discountIdr: calculateCandidateDiscountIdr(
          prepared.lineGrossIdr,
          prepared.input.quantity,
          promotion,
        ),
      }))
      .filter((item) => item.discountIdr > 0)
      .sort(comparePromotionCandidates);

    const best = candidates[0] ?? null;
    const lineDiscountIdr = best?.discountIdr ?? 0;
    const lineNetIdr = prepared.lineGrossIdr - lineDiscountIdr;

    subtotalGrossBig += BigInt(prepared.lineGrossIdr);
    discountTotalBig += BigInt(lineDiscountIdr);

    if (subtotalGrossBig > BigInt(CATALOG_LIMITS.MAX_CART_GROSS_IDR)) {
      throw new RangeError('Cart subtotal gross exceeds safe IDR bounds');
    }

    return {
      lineId: prepared.input.lineId,
      productId: prepared.input.productId,
      variantId: prepared.input.variantId,
      quantity: prepared.input.quantity,
      unitGrossIdr: prepared.unitGrossIdr,
      lineGrossIdr: prepared.lineGrossIdr,
      lineDiscountIdr,
      lineNetIdr,
      appliedPromotion: best ? toPromotionBadge(best.promotion) : null,
    };
  });

  const subtotalGrossIdr = Number(subtotalGrossBig);
  const discountTotalIdr = Number(discountTotalBig);
  const totalEstimateIdr = subtotalGrossIdr - discountTotalIdr;

  assertSafeCartGrossIdr(subtotalGrossIdr, 'Cart subtotal gross');
  assertSafeCartGrossIdr(totalEstimateIdr, 'Cart total estimate');

  return {
    lines: evaluatedLines,
    subtotalGrossIdr,
    discountTotalIdr,
    totalEstimateIdr,
  };
}

export function formatIdr(amountIdr: number): string {
  assertSafeCartGrossIdr(amountIdr, 'Formatted IDR amount');
  const digits = String(amountIdr).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${digits}`;
}
