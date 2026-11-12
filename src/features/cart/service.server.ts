import 'server-only';
import { CART_CONFLICTS, CART_COPY } from '@/constants/cart.constant';
import { readActiveBranches } from '@/features/branches/repository.server';
import {
  evaluateCartPromotions,
  type CartPricingLineInput,
  type PricingPromotionInput,
} from '@/features/catalog/pricing';
import {
  readActiveCatalogPromotions,
  readComponentVariantsByIds,
} from '@/features/catalog/repository.server';
import { cartValidationResponseSchema } from '@/validations/cart.schema';
import type { BundleBreakdownItem } from '@/types/catalog';
import type {
  CartConflictType,
  CartValidatedLine,
  CartValidationRequest,
  CartValidationResponse,
} from '@/types/cart';
import { readCartVariantsByIds } from './repository.server';

interface RawPromotionBranch {
  branch_id: string;
}
interface RawPromotionCategory {
  category_id: string;
}
interface RawPromotionProduct {
  product_id: string;
}
interface RawPromotionVariant {
  variant_id: string;
}

export async function validateCartItems(
  payload: CartValidationRequest,
  now = new Date(),
  signal?: AbortSignal,
): Promise<CartValidationResponse> {
  const branches = await readActiveBranches(signal);
  const branch = branches.find((item) => item.id === payload.branchId);
  if (!branch) {
    throw new Error('Branch not found or inactive');
  }

  if (payload.items.length === 0) {
    return cartValidationResponseSchema.parse({
      branchId: branch.id,
      branchName: branch.name,
      lines: [],
      estimatedSubtotalIdr: 0,
      totalDiscountIdr: 0,
      estimatedTotalIdr: 0,
      hasBlockingConflicts: false,
      hasPriceChanges: false,
    });
  }

  const variantIds = [...new Set(payload.items.map((item) => item.variantId))];
  const rawVariants = await readCartVariantsByIds(variantIds, signal);
  const variantMap = new Map(rawVariants.map((item) => [item.id, item]));

  // Collect component variant IDs for bundle checks
  const componentVariantIds = new Set<string>();
  for (const variant of rawVariants) {
    for (const group of variant.option_groups ?? []) {
      for (const choice of group.option_choices ?? []) {
        if (choice.component_variant_id) {
          componentVariantIds.add(choice.component_variant_id);
        }
      }
    }
    for (const fc of variant.bundle_fixed_components ?? []) {
      if (fc.component_variant_id) {
        componentVariantIds.add(fc.component_variant_id);
      }
    }
  }

  const componentVariants =
    componentVariantIds.size > 0
      ? await readComponentVariantsByIds(
          Array.from(componentVariantIds),
          signal,
        )
      : [];
  const componentVariantMap = new Map(
    componentVariants.map((item) => [item.id, item]),
  );

  const rawPromotions = await readActiveCatalogPromotions(signal);
  const promotions: PricingPromotionInput[] = rawPromotions.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    discountType: row.discount_type as 'percentage' | 'fixed',
    discountValue: Number(row.discount_value),
    minSpendIdr: row.min_spend_idr,
    maxDiscountIdr: row.max_discount_idr,
    scope: row.scope as 'all' | 'category' | 'product' | 'variant',
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status as 'draft' | 'published' | 'archived',
    isEnabled: row.is_enabled,
    isStackable: row.is_stackable,
    priority: row.priority,
    branchIds: (row.promotion_branches as RawPromotionBranch[]).map(
      (b) => b.branch_id,
    ),
    categoryIds: (row.promotion_categories as RawPromotionCategory[]).map(
      (c) => c.category_id,
    ),
    productIds: (row.promotion_products as RawPromotionProduct[]).map(
      (p) => p.product_id,
    ),
    variantIds: (row.promotion_variants as RawPromotionVariant[]).map(
      (v) => v.variant_id,
    ),
  }));

  const intermediateLines: Array<{
    item: (typeof payload.items)[number];
    variant: (typeof rawVariants)[number] | null;
    product: NonNullable<(typeof rawVariants)[number]['products']> | null;
    primaryImage:
      | NonNullable<
          (typeof rawVariants)[number]['products']
        >['product_images'][number]
      | null;
    offer: (typeof rawVariants)[number]['branch_variant_offers'][number] | null;
    conflict: CartConflictType;
    conflictMessage: string | null;
    availabilityStatus: 'available' | 'sold_out' | 'unconfirmed' | 'archived';
    bundleBreakdown: BundleBreakdownItem[];
    choiceNames: string[];
    selectedOptionDeltasIdr: number[];
    categoryIds: string[];
    basePriceIdr: number;
    priceOverrideIdr: number | null;
    unitGrossIdr: number;
  }> = [];

  for (const item of payload.items) {
    const variant = variantMap.get(item.variantId) ?? null;
    const product = variant?.products ?? null;
    const primaryImage =
      product?.product_images?.find((img) => img.is_primary) ??
      product?.product_images?.[0] ??
      null;

    let conflict: CartConflictType = CART_CONFLICTS.NONE;
    let conflictMessage: string | null = null;
    let availabilityStatus:
      'available' | 'sold_out' | 'unconfirmed' | 'archived' = 'available';

    if (
      !variant ||
      variant.status !== 'published' ||
      !product ||
      product.status !== 'published'
    ) {
      conflict = CART_CONFLICTS.ARCHIVED;
      conflictMessage = CART_COPY.CONFLICT_ARCHIVED;
      availabilityStatus = 'archived';
    }

    const offer =
      variant?.branch_variant_offers?.find(
        (o) => o.branch_id === branch.id && o.is_listed,
      ) ?? null;

    if (conflict === CART_CONFLICTS.NONE) {
      if (!offer) {
        conflict = CART_CONFLICTS.NOT_OFFERED;
        conflictMessage = CART_COPY.CONFLICT_NOT_OFFERED;
        availabilityStatus = 'sold_out';
      } else if (
        offer.availability_status === 'sold_out' ||
        (offer.stock_quantity !== null && offer.stock_quantity <= 0)
      ) {
        conflict = CART_CONFLICTS.SOLD_OUT;
        conflictMessage = CART_COPY.CONFLICT_SOLD_OUT;
        availabilityStatus = 'sold_out';
      } else if (offer.availability_status === 'unconfirmed') {
        availabilityStatus = 'unconfirmed';
      }
    }

    // Process options and bundle components
    const bundleBreakdown: BundleBreakdownItem[] = [];
    const choiceNames: string[] = [];
    const selectedOptionDeltasIdr: number[] = [];

    if (variant && item.choiceIds.length > 0) {
      const choiceIdSet = new Set(item.choiceIds);
      for (const group of variant.option_groups ?? []) {
        for (const choice of group.option_choices ?? []) {
          if (choiceIdSet.has(choice.id)) {
            choiceNames.push(choice.label);
            selectedOptionDeltasIdr.push(choice.price_delta_idr);

            if (choice.component_variant_id) {
              const comp = componentVariantMap.get(choice.component_variant_id);
              const compOffer = comp?.branch_variant_offers?.find(
                (o) => o.branch_id === branch.id && o.is_listed,
              );
              const compAvailable =
                compOffer &&
                compOffer.availability_status !== 'sold_out' &&
                (compOffer.stock_quantity === null ||
                  compOffer.stock_quantity > 0);

              if (!compAvailable && conflict === CART_CONFLICTS.NONE) {
                conflict = CART_CONFLICTS.COMPONENT_UNAVAILABLE;
                conflictMessage = CART_COPY.CONFLICT_COMPONENT_UNAVAILABLE;
              }

              bundleBreakdown.push({
                slotOrGroup: group.name,
                label: choice.label,
                quantity: group.quantity_per_selection,
                priceDeltaIdr: choice.price_delta_idr,
                componentVariantId: choice.component_variant_id,
                isFixed: false,
              });
            }
          }
        }
      }
    }

    // Check fixed components for bundles
    if (variant && variant.bundle_fixed_components) {
      for (const fc of variant.bundle_fixed_components) {
        const comp = componentVariantMap.get(fc.component_variant_id);
        const compOffer = comp?.branch_variant_offers?.find(
          (o) => o.branch_id === branch.id && o.is_listed,
        );
        const compAvailable =
          compOffer &&
          compOffer.availability_status !== 'sold_out' &&
          (compOffer.stock_quantity === null || compOffer.stock_quantity > 0);

        if (!compAvailable && conflict === CART_CONFLICTS.NONE) {
          conflict = CART_CONFLICTS.COMPONENT_UNAVAILABLE;
          conflictMessage = CART_COPY.CONFLICT_COMPONENT_UNAVAILABLE;
        }

        bundleBreakdown.push({
          slotOrGroup: fc.component_slot,
          label: comp?.name ?? 'Komponen Pilihan',
          quantity: fc.quantity,
          priceDeltaIdr: 0,
          componentVariantId: fc.component_variant_id,
          isFixed: true,
        });
      }
    }

    const basePriceIdr = variant?.base_price_idr ?? 0;
    const priceOverrideIdr = offer?.price_override_idr ?? null;
    const baseOrOverride = priceOverrideIdr ?? basePriceIdr;
    const deltasSum = selectedOptionDeltasIdr.reduce(
      (sum, val) => sum + val,
      0,
    );
    const unitGrossIdr = baseOrOverride + deltasSum;

    const categoryIds =
      product?.product_categories?.map((c) => c.category_id) ?? [];

    intermediateLines.push({
      item,
      variant,
      product,
      primaryImage,
      offer,
      conflict,
      conflictMessage,
      availabilityStatus,
      bundleBreakdown,
      choiceNames,
      selectedOptionDeltasIdr,
      categoryIds,
      basePriceIdr,
      priceOverrideIdr,
      unitGrossIdr,
    });
  }

  // Evaluate promotions
  const pricingLines: CartPricingLineInput[] = intermediateLines.map(
    (line) => ({
      lineId: line.item.lineId,
      productId: line.product?.id ?? '00000000-0000-0000-0000-000000000000',
      variantId: line.item.variantId,
      categoryIds: line.categoryIds,
      basePriceIdr: line.basePriceIdr,
      priceOverrideIdr: line.priceOverrideIdr,
      selectedOptionDeltasIdr: line.selectedOptionDeltasIdr,
      quantity: line.item.quantity,
    }),
  );

  const evaluation = evaluateCartPromotions(
    pricingLines,
    promotions,
    branch.id,
    now,
  );
  const evaluationMap = new Map(
    evaluation.lines.map((line) => [line.lineId, line]),
  );

  const validatedLines: CartValidatedLine[] = intermediateLines.map((entry) => {
    const evaluated = evaluationMap.get(entry.item.lineId);
    const unitDiscountIdr = evaluated
      ? Math.floor(evaluated.lineDiscountIdr / entry.item.quantity)
      : 0;
    const effectiveUnitPriceIdr = Math.max(
      0,
      entry.unitGrossIdr - unitDiscountIdr,
    );
    const subtotalIdr = evaluated?.lineNetIdr ?? 0;

    return {
      lineId: entry.item.lineId,
      variantId: entry.item.variantId,
      productId: entry.product?.id ?? '00000000-0000-0000-0000-000000000000',
      productName: entry.product?.name ?? 'Produk Tidak Ditemukan',
      productSlug: entry.product?.slug ?? 'unknown',
      productType:
        (entry.product?.product_type as 'simple' | 'variants' | 'bundle') ??
        'simple',
      variantName: entry.variant?.name ?? 'Varian',
      sku: entry.variant?.sku ?? 'SKU-UNKNOWN',
      sizeLabel: entry.variant?.size_label ?? null,
      imageAlt:
        entry.primaryImage?.alt_text ??
        entry.product?.name ??
        'Produk Resep Oma Kueh',
      quantity: entry.item.quantity,
      unitGrossIdr: entry.unitGrossIdr,
      unconditionalDiscountIdr: unitDiscountIdr,
      effectiveUnitPriceIdr,
      subtotalIdr,
      availabilityStatus: entry.availabilityStatus,
      conflict: entry.conflict,
      conflictMessage: entry.conflictMessage,
      bundleBreakdown: entry.bundleBreakdown,
      choiceNames: entry.choiceNames,
    };
  });

  const hasBlockingConflicts = validatedLines.some(
    (l) =>
      l.conflict === CART_CONFLICTS.SOLD_OUT ||
      l.conflict === CART_CONFLICTS.NOT_OFFERED ||
      l.conflict === CART_CONFLICTS.COMPONENT_UNAVAILABLE ||
      l.conflict === CART_CONFLICTS.ARCHIVED,
  );

  const hasPriceChanges = validatedLines.some(
    (l) => l.conflict === CART_CONFLICTS.PRICE_CHANGED,
  );

  return cartValidationResponseSchema.parse({
    branchId: branch.id,
    branchName: branch.name,
    lines: validatedLines,
    estimatedSubtotalIdr: evaluation.subtotalGrossIdr,
    totalDiscountIdr: evaluation.discountTotalIdr,
    estimatedTotalIdr: evaluation.totalEstimateIdr,
    hasBlockingConflicts,
    hasPriceChanges,
  });
}
