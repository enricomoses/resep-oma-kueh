import 'server-only';
import {
  CHECKOUT_COPY,
  CHECKOUT_LIMITS,
  CHECKOUT_WARNING_CODES,
} from '@/constants/checkout.constant';
import { readActiveBranches } from '@/features/branches/repository.server';
import { readCartVariantsByIds } from '@/features/cart/repository.server';
import {
  evaluateCartPromotions,
  type CartPricingLineInput,
  type PricingPromotionInput,
} from '@/features/catalog/pricing';
import {
  readActiveCatalogPromotions,
  readComponentVariantsByIds,
} from '@/features/catalog/repository.server';
import type { BundleBreakdownItem } from '@/types/catalog';
import type {
  CheckoutPrepareLine,
  CheckoutPrepareRequest,
  CheckoutPrepareResponse,
} from '@/types/checkout';
import {
  buildWhatsAppUrl,
  composeWhatsAppMessage,
  formatWhatsappDigits,
} from '@/utils/checkout';
import { checkoutPrepareResponseSchema } from '@/validations/checkout.schema';
import {
  CheckoutBranchNotFoundError,
  CheckoutItemUnavailableError,
  CheckoutStockChangedError,
  CheckoutUpstreamError,
  CheckoutValidationError,
} from './errors.server';
import {
  generateQuoteFingerprint,
  type FingerprintLineInput,
} from './fingerprint.server';

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

export interface PrepareCheckoutQuoteOptions {
  now?: Date;
  signal?: AbortSignal;
}

