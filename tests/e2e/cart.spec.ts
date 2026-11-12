import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { CART_COPY } from '@/constants/cart.constant';
import { PRODUCT_DETAIL_COPY } from '@/constants/catalog.constant';
import { SITE_COPY } from '@/constants/site.constant';
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

const syntheticCoffeeDetail = (branch: string | null) => {
  const resolvedBranchId =
    syntheticBranches.find((b) => b.code === branch)?.id ?? null;

  return {
    id: 'f0400000-0000-4000-8000-000000000400',
    name: 'DEMO — Coffee Chiffon',
    slug: 'demo-coffee',
    shortDescription: 'Chiffon klasik aroma kopi istimewa.',
    description: 'Data sintetis lokal untuk pengujian varian dan harga.',
    ingredientsInfo: 'Tepung beras, telur segar, kopi robusta pilihan, gula.',
    storageInstructions: 'Simpan dalam wadah kedap udara di lemari pendingin.',
    productType: 'variants' as const,
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
        id: 'f0400000-0000-4000-8000-000000000500',
        variantId: null,
        altText: 'DEMO — foto utama Coffee Chiffon',
        isPrimary: true,
        sortOrder: 0,
        publicUrl: null,
      },
    ],
    resolvedBranchId,
    resolvedBranchCode: branch,
    activeVariantCount: 1,
    offeredVariants: resolvedBranchId
      ? [
          {
            id: 'f0400000-0000-4000-8000-000000000601',
            sku: 'DEMO-COFFEE-MINI',
            name: 'Coffee Chiffon Mini 14cm',
            sizeLabel: 'Mini 14cm',
            isDefault: true,
            sortOrder: 0,
            maxQuantityPerOrder: 10,
            bundleRecipe: null,
            bundleUnitsTotal: null,
            bundleRulesVerified: false,
            availabilityStatus: 'available' as const,
            stockQuantity: 5,
            baseOrOverrideIdr: 70_000,
            minOptionDeltaIdr: 0,
            unitGrossIdr: 70_000,
            unconditionalDiscountIdr: 0,
            effectivePriceIdr: 70_000,
            appliedPromotion: null,
            conditionalPromotion: null,
            verifiedDietaryTags: [],
            verifiedAllergens: [],
            optionGroups: [],
            fixedComponents: [],
          },
        ]
      : [],
    relatedProducts: [],
  };
};

