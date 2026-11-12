import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});
import { BundleCustomizer } from '@/components/catalog/bundle-customizer';
import { ProductVariantPicker } from '@/components/catalog/product-variant-picker';
import { validateBundleConfiguration } from '@/features/catalog/bundle';
import type { ProductDetail, ProductDetailVariant } from '@/types/catalog';

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
        },
      },
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

function createMockBundleProduct(variant: ProductDetailVariant): ProductDetail {
  return {
    id: 'f0400000-0000-4000-8000-000000000402',
    name: 'DEMO — Chiffon Slice Mix',
    slug: 'demo-mix',
    shortDescription: 'Paket 12 slices dengan 4 varian rasa.',
    description: 'Chiffon Slice Mix 12 potong.',
    ingredientsInfo: 'Tepung terigu, telur, susu, keju, cokelat.',
    storageInstructions: 'Simpan di kulkas maksimal 3 hari.',
    productType: 'bundle',
    isFeatured: true,
    isBestSeller: true,
    isNew: false,
    primaryCategory: {
      id: 'f0400000-0000-4000-8000-000000000200',
      name: 'Chiffon Series',
      slug: 'chiffon-series',
    },
    categories: [],
    images: [],
    resolvedBranchId: 'f0400000-0000-4000-8000-000000000001',
    resolvedBranchCode: 'surabaya',
    activeVariantCount: 1,
    offeredVariants: [variant],
    relatedProducts: [],
  };
}

describe('BundleCustomizer DOM Component', () => {
  it('renders fixed components breakdown (Cheese 3 pcs + Choco 3 pcs) with non-editable badges', () => {
    const variant = createMockBundleVariant();
    const validationResult = validateBundleConfiguration({
      variant,
      selectedChoiceIds: [],
    });

    render(
      <BundleCustomizer
        variant={variant}
        selectedChoiceIds={[]}
        onSelectChoice={vi.fn()}
        validationResult={validationResult}
      />,
    );

    expect(screen.getByText(/Cheese Chiffon/i)).toBeInTheDocument();
    expect(screen.getByText(/Choco Chiffon/i)).toBeInTheDocument();
    expect(screen.getAllByText(/3 potong tetap/i)).toHaveLength(2);
    expect(screen.getAllByText('Termasuk')).toHaveLength(2);
  });

  it('renders selectable option groups with options, labels, and price deltas', () => {
    const variant = createMockBundleVariant();
    const validationResult = validateBundleConfiguration({
      variant,
      selectedChoiceIds: [],
    });

    render(
      <BundleCustomizer
        variant={variant}
        selectedChoiceIds={[]}
        onSelectChoice={vi.fn()}
        validationResult={validationResult}
      />,
    );

    expect(screen.getByText('DEMO C — Regular')).toBeInTheDocument();
    expect(screen.getByText('DEMO D — Regular')).toBeInTheDocument();
    expect(screen.getByText('DEMO — Pandan')).toBeInTheDocument();
    expect(screen.getByText('DEMO — Taro Premium')).toBeInTheDocument();
    expect(screen.getByText('+Rp5.000')).toBeInTheDocument();
    expect(screen.getByText('DEMO — Vanilla')).toBeInTheDocument();
  });

  it('shows missing choices warning when incomplete (less than 2 choices)', () => {
    const variant = createMockBundleVariant();
    const validationResult = validateBundleConfiguration({
      variant,
      selectedChoiceIds: ['choice-pandan-id'],
    });

    render(
      <BundleCustomizer
        variant={variant}
        selectedChoiceIds={['choice-pandan-id']}
        onSelectChoice={vi.fn()}
        validationResult={validationResult}
      />,
    );

    expect(
      screen.getByText(/Silakan pilih 1 rasa lagi untuk melengkapi 12 potong/i),
    ).toBeInTheDocument();
  });

  it('displays validation errors when duplicate flavour is selected', () => {
    const variant = createMockBundleVariant();
    // Force an invalid duplicate flavour validation result
    const validationResult = validateBundleConfiguration({
      variant,
      selectedChoiceIds: ['choice-pandan-id', 'choice-pandan-id'],
    });

    render(
      <BundleCustomizer
        variant={variant}
        selectedChoiceIds={['choice-pandan-id', 'choice-pandan-id']}
        onSelectChoice={vi.fn()}
        validationResult={validationResult}
      />,
    );

    expect(
      screen.getByText(/Perhatian Konfigurasi Paket:/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Pilihan yang sama tidak dapat dipilih lebih dari satu kali/i,
      ),
    ).toBeInTheDocument();
  });
});

describe('ProductVariantPicker Bundle Integration', () => {
  it('integrates BundleCustomizer in ProductVariantPicker, enables CTA only when 12 slices configured, and prepares cart payload', () => {
    const variant = createMockBundleVariant();
    const product = createMockBundleProduct(variant);
    const onPrepareCart = vi.fn();

    const { rerender } = render(
      <ProductVariantPicker
        product={product}
        selectedVariant={variant}
        onSelectVariant={vi.fn()}
        quantity={1}
        onChangeQuantity={vi.fn()}
        hasBranchSelected={true}
        onPrepareCart={onPrepareCart}
        preparedPayload={null}
      />,
    );

    // Initial state: 0 choices selected, CTA disabled
    const prepareButton = screen.getByRole('button', {
      name: /Siapkan untuk Keranjang/i,
    });
    expect(prepareButton).toBeDisabled();

    // User selects Pandan from Group C
    const pandanBtn = screen.getByRole('radio', { name: /DEMO — Pandan/i });
    fireEvent.click(pandanBtn);

    // Still disabled because Group D is not selected
    expect(prepareButton).toBeDisabled();

    // User selects Vanilla from Group D
    const vanillaBtn = screen.getByRole('radio', { name: /DEMO — Vanilla/i });
    fireEvent.click(vanillaBtn);

    // Now complete (12 slices: 6 fixed + 6 chosen) -> CTA is enabled!
    expect(prepareButton).not.toBeDisabled();

    // Click CTA
    fireEvent.click(prepareButton);
    expect(onPrepareCart).toHaveBeenCalledTimes(1);

    const callArg = onPrepareCart.mock.calls[0][0];
    expect(callArg.choiceIds).toContain('choice-pandan-id');
    expect(callArg.choiceIds).toContain('choice-vanilla-id');
    expect(callArg.bundleSignature).toContain(variant.id);
    expect(callArg.bundleBreakdown).toHaveLength(4);
    expect(callArg.unitPriceIdr).toBe(180_000);

    // Rerender with prepared payload to verify feedback breakdown display
    rerender(
      <ProductVariantPicker
        product={product}
        selectedVariant={variant}
        onSelectVariant={vi.fn()}
        quantity={1}
        onChangeQuantity={vi.fn()}
        hasBranchSelected={true}
        onPrepareCart={onPrepareCart}
        preparedPayload={{
          branchId: 'f0400000-0000-4000-8000-000000000001',
          branchCode: 'surabaya',
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          productType: 'bundle',
          variantId: variant.id,
          sku: variant.sku,
          variantName: variant.name,
          sizeLabel: variant.sizeLabel,
          quantity: 1,
          choiceIds: ['choice-pandan-id', 'choice-vanilla-id'],
          bundleSignature: callArg.bundleSignature,
          bundleBreakdown: callArg.bundleBreakdown,
          estimatedUnitPriceIdr: 180_000,
          estimatedSubtotalIdr: 180_000,
        }}
      />,
    );

    expect(screen.getByText(/Komposisi 12 Potong:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Pilihan varian siap untuk keranjang/i),
    ).toBeInTheDocument();
  });
});