function normalizeFlavour(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function formatSlotLabel(slot: string): string {
  switch (slot.toLowerCase()) {
    case 'cheese':
      return 'Keju (Cheese)';
    case 'choco':
      return 'Cokelat (Choco)';
    default:
      return slot.charAt(0).toUpperCase() + slot.slice(1);
  }
}

/**
 * Pure server-side quote generator and validator (PRD §8, §15, §27.2–27.3).
 *
 * Guarantees:
 * - Read-only: strictly NO order insertion, NO history update, NO stock mutation.
 * - Single source of truth: all prices, availability, and branch contacts come from DB.
 * - Two-step canonical quote verification via SHA-256 fingerprint.
 */
export async function prepareCheckoutQuote(
  payload: CheckoutPrepareRequest,
  options: PrepareCheckoutQuoteOptions = {},
): Promise<CheckoutPrepareResponse> {
  const now = options.now ?? new Date();

  // 1. Fetch and validate branch
  let branches;
  try {
    branches = await readActiveBranches(options.signal);
  } catch (err) {
    throw new CheckoutUpstreamError(
      err instanceof Error ? err.message : CHECKOUT_COPY.ERROR_UPSTREAM,
    );
  }

  const branch = branches.find((b) => b.id === payload.branchId);
  if (!branch) {
    throw new CheckoutBranchNotFoundError();
  }

  const formattedWaNumber = formatWhatsappDigits(branch.whatsapp_number);

  // 2. Fetch requested variants
  const variantIds = [...new Set(payload.items.map((i) => i.variantId))];
  let rawVariants;
  try {
    rawVariants = await readCartVariantsByIds(variantIds, options.signal);
  } catch (err) {
    throw new CheckoutUpstreamError(
      err instanceof Error ? err.message : CHECKOUT_COPY.ERROR_UPSTREAM,
    );
  }

  const variantMap = new Map(rawVariants.map((v) => [v.id, v]));

  // 3. Collect component variant IDs for bundle and option checks
  const componentVariantIds = new Set<string>();
  for (const variant of rawVariants) {
    for (const fc of variant.bundle_fixed_components ?? []) {
      if (fc.component_variant_id) {
        componentVariantIds.add(fc.component_variant_id);
      }
    }
    for (const group of variant.option_groups ?? []) {
      for (const choice of group.option_choices ?? []) {
        if (choice.component_variant_id) {
          componentVariantIds.add(choice.component_variant_id);
        }
      }
    }
  }

  const rawComponentVariants =
    componentVariantIds.size > 0
      ? await readComponentVariantsByIds(
          Array.from(componentVariantIds),
          options.signal,
        ).catch((err) => {
          throw new CheckoutUpstreamError(
            err instanceof Error ? err.message : CHECKOUT_COPY.ERROR_UPSTREAM,
          );
        })
      : [];
  const componentVariantMap = new Map(
    rawComponentVariants.map((c) => [c.id, c]),
  );

  // 4. Fetch active catalog promotions
  let rawPromotions;
  try {
    rawPromotions = await readActiveCatalogPromotions(options.signal);
  } catch (err) {
    throw new CheckoutUpstreamError(
      err instanceof Error ? err.message : CHECKOUT_COPY.ERROR_UPSTREAM,
    );
  }

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

  // 5. Validate each requested item
  let hasUnconfirmedStock = false;

  interface ProcessedLineMeta {
    item: (typeof payload.items)[number];
    variant: (typeof rawVariants)[number];
    product: NonNullable<(typeof rawVariants)[number]['products']>;
    offer: (typeof rawVariants)[number]['branch_variant_offers'][number];
    unitGrossIdr: number;
    basePriceIdr: number;
    priceOverrideIdr: number | null;
    selectedOptionDeltasIdr: number[];
    options: Array<{
      choiceId: string;
      label: string;
      priceDeltaIdr: number;
    }>;
    bundleBreakdown?: BundleBreakdownItem[];
    categoryIds: string[];
  }

  const processedLines: ProcessedLineMeta[] = [];

  for (const item of payload.items) {
    const variant = variantMap.get(item.variantId);
    if (!variant) {
      throw new CheckoutItemUnavailableError(
        CHECKOUT_COPY.ERROR_ITEM_NOT_OFFERED,
      );
    }

    if (variant.status === 'archived' || variant.status === 'draft') {
      throw new CheckoutItemUnavailableError(
        CHECKOUT_COPY.ERROR_ITEM_NOT_OFFERED,
      );
    }

    const product = variant.products;
    if (!product || product.status !== 'published') {
      throw new CheckoutItemUnavailableError(
        CHECKOUT_COPY.ERROR_ITEM_NOT_OFFERED,
      );
    }

    // Branch offer check
    const offer = variant.branch_variant_offers?.find(
      (o) => o.branch_id === branch.id && o.is_listed,
    );
    if (!offer) {
      throw new CheckoutItemUnavailableError(
        CHECKOUT_COPY.ERROR_ITEM_NOT_OFFERED,
      );
    }

    if (
      offer.availability_status === 'sold_out' ||
      (offer.stock_quantity !== null && offer.stock_quantity <= 0)
    ) {
      throw new CheckoutStockChangedError(CHECKOUT_COPY.ERROR_ITEM_SOLDOUT);
    }

    if (offer.stock_quantity !== null && offer.stock_quantity < item.quantity) {
      throw new CheckoutStockChangedError(CHECKOUT_COPY.ERROR_ITEM_SOLDOUT);
    }

    if (offer.availability_status === 'unconfirmed') {
      hasUnconfirmedStock = true;
    }

    const isBundle =
      variant.bundle_recipe === 'chiffon_mix' ||
      (variant.bundle_units_total !== null && variant.bundle_units_total > 0);

    const selectedOptions: Array<{
      choiceId: string;
      label: string;
      priceDeltaIdr: number;
    }> = [];
    const selectedOptionDeltasIdr: number[] = [];
    let bundleBreakdown: BundleBreakdownItem[] | undefined;

    if (isBundle) {
      if (!variant.bundle_rules_verified) {
        throw new CheckoutValidationError(CHECKOUT_COPY.ERROR_BUNDLE_INVALID);
      }

      bundleBreakdown = [];
      const fixedFlavourSet = new Set<string>();
      let fixedUnitsTotal = 0;

      // Validate fixed components
      for (const fc of variant.bundle_fixed_components ?? []) {
        fixedUnitsTotal += fc.quantity;
        const comp = fc.component_variant_id
          ? componentVariantMap.get(fc.component_variant_id)
          : null;
        const compOffer = comp?.branch_variant_offers?.find(
          (o) => o.branch_id === branch.id && o.is_listed,
        );

        if (!compOffer) {
          throw new CheckoutItemUnavailableError(
            `Komponen paket "${comp?.name ?? fc.component_slot}" tidak ditawarkan di cabang terpilih.`,
          );
        }

        if (
          compOffer.availability_status === 'sold_out' ||
          (compOffer.stock_quantity !== null && compOffer.stock_quantity <= 0)
        ) {
          throw new CheckoutStockChangedError(
            `Komponen paket "${comp?.name ?? fc.component_slot}" sedang habis di cabang terpilih.`,
          );
        }

        const slotNorm = normalizeFlavour(fc.component_slot);
        fixedFlavourSet.add(slotNorm);
        if (slotNorm.includes('cheese')) {
          fixedFlavourSet.add('cheese');
          fixedFlavourSet.add('keju');
        }
        if (slotNorm.includes('choco')) {
          fixedFlavourSet.add('choco');
          fixedFlavourSet.add('cokelat');
        }

        const compLabel = comp?.name ?? formatSlotLabel(fc.component_slot);
        bundleBreakdown.push({
          slotOrGroup: fc.component_slot,
          label: compLabel,
          quantity: fc.quantity,
          priceDeltaIdr: 0,
          componentVariantId: fc.component_variant_id,
          isFixed: true,
        });
      }

      // Check duplicate choices in request
      const seenChoiceIds = new Set<string>();
      for (const cid of item.choiceIds) {
        if (seenChoiceIds.has(cid)) {
          throw new CheckoutValidationError(
            'Pilihan rasa tidak boleh dipilih lebih dari sekali.',
          );
        }
        seenChoiceIds.add(cid);
      }

      // Map variant option groups
      const choiceMap = new Map<
        string,
        {
          choice: NonNullable<
            NonNullable<
              (typeof variant.option_groups)[number]['option_choices']
            >[number]
          >;
          group: (typeof variant.option_groups)[number];
        }
      >();

      for (const grp of variant.option_groups ?? []) {
        for (const ch of grp.option_choices ?? []) {
          choiceMap.set(ch.id, { choice: ch, group: grp });
        }
      }

      const selectedFlavourSet = new Set<string>();
      let flexibleUnitsTotal = 0;

      for (const choiceId of item.choiceIds) {
        const lookup = choiceMap.get(choiceId);
        if (!lookup) {
          throw new CheckoutValidationError(
            'Pilihan rasa tidak ditemukan pada paket ini.',
          );
        }

        const { choice, group } = lookup;
        if (choice.is_active === false) {
          throw new CheckoutStockChangedError(
            `Pilihan rasa "${choice.label}" sedang dinonaktifkan.`,
          );
        }

        // Distinct flavour check
        const choiceNorm = normalizeFlavour(choice.label);
        const matchesFixed =
          fixedFlavourSet.has(choiceNorm) ||
          choiceNorm.includes('cheese') ||
          choiceNorm.includes('keju') ||
          choiceNorm.includes('choco') ||
          choiceNorm.includes('cokelat');

        if (matchesFixed || selectedFlavourSet.has(choiceNorm)) {
          throw new CheckoutValidationError(
            `Pilihan rasa "${choice.label}" menduplikasi rasa lain pada paket. Seluruh rasa harus berbeda.`,
          );
        }
        selectedFlavourSet.add(choiceNorm);

        // Component availability in branch
        if (choice.component_variant_id) {
          const comp = componentVariantMap.get(choice.component_variant_id);
          const compOffer = comp?.branch_variant_offers?.find(
            (o) => o.branch_id === branch.id && o.is_listed,
          );

          if (!compOffer) {
            throw new CheckoutItemUnavailableError(
              `Pilihan rasa "${choice.label}" tidak ditawarkan di cabang terpilih.`,
            );
          }

          if (
            compOffer.availability_status === 'sold_out' ||
            (compOffer.stock_quantity !== null && compOffer.stock_quantity <= 0)
          ) {
            throw new CheckoutStockChangedError(
              `Pilihan rasa "${choice.label}" sedang habis di cabang terpilih.`,
            );
          }
        }

        const qtyPerSelection = group.quantity_per_selection ?? 3;
        flexibleUnitsTotal += qtyPerSelection;
        selectedOptionDeltasIdr.push(choice.price_delta_idr);

        selectedOptions.push({
          choiceId: choice.id,
          label: choice.label,
          priceDeltaIdr: choice.price_delta_idr,
        });

        bundleBreakdown.push({
          slotOrGroup: group.name,
          label: choice.label,
          quantity: qtyPerSelection,
          priceDeltaIdr: choice.price_delta_idr,
          componentVariantId: choice.component_variant_id,
          isFixed: false,
        });
      }

      // Check sum of units equals total target (12 slices)
      const targetUnitsTotal = variant.bundle_units_total ?? 12;
      const totalUnits = fixedUnitsTotal + flexibleUnitsTotal;
      if (totalUnits !== targetUnitsTotal) {
        throw new CheckoutValidationError(CHECKOUT_COPY.ERROR_BUNDLE_INVALID);
      }
    } else if (item.choiceIds.length > 0) {
      // Non-bundle variant options
      const choiceMap = new Map<
        string,
        NonNullable<
          NonNullable<
            (typeof variant.option_groups)[number]['option_choices']
          >[number]
        >
      >();
      for (const grp of variant.option_groups ?? []) {
        for (const ch of grp.option_choices ?? []) {
          choiceMap.set(ch.id, ch);
        }
      }

      const seenChoiceIds = new Set<string>();
      for (const choiceId of item.choiceIds) {
        if (seenChoiceIds.has(choiceId)) {
          throw new CheckoutValidationError(
            'Pilihan tidak boleh dipilih lebih dari sekali.',
          );
        }
        seenChoiceIds.add(choiceId);

        const choice = choiceMap.get(choiceId);
        if (!choice) {
          throw new CheckoutValidationError('Pilihan opsi tidak valid.');
        }

        if (choice.is_active === false) {
          throw new CheckoutStockChangedError(
            `Pilihan "${choice.label}" sedang tidak tersedia.`,
          );
        }

        if (choice.component_variant_id) {
          const comp = componentVariantMap.get(choice.component_variant_id);
          const compOffer = comp?.branch_variant_offers?.find(
            (o) => o.branch_id === branch.id && o.is_listed,
          );

          if (!compOffer) {
            throw new CheckoutItemUnavailableError(
              `Pilihan "${choice.label}" tidak ditawarkan di cabang terpilih.`,
            );
          }

          if (
            compOffer.availability_status === 'sold_out' ||
            (compOffer.stock_quantity !== null && compOffer.stock_quantity <= 0)
          ) {
            throw new CheckoutStockChangedError(
              `Pilihan "${choice.label}" sedang habis di cabang terpilih.`,
            );
          }
        }

        selectedOptionDeltasIdr.push(choice.price_delta_idr);
        selectedOptions.push({
          choiceId: choice.id,
          label: choice.label,
          priceDeltaIdr: choice.price_delta_idr,
        });
      }
    }

    const basePriceIdr = variant.base_price_idr;
    const priceOverrideIdr = offer.price_override_idr;
    const baseOrOverride = priceOverrideIdr ?? basePriceIdr;
    const deltasSum = selectedOptionDeltasIdr.reduce((a, b) => a + b, 0);
    const unitGrossIdr = baseOrOverride + deltasSum;

    const categoryIds =
      product.product_categories?.map((c) => c.category_id) ?? [];

    processedLines.push({
      item,
      variant,
      product,
      offer,
      unitGrossIdr,
      basePriceIdr,
      priceOverrideIdr,
      selectedOptionDeltasIdr,
      options: selectedOptions,
      bundleBreakdown,
      categoryIds,
    });
  }

  // 6. Evaluate promotions with safe integer calculation
  const pricingLines: CartPricingLineInput[] = processedLines.map((p, idx) => ({
    lineId: `line-${idx}`,
    productId: p.product.id,
    variantId: p.variant.id,
    categoryIds: p.categoryIds,
    basePriceIdr: p.basePriceIdr,
    priceOverrideIdr: p.priceOverrideIdr,
    selectedOptionDeltasIdr: p.selectedOptionDeltasIdr,
    quantity: p.item.quantity,
  }));

  const evaluation = evaluateCartPromotions(
    pricingLines,
    promotions,
    branch.id,
    now,
  );

  // 7. Assemble prepared lines
  const lines: CheckoutPrepareLine[] = processedLines.map((p, idx) => {
    const evalLine = evaluation.lines[idx];
    const unitDiscountIdr = evalLine
      ? Math.floor(evalLine.lineDiscountIdr / p.item.quantity)
      : 0;
    const unitPriceIdr = Math.max(0, p.unitGrossIdr - unitDiscountIdr);
    const lineDiscountIdr = evalLine?.lineDiscountIdr ?? 0;
    const lineTotalIdr = evalLine?.lineNetIdr ?? unitPriceIdr * p.item.quantity;

    return {
      variantId: p.variant.id,
      productName: p.product.name,
      variantName: p.variant.name,
      sku: p.variant.sku,
      sizeLabel: p.variant.size_label ?? null,
      quantity: p.item.quantity,
      unitGrossIdr: p.unitGrossIdr,
      unitPriceIdr,
      discountIdr: lineDiscountIdr,
      lineTotalIdr,
      options: p.options,
      ...(p.bundleBreakdown ? { bundleBreakdown: p.bundleBreakdown } : {}),
    };
  });

  // 8. Generate canonical quote fingerprint (PRD §27.3)
  const fingerprintLines: FingerprintLineInput[] = lines.map((l, idx) => {
    const evalLine = evaluation.lines[idx];
    return {
      variantId: l.variantId,
      sku: l.sku,
      quantity: l.quantity,
      unitGrossIdr: l.unitGrossIdr,
      unitPriceIdr: l.unitPriceIdr,
      discountIdr: l.discountIdr,
      lineTotalIdr: l.lineTotalIdr,
      options: l.options.map((o) => ({
        choiceId: o.choiceId,
        priceDeltaIdr: o.priceDeltaIdr,
      })),
      appliedPromotionId: evalLine?.appliedPromotion?.id ?? null,
    };
  });

  const quoteFingerprint = generateQuoteFingerprint({
    branchId: branch.id,
    whatsappNumber: formattedWaNumber,
    lines: fingerprintLines,
    subtotalIdr: evaluation.subtotalGrossIdr,
    discountIdr: evaluation.discountTotalIdr,
    estimatedTotalIdr: evaluation.totalEstimateIdr,
  });

  // 9. Evaluate two-step review condition and warnings
  const warnings: Array<{ code: string; message: string }> = [];
  warnings.push({
    code: CHECKOUT_WARNING_CODES.MANUAL_CONFIRMATION_REQUIRED,
    message: CHECKOUT_COPY.WARNING_MANUAL_CONFIRMATION,
  });

  if (hasUnconfirmedStock) {
    warnings.push({
      code: CHECKOUT_WARNING_CODES.UNCONFIRMED_STOCK,
      message: CHECKOUT_COPY.WARNING_UNCONFIRMED_STOCK,
    });
  }

  let requiresReview = false;
  if (!payload.expectedQuoteFingerprint) {
    requiresReview = true;
  } else if (payload.expectedQuoteFingerprint === quoteFingerprint) {
    requiresReview = false;
  } else {
    requiresReview = true;
    warnings.push({
      code: CHECKOUT_WARNING_CODES.PRICE_CHANGED,
      message: CHECKOUT_COPY.WARNING_PRICE_CHANGED,
    });
  }

  // 10. Compose WhatsApp message and URL
  const messagePreview = composeWhatsAppMessage({
    branchName: branch.name,
    lines,
    subtotalIdr: evaluation.subtotalGrossIdr,
    discountIdr: evaluation.discountTotalIdr,
    estimatedTotalIdr: evaluation.totalEstimateIdr,
    customerName: payload.customerName,
    fulfillmentMethod: payload.fulfillment.method,
    requestedDate: payload.fulfillment.requestedDate,
    requestedTimeWindow: payload.fulfillment.requestedTimeWindow,
    deliveryAddress: payload.fulfillment.address,
    note: payload.fulfillment.note,
  });

  const { whatsappUrl, requiresCopy } = buildWhatsAppUrl(
    branch.whatsapp_number,
    messagePreview,
  );

  const quotedAt = now.toISOString();
  const expiresAt = new Date(
    now.getTime() + CHECKOUT_LIMITS.QUOTE_TTL_MS,
  ).toISOString();

  const responsePayload: CheckoutPrepareResponse = {
    branch: {
      id: branch.id,
      name: branch.name,
      whatsappNumber: formattedWaNumber,
    },
    lines,
    subtotalIdr: evaluation.subtotalGrossIdr,
    discountIdr: evaluation.discountTotalIdr,
    estimatedTotalIdr: evaluation.totalEstimateIdr,
    shippingFee: 'to_be_confirmed',
    warnings,
    quoteFingerprint,
    quotedAt,
    expiresAt,
    requiresReview,
    requiresCopy,
    whatsappUrl,
    messagePreview,
  };

  return checkoutPrepareResponseSchema.parse(responsePayload);
}
