import { CATALOG_LIMITS } from '@/constants/catalog.constant';
import type {
  BundleBreakdownItem,
  BundleValidationError,
  BundleValidationResult,
  FixedComponentDetail,
  ProductDetailOptionChoice,
  ProductDetailOptionGroup,
  ProductDetailVariant,
  SelectedChoiceDetail,
} from '@/types/catalog';

export interface ValidateBundleInput {
  variant: ProductDetailVariant;
  selectedChoiceIds: string[];
  branchId?: string | null;
}

/**
 * Generates a deterministic, canonical bundle signature.
 * Choice IDs are sorted alphabetically so order of selection produces the exact same signature.
 */
export function generateBundleSignature(
  variantId: string,
  selectedChoiceIds: string[],
): string {
  const sorted = [...selectedChoiceIds].sort();
  return `${variantId}:${sorted.join(',')}`;
}

function normalizeFlavourIdentifier(choiceOrComponent: {
  label?: string;
  name?: string;
  componentSlot?: string;
  componentVariantId?: string | null;
  componentVariant?: {
    productId?: string | null;
    name?: string;
    sku?: string;
  } | null;
}): string {
  // If product_id is known, that is the primary flavour identity
  if (choiceOrComponent.componentVariant?.productId) {
    return `product:${choiceOrComponent.componentVariant.productId}`;
  }
  // If component_variant_id is known
  if (choiceOrComponent.componentVariantId) {
    return `variant:${choiceOrComponent.componentVariantId}`;
  }
  // Otherwise check slot or label
  if (choiceOrComponent.componentSlot) {
    return `slot:${choiceOrComponent.componentSlot.toLowerCase().trim()}`;
  }
  const raw = choiceOrComponent.label || choiceOrComponent.name || '';
  return `label:${raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()}`;
}

