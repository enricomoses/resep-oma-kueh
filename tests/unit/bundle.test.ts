import { describe, expect, it } from 'vitest';
import {
  generateBundleSignature,
  validateBundleConfiguration,
} from '@/features/catalog/bundle';
import type {
  ProductDetailComponentVariantSummary,
  ProductDetailFixedComponent,
  ProductDetailVariant,
} from '@/types/catalog';

function createMockBundleVariant(
  overrides: Partial<ProductDetailVariant> = {},
): ProductDetailVariant {
  return {
    id: 'f0400000-0000-4000-8000-000000000605',
    sku: 'DEMO-F04-5',
    name: 'DEMO — Regular pack 12 slices',
    sizeLabel: 'Pack 12 slices',
    isDefault: true,
    sortOrder: 0,
    maxQuantityPerOrder: 10,
    bundleRecipe: 'chiffon_mix',
    bundleUnitsTotal: 12,
    bundleRulesVerified: true,
    availabilityStatus: 'available',
    stockQuantity: null,
    baseOrOverrideIdr: 180_000,
    minOptionDeltaIdr: 0,
    unitGrossIdr: 180_000,
    unconditionalDiscountIdr: 0,
    effectivePriceIdr: 180_000,
    appliedPromotion: null,
    conditionalPromotion: null,
    verifiedDietaryTags: [],
    verifiedAllergens: [],
    fixedComponents: [
      {
        id: 'fixed-cheese-id',
        componentSlot: 'cheese',
        componentVariantId: 'cheese-variant-id',
        quantity: 3,
        sortOrder: 0,
        componentVariant: {
          id: 'cheese-variant-id',
          sku: 'DEMO-CHEESE',
          name: 'Cheese Chiffon Slice',
          productId: 'cheese-product-id',
          availabilityStatus: 'available',
          stockQuantity: null,
          isOfferedInBranch: true,
          verifiedDietaryTags: [],
        } as ProductDetailComponentVariantSummary,
      } as ProductDetailFixedComponent,
      {
        id: 'fixed-choco-id',
        componentSlot: 'choco',
        componentVariantId: 'choco-variant-id',
        quantity: 3,
        sortOrder: 1,
        componentVariant: {
          id: 'choco-variant-id',
          sku: 'DEMO-CHOCO',
          name: 'Choco Chiffon Slice',
          productId: 'choco-product-id',
          availabilityStatus: 'available',
          stockQuantity: null,
          isOfferedInBranch: true,
          verifiedDietaryTags: [],
        },
      },
    ],
    optionGroups: [
      {
        id: 'group-c-id',
        name: 'DEMO C — Regular',
        minSelect: 1,
        maxSelect: 1,
        quantityPerSelection: 3,
        isRequired: true,
        sortOrder: 0,
        choices: [
          {
            id: 'choice-pandan-id',
            groupId: 'group-c-id',
            label: 'DEMO — Pandan',
            priceDeltaIdr: 0,
            componentVariantId: 'pandan-variant-id',
            isActive: true,
            sortOrder: 0,
            componentVariant: {
              id: 'pandan-variant-id',
              sku: 'DEMO-PANDAN',
              name: 'Pandan Chiffon Slice',
              productId: 'pandan-product-id',
              availabilityStatus: 'available',
              stockQuantity: null,
              isOfferedInBranch: true,
              verifiedDietaryTags: [],
            },
          },
          {
            id: 'choice-taro-id',
            groupId: 'group-c-id',
            label: 'DEMO — Taro Premium',
            priceDeltaIdr: 5_000,
            componentVariantId: 'taro-variant-id',
            isActive: true,
            sortOrder: 1,
            componentVariant: {
              id: 'taro-variant-id',
              sku: 'DEMO-TARO',
              name: 'Taro Chiffon Slice',
              productId: 'taro-product-id',
              availabilityStatus: 'available',
              stockQuantity: null,
              isOfferedInBranch: true,
              verifiedDietaryTags: [],
            },
          },
        ],
      },
      {
        id: 'group-d-id',
        name: 'DEMO D — Regular',
        minSelect: 1,
        maxSelect: 1,
        quantityPerSelection: 3,
        isRequired: true,
        sortOrder: 1,
        choices: [
          {
            id: 'choice-vanilla-id',
            groupId: 'group-d-id',
            label: 'DEMO — Vanilla',
            priceDeltaIdr: 0,
            componentVariantId: 'vanilla-variant-id',
            isActive: true,
            sortOrder: 0,
            componentVariant: {
              id: 'vanilla-variant-id',
              sku: 'DEMO-VANILLA',
              name: 'Vanilla Chiffon Slice',
              productId: 'vanilla-product-id',
              availabilityStatus: 'available',
              stockQuantity: null,
              isOfferedInBranch: true,
              verifiedDietaryTags: [],
            },
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('Pure Bundle Validation (Chiffon Slice Mix R11)', () => {
  it('validates a valid 12-slice configuration (3 Cheese + 3 Choco + 3 Pandan + 3 Vanilla = 12 slices)', () => {
    const variant = createMockBundleVariant();
    const result = validateBundleConfiguration({
      variant,
      selectedChoiceIds: ['choice-pandan-id', 'choice-vanilla-id'],
    });

    expect(result.isValid).toBe(true);
    if (!result.isValid) return;

    expect(result.errors).toHaveLength(0);
    expect(result.bundleUnitsTotal).toBe(12);
    expect(result.baseOrOverrideIdr).toBe(180_000);
    expect(result.choiceDeltasTotalIdr).toBe(0);
    expect(result.unitGrossIdr).toBe(180_000);
    expect(result.effectivePriceIdr).toBe(180_000);

    // 4 Distinct items in breakdown: 2 fixed + 2 flexible
    expect(result.breakdown).toHaveLength(4);
    expect(result.fixedComponents).toHaveLength(2);
    expect(result.selectedChoices).toHaveLength(2);

    // Canonical bundle signature
    expect(result.bundleSignature).toBe(
      'f0400000-0000-4000-8000-000000000605:choice-pandan-id,choice-vanilla-id',
    );
  });

  it('generates a stable deterministic bundleSignature regardless of choice order', () => {
    const sig1 = generateBundleSignature('variant-1', ['choice-b', 'choice-a']);
    const sig2 = generateBundleSignature('variant-1', ['choice-a', 'choice-b']);
    expect(sig1).toBe('variant-1:choice-a,choice-b');
    expect(sig1).toBe(sig2);
  });

  it('rejects unverified bundle variant as draft (PRD §7.4)', () => {
    const variant = createMockBundleVariant({ bundleRulesVerified: false });
    const result = validateBundleConfiguration({
      variant,
      selectedChoiceIds: ['choice-pandan-id', 'choice-vanilla-id'],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'BUNDLE_NOT_VERIFIED')).toBe(
      true,
    );
  });

  it('rejects incomplete selections resulting in != 12 units (e.g. 9 or 11 units)', () => {
    const variant = createMockBundleVariant();
    // Only 1 choice selected: 6 fixed + 3 flexible = 9 units
    const result = validateBundleConfiguration({
      variant,
      selectedChoiceIds: ['choice-pandan-id'],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_TOTAL_UNITS')).toBe(
      true,
    );
    expect(
      result.errors.some((e) => e.code === 'GROUP_SELECTION_COUNT_MISMATCH'),
    ).toBe(true);
  });

  it('rejects excessive selections resulting in != 12 units (e.g. 15 units)', () => {
    const variant = createMockBundleVariant();
    // 3 choices selected: 6 fixed + 3*3 flexible = 15 units
    const result = validateBundleConfiguration({
      variant,
      selectedChoiceIds: [
        'choice-pandan-id',
        'choice-taro-id',
        'choice-vanilla-id',
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_TOTAL_UNITS')).toBe(
      true,
    );
    expect(
      result.errors.some((e) => e.code === 'GROUP_SELECTION_COUNT_MISMATCH'),
    ).toBe(true);
  });

  it('rejects foreign choice ID that does not belong to the variant option groups', () => {
    const variant = createMockBundleVariant();
    const result = validateBundleConfiguration({
      variant,
      selectedChoiceIds: ['choice-pandan-id', 'foreign-choice-999'],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'FOREIGN_CHOICE')).toBe(true);
  });

  it('rejects duplicate selection of the same choice ID', () => {
    const variant = createMockBundleVariant();
    const result = validateBundleConfiguration({
      variant,
      selectedChoiceIds: ['choice-pandan-id', 'choice-pandan-id'],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DUPLICATE_CHOICE')).toBe(true);
  });

  it('rejects inactive / removed choice', () => {
    const variant = createMockBundleVariant();
    variant.optionGroups[0].choices[0].isActive = false;

    const result = validateBundleConfiguration({
      variant,
      selectedChoiceIds: ['choice-pandan-id', 'choice-vanilla-id'],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'CHOICE_INACTIVE')).toBe(true);
  });

  it('enforces the 4 distinct flavours rule: rejects choice that duplicates fixed flavour (Cheese / Choco)', () => {
    const variant = createMockBundleVariant();
    // Add a cheese choice into group C
    variant.optionGroups[0].choices.push({
      id: 'choice-duplicate-cheese',
      groupId: 'group-c-id',
      label: 'Cheese Flavour Duplicate',
      priceDeltaIdr: 0,
      componentVariantId: 'cheese-variant-id', // Same as fixed cheese
      isActive: true,
      sortOrder: 2,
      componentVariant: {
        id: 'cheese-variant-id',
        sku: 'DEMO-CHEESE',
        name: 'Cheese Chiffon Slice',
        productId: 'cheese-product-id',
        availabilityStatus: 'available',
        stockQuantity: null,
        isOfferedInBranch: true,
        verifiedDietaryTags: [],
      },
    });

    const result = validateBundleConfiguration({
      variant,
      selectedChoiceIds: ['choice-duplicate-cheese', 'choice-vanilla-id'],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DUPLICATE_FLAVOUR')).toBe(
      true,
    );
  });

  it('enforces the 4 distinct flavours rule: rejects choices that duplicate each other', () => {
    const variant = createMockBundleVariant();
    // Add Pandan into group D as well, and user selects Pandan from C and Pandan from D
    variant.optionGroups[1].choices.push({
      id: 'choice-pandan-in-d',
      groupId: 'group-d-id',
      label: 'DEMO — Pandan',
      priceDeltaIdr: 0,
      componentVariantId: 'pandan-variant-id',
      isActive: true,
      sortOrder: 1,
      componentVariant: {
        id: 'pandan-variant-id',
        sku: 'DEMO-PANDAN',
        name: 'Pandan Chiffon Slice',
        productId: 'pandan-product-id',
        availabilityStatus: 'available',
        stockQuantity: null,
        isOfferedInBranch: true,
        verifiedDietaryTags: [],
      },
    });

    const result = validateBundleConfiguration({
      variant,
      selectedChoiceIds: ['choice-pandan-id', 'choice-pandan-in-d'],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'DUPLICATE_FLAVOUR')).toBe(
      true,
    );
  });

  it('enforces Gluten-Free integrity: rejects non-verified GF component in GF bundle variant', () => {
    const gfVariant = createMockBundleVariant({
      sku: 'DEMO-F04-6',
      name: 'DEMO — GF pack 12 slices',
      verifiedDietaryTags: [{ slug: 'gluten-free', name: 'Gluten-Free' }],
    });

    // Both fixed components have verified GF
    gfVariant.fixedComponents[0].componentVariant!.verifiedDietaryTags = [
      { slug: 'gluten-free', name: 'Gluten-Free' },
    ];
    gfVariant.fixedComponents[1].componentVariant!.verifiedDietaryTags = [
      { slug: 'gluten-free', name: 'Gluten-Free' },
    ];

    // Choice C has verified GF
    gfVariant.optionGroups[0].choices[0].componentVariant!.verifiedDietaryTags =
      [{ slug: 'gluten-free', name: 'Gluten-Free' }];

    // Choice D does NOT have verified GF
    gfVariant.optionGroups[1].choices[0].componentVariant!.verifiedDietaryTags =
      [];

    const result = validateBundleConfiguration({
      variant: gfVariant,
      selectedChoiceIds: ['choice-pandan-id', 'choice-vanilla-id'],
    });

    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) => e.code === 'GF_UNVERIFIED_COMPONENT'),
    ).toBe(true);
  });

  it('calculates price delta correctly and ensures fixed components are NOT double-billed', () => {
    const variant = createMockBundleVariant({
      baseOrOverrideIdr: 180_000,
    });

    // Select Taro (which adds +Rp5.000) and Vanilla (+Rp0)
    const result = validateBundleConfiguration({
      variant,
      selectedChoiceIds: ['choice-taro-id', 'choice-vanilla-id'],
    });

    expect(result.isValid).toBe(true);
    if (!result.isValid) return;

    expect(result.baseOrOverrideIdr).toBe(180_000);
    expect(result.choiceDeltasTotalIdr).toBe(5_000);
    // Unit gross = 180.000 + 5.000 = 185.000
    // Fixed components are included in base price (0 extra)
    expect(result.unitGrossIdr).toBe(185_000);
    expect(result.effectivePriceIdr).toBe(185_000);

    const fixedBreakdowns = result.breakdown.filter((b) => b.isFixed);
    expect(fixedBreakdowns).toHaveLength(2);
    expect(fixedBreakdowns.every((b) => b.priceDeltaIdr === 0)).toBe(true);
  });

  it('rejects component that is sold_out or not offered in branch', () => {
    const variant = createMockBundleVariant();
    // Choice Vanilla is sold_out
    variant.optionGroups[1].choices[0].componentVariant!.availabilityStatus =
      'sold_out';

    const result = validateBundleConfiguration({
      variant,
      selectedChoiceIds: ['choice-pandan-id', 'choice-vanilla-id'],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'COMPONENT_SOLD_OUT')).toBe(
      true,
    );
  });
});
