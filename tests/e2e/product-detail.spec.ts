import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
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
      {
        id: 'f0400000-0000-4000-8000-000000000501',
        variantId: 'f0400000-0000-4000-8000-000000000600',
        altText: 'DEMO — foto varian Slice',
        isPrimary: false,
        sortOrder: 1,
        publicUrl: null,
      },
    ],
    resolvedBranchId,
    resolvedBranchCode: branch,
    activeVariantCount: 3,
    offeredVariants: resolvedBranchId
      ? [
          {
            id: 'f0400000-0000-4000-8000-000000000600',
            sku: 'DEMO-COFFEE-SLICE',
            name: 'Coffee Chiffon Slice',
            sizeLabel: 'Slice',
            isDefault: true,
            sortOrder: 0,
            maxQuantityPerOrder: 20,
            bundleRecipe: null,
            bundleUnitsTotal: null,
            bundleRulesVerified: false,
            availabilityStatus: 'sold_out' as const,
            stockQuantity: 0,
            baseOrOverrideIdr: 15_000,
            minOptionDeltaIdr: 0,
            unitGrossIdr: 15_000,
            unconditionalDiscountIdr: 0,
            effectivePriceIdr: 15_000,
            appliedPromotion: null,
            conditionalPromotion: null,
            verifiedDietaryTags: [{ slug: 'gluten-free', name: 'Gluten-Free' }],
            verifiedAllergens: [
              {
                slug: 'egg',
                name: 'Telur',
                presence: 'contains' as const,
              },
            ],
            optionGroups: [],
            fixedComponents: [],
          },
          {
            id: 'f0400000-0000-4000-8000-000000000601',
            sku: 'DEMO-COFFEE-MINI',
            name: 'Coffee Chiffon Mini 14cm',
            sizeLabel: 'Mini 14cm',
            isDefault: false,
            sortOrder: 1,
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
  }
});

test('renders product detail in browse mode without branch, switches branch to reveal variants and pricing, and verifies axe WCAG audit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/menu/demo-coffee');
  await page.evaluate(() => document.fonts.ready);

  // Check product title and breadcrumb
  await expect(
    page.getByRole('heading', { level: 1, name: /Coffee Chiffon/ }),
  ).toBeVisible();
  await expect(page.getByText(PRODUCT_DETAIL_COPY.BACK_TO_MENU)).toBeVisible();

  // Without branch: branch notice visible, CTA branch required
  await expect(
    page.getByText(PRODUCT_DETAIL_COPY.VARIANT_BRANCH_REQUIRED_TITLE),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: PRODUCT_DETAIL_COPY.CTA_BRANCH_REQUIRED,
    }),
  ).toBeDisabled();

  // Accessibility audit on browse mode
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);

  // Select Surabaya in header
  const branchSelect = page.getByLabel(SITE_COPY.SELECT_BRANCH);
  await branchSelect.selectOption(syntheticBranches[0].id);
  await expect(page).toHaveURL(/branch=surabaya/);

  // Surabaya variants should now be offered
  await expect(
    page.getByText(PRODUCT_DETAIL_COPY.VARIANT_SECTION_TITLE),
  ).toBeVisible();
  await expect(page.getByRole('radio', { name: /Slice/ })).toBeVisible();

  // Capture desktop screenshot
  await page.screenshot({
    path: 'test-results/f10-detail-1440.png',
    fullPage: true,
  });
});

test('supports variant selection, quantity control, typed cart line payload preparation, and 375px mobile responsive view', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/menu/demo-coffee?branch=surabaya');
  await page.evaluate(() => document.fonts.ready);

  // Long product name should not overflow viewport
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  // Food info verified dietary and allergens
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: PRODUCT_DETAIL_COPY.FOOD_INFO_TITLE,
    }),
  ).toBeVisible();

  // Select Mini 14cm variant
  const miniRadio = page.getByRole('radio', { name: /Mini 14/ });
  await miniRadio.click();

  // Quantity increase
  const plusButton = page.getByRole('button', {
    name: /Tambah Jumlah pesanan/,
  });
  await plusButton.click();

  // Click CTA to prepare payload
  const prepareBtn = page.getByRole('button', {
    name: PRODUCT_DETAIL_COPY.CTA_PREPARE_CART,
  });
  await expect(prepareBtn).toBeEnabled();
  await prepareBtn.click();

  // Feedback should display prepared banner (wiring to F12)
  await expect(
    page.getByText(PRODUCT_DETAIL_COPY.CTA_PREPARED_TITLE),
  ).toBeVisible();
  await expect(page.getByText(/DEMO-COFFEE-MINI/)).toBeVisible();

  // Capture mobile screenshot
  await page.screenshot({
    path: 'test-results/f10-detail-375.png',
    fullPage: true,
  });

  // Verify real HTTP API contract on local SDK if available
  if (process.env.BAKERY_SITE_LOCAL === '1') {
    const res = await request.get('/api/products/demo-coffee?branch=surabaya');
    expect(res.status()).toBe(200);
    expect(res.headers()['cache-control']).toBe('no-store');
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.slug).toBe('demo-coffee');
    expect(body.data.offeredVariants.length).toBeGreaterThanOrEqual(1);

    const notFoundRes = await request.get('/api/products/unknown-kueh');
    expect(notFoundRes.status()).toBe(404);
  }
});