function isGlutenFreeVariant(variant: ProductDetailVariant): boolean {
  if (variant.verifiedDietaryTags.some((t) => t.slug === 'gluten-free')) {
    return true;
  }
  const nameOrSku = `${variant.name} ${variant.sku}`.toUpperCase();
  return nameOrSku.includes('GF') || nameOrSku.includes('GLUTEN-FREE');
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
 * Pure bundle validator enforcing PRD §7.4, §13.5, §27.2, §27.4 invariants:
 * - Chiffon Slice Mix 12 slices
 * - 4 distinct flavours (Cheese 3 + Choco 3 fixed + 2 distinct group choices x 3)
 * - Group constraints (min/max selections, quantity_per_selection)
 * - Active choices only; foreign choices rejected
 * - Gluten-Free recipe requires verified GF for every component
 * - Branch availability checks for components (sold-out or not offered)
 * - Fixed components are NOT double billed
 * - Integer IDR arithmetic with technical caps
 */
export function validateBundleConfiguration({
  variant,
  selectedChoiceIds,
}: ValidateBundleInput): BundleValidationResult {
  const errors: BundleValidationError[] = [];

  const isBundle =
    variant.bundleRecipe === 'chiffon_mix' ||
    (variant.bundleUnitsTotal !== null && variant.bundleUnitsTotal > 0);

  if (!isBundle) {
    errors.push({
      code: 'NOT_A_BUNDLE',
      message: 'Varian ini bukan merupakan paket produk bundle.',
    });
  }

  // PRD §7.4: "Jika rules belum diverifikasi, bundle tetap draft dan tidak aktif di website produksi."
  if (!variant.bundleRulesVerified) {
    errors.push({
      code: 'BUNDLE_NOT_VERIFIED',
      message:
        'Aturan paket bundle belum diverifikasi oleh pemilik toko. Pemesanan belum dibuka.',
    });
  }

  const targetUnitsTotal = variant.bundleUnitsTotal ?? 12;
  const isGFClaimed = isGlutenFreeVariant(variant);

  // Map choices and groups for fast lookup
  const choiceMap = new Map<
    string,
    { choice: ProductDetailOptionChoice; group: ProductDetailOptionGroup }
  >();
  for (const group of variant.optionGroups) {
    for (const choice of group.choices) {
      choiceMap.set(choice.id, { choice, group });
    }
  }

  // 1. Validate fixed components
  const fixedComponents: FixedComponentDetail[] = [];
  const fixedFlavourSet = new Set<string>();
  let fixedUnitsTotal = 0;

  for (const fixed of variant.fixedComponents) {
    fixedUnitsTotal += fixed.quantity;
    const label =
      fixed.componentVariant?.name || formatSlotLabel(fixed.componentSlot);

    fixedComponents.push({
      id: fixed.id,
      slot: fixed.componentSlot,
      variantId: fixed.componentVariantId,
      quantity: fixed.quantity,
      label,
    });

    const fixedFlavourKey = normalizeFlavourIdentifier({
      componentSlot: fixed.componentSlot,
      componentVariantId: fixed.componentVariantId,
      componentVariant: fixed.componentVariant,
    });
    fixedFlavourSet.add(fixedFlavourKey);

    // Also register standard fixed slot keywords to prevent duplicate selections
    if (fixed.componentSlot.toLowerCase() === 'cheese') {
      fixedFlavourSet.add('slot:cheese');
      fixedFlavourSet.add('label:cheese');
      fixedFlavourSet.add('label:keju');
    }
    if (fixed.componentSlot.toLowerCase() === 'choco') {
      fixedFlavourSet.add('slot:choco');
      fixedFlavourSet.add('label:choco');
      fixedFlavourSet.add('label:cokelat');
    }

    // GF check on fixed component
    if (isGFClaimed && fixed.componentVariant) {
      const hasGF = fixed.componentVariant.verifiedDietaryTags?.some(
        (t) => t.slug === 'gluten-free',
      );
      if (!hasGF) {
        errors.push({
          code: 'GF_UNVERIFIED_COMPONENT',
          message: `Komponen tetap "${label}" belum terverifikasi Gluten-Free untuk varian ini.`,
          componentVariantId: fixed.componentVariantId,
        });
      }
    }

    // Branch availability check on fixed component
    if (fixed.componentVariant) {
      if (fixed.componentVariant.availabilityStatus === 'sold_out') {
        errors.push({
          code: 'COMPONENT_SOLD_OUT',
          message: `Komponen tetap "${label}" sedang habis di cabang terpilih.`,
          componentVariantId: fixed.componentVariantId,
        });
      }
      if (fixed.componentVariant.isOfferedInBranch === false) {
        errors.push({
          code: 'COMPONENT_NOT_OFFERED',
          message: `Komponen tetap "${label}" tidak ditawarkan di cabang terpilih.`,
          componentVariantId: fixed.componentVariantId,
        });
      }
    }
  }

  // 2. Validate selected choices
  const seenChoiceIds = new Set<string>();
  const groupSelectionCounts = new Map<string, number>();
  for (const group of variant.optionGroups) {
    groupSelectionCounts.set(group.id, 0);
  }

  const selectedChoices: SelectedChoiceDetail[] = [];
  const selectedFlavourSet = new Set<string>();
  let choiceDeltasTotalIdr = 0;
  let flexibleUnitsTotal = 0;

  for (const choiceId of selectedChoiceIds) {
    // Check duplicates in input
    if (seenChoiceIds.has(choiceId)) {
      errors.push({
        code: 'DUPLICATE_CHOICE',
        message: 'Pilihan yang sama tidak dapat dipilih lebih dari satu kali.',
        choiceId,
      });
      continue;
    }
    seenChoiceIds.add(choiceId);

    const lookup = choiceMap.get(choiceId);
    if (!lookup) {
      errors.push({
        code: 'FOREIGN_CHOICE',
        message: 'Pilihan rasa tidak ditemukan pada opsi varian paket ini.',
        choiceId,
      });
      continue;
    }

    const { choice, group } = lookup;

    // Check choice active status
    if (choice.isActive === false) {
      errors.push({
        code: 'CHOICE_INACTIVE',
        message: `Pilihan rasa "${choice.label}" sedang dinonaktifkan.`,
        choiceId,
        groupId: group.id,
      });
    }

    // Increment group selection counter
    const currentCount = groupSelectionCounts.get(group.id) ?? 0;
    groupSelectionCounts.set(group.id, currentCount + 1);

    const quantityForThisChoice = group.quantityPerSelection;
    flexibleUnitsTotal += quantityForThisChoice;
    choiceDeltasTotalIdr += choice.priceDeltaIdr;

    selectedChoices.push({
      groupId: group.id,
      groupName: group.name,
      choiceId: choice.id,
      label: choice.label,
      quantity: quantityForThisChoice,
      priceDeltaIdr: choice.priceDeltaIdr,
      componentVariantId: choice.componentVariantId,
    });

    // 4 Distinct Flavours check:
    // Check against fixed flavours (Cheese & Choco)
    const choiceFlavourKey = normalizeFlavourIdentifier({
      label: choice.label,
      componentVariantId: choice.componentVariantId,
      componentVariant: choice.componentVariant,
    });

    const choiceLabelLower = choice.label.toLowerCase();
    const isCheeseMatch =
      fixedFlavourSet.has(choiceFlavourKey) ||
      choiceLabelLower.includes('cheese') ||
      choiceLabelLower.includes('keju');
    const isChocoMatch =
      fixedFlavourSet.has(choiceFlavourKey) ||
      choiceLabelLower.includes('choco') ||
      choiceLabelLower.includes('cokelat');

    if (isCheeseMatch || isChocoMatch) {
      errors.push({
        code: 'DUPLICATE_FLAVOUR',
        message: `Pilihan rasa "${choice.label}" menduplikasi rasa tetap paket (Keju atau Cokelat).`,
        choiceId: choice.id,
        groupId: group.id,
      });
    }

    // Check against other selected choices
    if (selectedFlavourSet.has(choiceFlavourKey)) {
      errors.push({
        code: 'DUPLICATE_FLAVOUR',
        message: `Pilihan rasa "${choice.label}" menduplikasi rasa pilihan lainnya. Seluruh rasa harus berbeda.`,
        choiceId: choice.id,
        groupId: group.id,
      });
    }
    selectedFlavourSet.add(choiceFlavourKey);

    // GF check on selected choice component
    if (isGFClaimed && choice.componentVariant) {
      const hasGF = choice.componentVariant.verifiedDietaryTags?.some(
        (t) => t.slug === 'gluten-free',
      );
      if (!hasGF) {
        errors.push({
          code: 'GF_UNVERIFIED_COMPONENT',
          message: `Pilihan rasa "${choice.label}" belum terverifikasi Gluten-Free.`,
          choiceId: choice.id,
          componentVariantId: choice.componentVariantId ?? undefined,
        });
      }
    }

    // Branch availability check on choice component
    if (choice.componentVariant) {
      if (choice.componentVariant.availabilityStatus === 'sold_out') {
        errors.push({
          code: 'COMPONENT_SOLD_OUT',
          message: `Komponen rasa "${choice.label}" sedang habis di cabang terpilih.`,
          choiceId: choice.id,
          componentVariantId: choice.componentVariantId ?? undefined,
        });
      }
      if (choice.componentVariant.isOfferedInBranch === false) {
        errors.push({
          code: 'COMPONENT_NOT_OFFERED',
          message: `Komponen rasa "${choice.label}" tidak ditawarkan di cabang terpilih.`,
          choiceId: choice.id,
          componentVariantId: choice.componentVariantId ?? undefined,
        });
      }
    }
  }

  // 3. Validate group selection bounds (min_select and max_select)
  for (const group of variant.optionGroups) {
    const count = groupSelectionCounts.get(group.id) ?? 0;
    if (count < group.minSelect || count > group.maxSelect) {
      errors.push({
        code: 'GROUP_SELECTION_COUNT_MISMATCH',
        message: `Grup "${group.name}" memerlukan antara ${group.minSelect} dan ${group.maxSelect} pilihan rasa (terpilih: ${count}).`,
        groupId: group.id,
      });
    }
  }

  // 4. Validate total units sum
  const totalUnits = fixedUnitsTotal + flexibleUnitsTotal;
  if (totalUnits !== targetUnitsTotal) {
    errors.push({
      code: 'INVALID_TOTAL_UNITS',
      message: `Total potong kue paket harus tepat ${targetUnitsTotal} potong (terhitung ${totalUnits} potong).`,
    });
  }

  // 5. Pricing calculation:
  // Base price includes fixed components (NOT double-billed).
  // Choice deltas are added.
  const baseOrOverrideIdr = variant.baseOrOverrideIdr;
  const unitGrossIdr = baseOrOverrideIdr + choiceDeltasTotalIdr;

  if (
    !Number.isSafeInteger(unitGrossIdr) ||
    unitGrossIdr > CATALOG_LIMITS.MAX_UNIT_IDR
  ) {
    errors.push({
      code: 'PRICE_EXCEEDS_CAP',
      message: 'Harga unit hasil konfigurasi melebihi batas safe integer IDR.',
    });
  }

  const effectivePriceIdr = Math.max(
    0,
    unitGrossIdr - variant.unconditionalDiscountIdr,
  );

  // 6. Build structured breakdown
  const breakdown: BundleBreakdownItem[] = [];
  for (const fixed of fixedComponents) {
    breakdown.push({
      slotOrGroup: `Tetap: ${formatSlotLabel(fixed.slot)}`,
      label: fixed.label,
      quantity: fixed.quantity,
      priceDeltaIdr: 0, // Fixed components are not billed separately
      componentVariantId: fixed.variantId,
      isFixed: true,
    });
  }
  for (const choice of selectedChoices) {
    breakdown.push({
      slotOrGroup: choice.groupName,
      label: choice.label,
      quantity: choice.quantity,
      priceDeltaIdr: choice.priceDeltaIdr,
      componentVariantId: choice.componentVariantId,
      isFixed: false,
    });
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      variantId: variant.id,
      sku: variant.sku,
      bundleSignature: null,
      bundleUnitsTotal: targetUnitsTotal,
      baseOrOverrideIdr,
      choiceDeltasTotalIdr,
      unitGrossIdr,
      effectivePriceIdr,
      breakdown,
      selectedChoices,
      fixedComponents,
      errors,
    };
  }

  const bundleSignature = generateBundleSignature(
    variant.id,
    selectedChoiceIds,
  );

  return {
    isValid: true,
    variantId: variant.id,
    sku: variant.sku,
    bundleSignature,
    bundleUnitsTotal: targetUnitsTotal,
    baseOrOverrideIdr,
    choiceDeltasTotalIdr,
    unitGrossIdr,
    effectivePriceIdr,
    breakdown,
    selectedChoices,
    fixedComponents,
    errors: [],
  };
}
