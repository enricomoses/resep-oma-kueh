import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PRODUCT_DETAIL_COPY } from '@/constants/catalog.constant';
import type { PublicBranch } from '@/types/branch';

const syntheticBranches: PublicBranch[] = [
  {
    id: 'f0400000-0000-4000-8000-000000000001',
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    whatsappNumber: '6281703384308',
    address: 'Rungkut Asri Tengah V No. 22, Surabaya',
    mapsUrl: null,
  },
  {
    id: 'f0400000-0000-4000-8000-000000000002',
    code: 'bintaro',
    name: 'Bintaro',
    city: 'Bintaro',
    whatsappNumber: '6285119785194',
    address: null,
    mapsUrl: null,
  },
];

const syntheticMixDetail = (branch: string | null) => {
  const resolvedBranchId =
    syntheticBranches.find((b) => b.code === branch)?.id ?? null;

  return {
    id: 'f0400000-0000-4000-8000-000000000402',
    name: 'DEMO — Chiffon Slice Mix',
    slug: 'demo-mix',
    shortDescription: 'Paket 12 slices dengan 4 varian rasa.',
    description: 'Chiffon Slice Mix isi 12 potong.',
    ingredientsInfo: 'Tepung terigu, telur, susu, keju cheddar, cokelat.',
    storageInstructions: 'Simpan di lemari es maksimal 3 hari.',
    productType: 'bundle' as const,
    isFeatured: true,
    isBestSeller: true,
    isNew: false,
    primaryCategory: {
      id: 'f0400000-0000-4000-8000-000000000200',
      name: 'DEMO — Chiffon Series',
      slug: 'demo-chiffon-series',
    },
    categories: [
      {
        id: 'f0400000-0000-4000-8000-000000000200',
        name: 'DEMO — Chiffon Series',
        slug: 'demo-chiffon-series',
        isPrimary: true,
      },
    ],
    images: [
      {
        id: 'f0400000-0000-4000-8000-000000000520',
        variantId: null,
        altText: 'DEMO — foto Chiffon Slice Mix',
        isPrimary: true,
        sortOrder: 0,
        publicUrl: null,
      },
    ],
    resolvedBranchId,
    resolvedBranchCode: branch,
    activeVariantCount: 2,
    offeredVariants: resolvedBranchId
      ? [
          {
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
            availabilityStatus: 'available' as const,
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
                id: 'f0400000-0000-4000-8000-000000000820',
                componentSlot: 'cheese',
                componentVariantId: 'f0400000-0000-4000-8000-000000000607',
                quantity: 3,
                sortOrder: 0,
                componentVariant: {
                  id: 'f0400000-0000-4000-8000-000000000607',
                  sku: 'DEMO-F04-7',
                  name: 'Cheese Chiffon Slice',
                  productId: 'f0400000-0000-4000-8000-000000000403',
                  availabilityStatus: 'available' as const,
                  stockQuantity: null,
                  isOfferedInBranch: true,
                  verifiedDietaryTags: [],
                },
              },
              {
                id: 'f0400000-0000-4000-8000-000000000821',
                componentSlot: 'choco',
                componentVariantId: 'f0400000-0000-4000-8000-000000000609',
                quantity: 3,
                sortOrder: 1,
                componentVariant: {
                  id: 'f0400000-0000-4000-8000-000000000609',
                  sku: 'DEMO-F04-9',
                  name: 'Choco Chiffon Slice',
                  productId: 'f0400000-0000-4000-8000-000000000404',
                  availabilityStatus: 'available' as const,
                  stockQuantity: null,
                  isOfferedInBranch: true,
                  verifiedDietaryTags: [],
                },
              },
            ],
            optionGroups: [
              {
                id: 'f0400000-0000-4000-8000-000000000800',
                name: 'DEMO C — Regular',
                minSelect: 1,
                maxSelect: 1,
                quantityPerSelection: 3,
                isRequired: true,
                sortOrder: 0,
                choices: [
                  {
                    id: 'f0400000-0000-4000-8000-000000000810',
                    label: 'DEMO — Pandan',
                    priceDeltaIdr: 0,
                    componentVariantId: 'f0400000-0000-4000-8000-000000000611',
                    isActive: true,
                    sortOrder: 0,
                    componentVariant: {
                      id: 'f0400000-0000-4000-8000-000000000611',
                      sku: 'DEMO-F04-11',
                      name: 'Pandan Chiffon Slice',
                      productId: 'f0400000-0000-4000-8000-000000000405',
                      availabilityStatus: 'available' as const,
                      stockQuantity: null,
                      isOfferedInBranch: true,
                      verifiedDietaryTags: [],
                    },
                  },
                ],
              },
              {
                id: 'f0400000-0000-4000-8000-000000000801',
                name: 'DEMO D — Regular',
                minSelect: 1,
                maxSelect: 1,
                quantityPerSelection: 3,
                isRequired: true,
                sortOrder: 1,
                choices: [
                  {
                    id: 'f0400000-0000-4000-8000-000000000811',
                    label: 'DEMO — Vanilla',
                    priceDeltaIdr: 0,
                    componentVariantId: 'f0400000-0000-4000-8000-000000000613',
                    isActive: true,
                    sortOrder: 0,
                    componentVariant: {
                      id: 'f0400000-0000-4000-8000-000000000613',
                      sku: 'DEMO-F04-13',
                      name: 'Vanilla Chiffon Slice',
                      productId: 'f0400000-0000-4000-8000-000000000406',
                      availabilityStatus: 'available' as const,
                      stockQuantity: null,
                      isOfferedInBranch: true,
                      verifiedDietaryTags: [],
                    },
                  },
                ],
              },
            ],
          },
        ]
      : [],
    relatedProducts: [],
  };
};