test.describe('Shopping Cart Flow (F12 / R06 / R12)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/branches**', (route) => {
      const url = new URL(route.request().url());
      const code = url.searchParams.get('branch');
      return route.fulfill({
        json: {
          ok: true,
          data: {
            items: syntheticBranches,
            resolvedBranchId:
              syntheticBranches.find((b) => b.code === code)?.id ?? null,
          },
          requestId: 'synthetic-branches-req',
        },
      });
    });

    await page.route('**/api/products/**', (route) => {
      const url = new URL(route.request().url());
      const slug = url.pathname.split('/').pop();
      const branch = url.searchParams.get('branch');

      if (slug === 'demo-coffee') {
        return route.fulfill({
          json: {
            ok: true,
            data: syntheticCoffeeDetail(branch),
            requestId: 'synthetic-product-req',
          },
        });
      }

      return route.fulfill({
        status: 404,
        json: {
          ok: false,
          error: { code: 'NOT_FOUND', message: 'Data tidak ditemukan.' },
          requestId: 'synthetic-product-404',
        },
      });
    });

    await page.route('**/api/cart/validate', (route) => {
      return route.fulfill({
        json: {
          ok: true,
          data: {
            branchId: 'f0400000-0000-4000-8000-000000000001',
            branchName: 'Surabaya',
            lines: [
              {
                lineId:
                  'f0400000-0000-4000-8000-000000000001:f0400000-0000-4000-8000-000000000601:',
                variantId: 'f0400000-0000-4000-8000-000000000601',
                productId: 'f0400000-0000-4000-8000-000000000400',
                productName: 'DEMO — Coffee Chiffon',
                productSlug: 'demo-coffee',
                productType: 'variants',
                variantName: 'Coffee Chiffon Mini 14cm',
                sku: 'DEMO-COFFEE-MINI',
                sizeLabel: 'Mini 14cm',
                imageAlt: 'DEMO — foto utama Coffee Chiffon',
                quantity: 1,
                unitGrossIdr: 70_000,
                unconditionalDiscountIdr: 0,
                effectiveUnitPriceIdr: 70_000,
                subtotalIdr: 70_000,
                availabilityStatus: 'available',
                conflict: 'none',
                conflictMessage: null,
                bundleBreakdown: [],
                choiceNames: [],
              },
            ],
            estimatedSubtotalIdr: 70_000,
            totalDiscountIdr: 0,
            estimatedTotalIdr: 70_000,
            hasBlockingConflicts: false,
            hasPriceChanges: false,
          },
          requestId: 'synthetic-cart-validate-req',
        },
      });
    });
  });

  test('persists cart, updates badge, handles branch switch confirmation, and passes accessibility', async ({
    page,
  }) => {
    // 1. Visit product detail with branch Surabaya
    await page.goto('/menu/demo-coffee?branch=surabaya');

    // Heading verification
    await expect(
      page.getByRole('heading', { level: 1, name: /Coffee Chiffon/i }),
    ).toBeVisible();

    // Select available variant (Mini 14cm)
    const miniVariantBtn = page.getByRole('radio', { name: /Mini 14cm/i });
    await miniVariantBtn.click();

    // Verify Add to Cart (Prepare Cart) button is enabled
    const addBtn = page.getByRole('button', {
      name: new RegExp(PRODUCT_DETAIL_COPY.CTA_PREPARE_CART, 'i'),
    });
    await expect(addBtn).toBeEnabled();

    // Click Add to Cart
    await addBtn.click();

    // Verify feedback appears with View Cart link
    await expect(page.getByText(CART_COPY.VIEW_CART)).toBeVisible();

    // Verify Navbar CartBadge updated to 1 item
    const cartBadge = page.locator('.cart-badge');
    await expect(cartBadge).toContainText('1');

    // 2. Click CartBadge to navigate to Cart page
    await cartBadge.click();
    await page.waitForURL(/\/cart/);

    // Verify Cart Page Heading & Branch Pill
    await expect(
      page.getByRole('heading', { level: 1, name: CART_COPY.PAGE_TITLE }),
    ).toBeVisible();
    await expect(page.getByText(/Cabang Pemesanan.*Surabaya/i)).toBeVisible();

    // Verify Item appears in cart
    await expect(page.locator('.cart-item-product-name')).toContainText(
      'Coffee Chiffon',
    );
    await expect(page.locator('.cart-item-variant-label')).toContainText(
      'Mini 14cm',
    );

    // Verify Order Summary
    await expect(page.getByText(CART_COPY.SUMMARY_TITLE)).toBeVisible();
    await expect(page.getByText(CART_COPY.TOTAL_ESTIMATE)).toBeVisible();

    // Verify Checkout button is present
    const checkoutLink = page.getByRole('link', {
      name: new RegExp(CART_COPY.CTA_CHECKOUT),
    });
    await expect(checkoutLink).toBeVisible();

    // 3. Test Branch Switch Conflict Dialog with Non-Empty Cart
    const branchSelect = page.getByRole('combobox');
    await expect(branchSelect).toBeVisible();

    // Attempt to change branch to Bintaro
    await branchSelect.selectOption({ label: 'Bintaro' });

    // Verify Confirmation Dialog opens
    await expect(page.getByText(SITE_COPY.SWITCH_TITLE)).toBeVisible();
    await expect(page.getByText(SITE_COPY.SWITCH_BODY)).toBeVisible();

    // Click Cancel ("Tetap di cabang ini")
    const cancelBtn = page.getByRole('button', { name: SITE_COPY.CANCEL });
    await cancelBtn.click();

    // Dialog closes and item remains in cart
    await expect(page.getByText(SITE_COPY.SWITCH_TITLE)).not.toBeVisible();
    await expect(page.locator('.cart-item-product-name')).toContainText(
      'Coffee Chiffon',
    );

    // 4. Accessibility audit on /cart
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(axeResults.violations).toEqual([]);
  });

  test('displays empty cart state correctly when cart is empty', async ({
    page,
  }) => {
    await page.goto('/cart?branch=surabaya');

    // Verify empty state
    await expect(page.getByText(CART_COPY.EMPTY_TITLE)).toBeVisible();
    await expect(page.getByText(CART_COPY.EMPTY_BODY)).toBeVisible();

    const browseLink = page.getByRole('link', {
      name: new RegExp(CART_COPY.CTA_BROWSE_MENU),
    });
    await expect(browseLink).toBeVisible();
  });

  test('renders cart properly on mobile 375px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/cart?branch=surabaya');

    await expect(page.getByText(CART_COPY.EMPTY_TITLE)).toBeVisible();
    await expect(page.getByText(CART_COPY.EMPTY_BODY)).toBeVisible();
  });
});