test.beforeEach(async ({ page, request }) => {
  if (process.env.BAKERY_SITE_LOCAL === '1') {
    const response = await request.get('/api/branches');
    expect(response.status()).toBe(200);
  } else {
    await page.route('**/api/branches**', (route) => {
      const code = new URL(route.request().url()).searchParams.get('branch');
      return route.fulfill({
        json: {
          ok: true,
          data: {
            items: syntheticBranches,
            resolvedBranchId:
              syntheticBranches.find((b) => b.code === code)?.id ?? null,
          },
          requestId: 'e2e-branches-bundle',
        },
      });
    });

    await page.route('**/api/products/demo-mix**', (route) => {
      const url = new URL(route.request().url());
      const branchParam = url.searchParams.get('branch');
      return route.fulfill({
        json: {
          ok: true,
          data: syntheticMixDetail(branchParam),
          requestId: 'e2e-detail-bundle',
        },
      });
    });
  }
});

test.describe('Chiffon Slice Mix Bundle Configurator (F11 / R11)', () => {
  test('renders 12-slice bundle customizer with 2 fixed flavours + 2 flexible groups and enables Add CTA upon completion', async ({
    page,
  }) => {
    await page.goto('/menu/demo-mix?branch=surabaya');

    // Heading verification
    await expect(
      page.getByRole('heading', { level: 1, name: /Chiffon Slice Mix/i }),
    ).toBeVisible();

    // Verify bundle customizer is rendered
    const customizer = page.getByTestId('bundle-customizer');
    await expect(customizer).toBeVisible();

    // Verify fixed components (Cheese 3 slices + Choco 3 slices)
    await expect(page.getByText('Cheese Chiffon Slice')).toBeVisible();
    await expect(page.getByText('Choco Chiffon Slice')).toBeVisible();

    // Verify slices counter initially shows 6 of 12 slices
    await expect(page.getByText(/6 dari 12 potong/i)).toBeVisible();

    // Verify CTA is initially disabled
    const prepareButton = page.getByRole('button', {
      name: PRODUCT_DETAIL_COPY.CTA_PREPARE_CART,
    });
    await expect(prepareButton).toBeDisabled();

    // Select choice from Group C: DEMO — Pandan
    const pandanBtn = page.getByRole('radio', { name: /DEMO — Pandan/i });
    await pandanBtn.click();

    // Slices counter updates to 9 of 12
    await expect(page.getByText(/9 dari 12 potong/i)).toBeVisible();
    await expect(prepareButton).toBeDisabled();

    // Select choice from Group D: DEMO — Vanilla
    const vanillaBtn = page.getByRole('radio', { name: /DEMO — Vanilla/i });
    await vanillaBtn.click();

    // Slices counter updates to 12 of 12 potong!
    await expect(page.getByText(/12 dari 12 potong/i)).toBeVisible();
    await expect(prepareButton).toBeEnabled();

    // Click CTA to prepare cart payload
    await prepareButton.click();

    // Verify feedback banner displays breakdown
    await expect(
      page.getByText(PRODUCT_DETAIL_COPY.CTA_PREPARED_TITLE),
    ).toBeVisible();
    await expect(page.getByText(/Komposisi 12 Potong:/i)).toBeVisible();

    // Accessibility scan with axe-core
    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('.lucide')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('responsive mobile view renders bundle customizer cleanly', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/menu/demo-mix?branch=surabaya');

    await expect(page.getByTestId('bundle-customizer')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: /Chiffon Slice Mix/i }),
    ).toBeVisible();

    // Fixed components are visible
    await expect(page.getByText('Cheese Chiffon Slice')).toBeVisible();
    await expect(page.getByText('Choco Chiffon Slice')).toBeVisible();
  });
});
