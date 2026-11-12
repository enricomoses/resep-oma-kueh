import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { CATALOG_COPY } from '@/constants/catalog.constant';
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

const syntheticCategories = [
  {
    id: 'f0400000-0000-4000-8000-000000000200',
    name: 'DEMO — Chiffon Series',
    slug: 'demo-chiffon-series',
    description: 'Data sintetis lokal.',
    sortOrder: 0,
  },
  {
    id: 'f0400000-0000-4000-8000-000000000208',
    name: 'DEMO — Bread Series',
    slug: 'demo-bread-series',
    description: 'Data sintetis lokal.',
    sortOrder: 8,
  },
];

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
          requestId: 'synthetic-catalog-branches',
        },
      });
    });

    await page.route('**/api/categories**', (route) =>
      route.fulfill({
        json: {
          ok: true,
          data: { items: syntheticCategories },
          requestId: 'synthetic-catalog-categories',
        },
      }),
    );

    await page.route('**/api/catalog**', (route) => {
      const params = new URL(route.request().url()).searchParams;
      const branch = params.get('branch');
      const category = params.get('category');
      const q = params.get('q')?.toLowerCase() ?? '';
      const tag = params.get('tag');
      const sort = params.get('sort') ?? 'featured';

      const resolvedBranchId =
        syntheticBranches.find((b) => b.code === branch)?.id ?? null;

      const baseItems = [
        {
          id: 'f0400000-0000-4000-8000-000000000400',
          name: 'DEMO — Coffee Chiffon',
          slug: 'demo-coffee',
          shortDescription: null,
          description: 'SYNTHETIC DEMO lokal.',
          productType: 'variants' as const,
          isFeatured: true,
          isBestSeller: true,
          isNew: false,
          sortOrder: 0,
          createdAt: '2026-11-10T08:00:00+07:00',
          primaryCategory: {
            id: 'f0400000-0000-4000-8000-000000000200',
            name: 'DEMO — Chiffon Series',
            slug: 'demo-chiffon-series',
          },
          imageAlt: 'DEMO — ilustrasi placeholder',
          verifiedDietaryTags: [],
          activeVariantCount: 3,
          offeredVariantCount: resolvedBranchId ? 3 : 0,
          availabilityStatus: resolvedBranchId ? ('available' as const) : null,
          baseFromPriceIdr:
            branch === 'bintaro'
              ? 16_000
              : branch === 'surabaya'
                ? 15_000
                : null,
          fromPriceIdr:
            branch === 'bintaro'
              ? 14_000
              : branch === 'surabaya'
                ? 15_000
                : null,
          appliedPromotion:
            branch === 'bintaro'
              ? {
                  id: 'f0400000-0000-4000-8000-000000000931',
                  title: 'DEMO — current at reference clock',
                  slug: 'demo-current',
                  discountType: 'fixed' as const,
                  discountValue: 2000,
                  minSpendIdr: 0,
                  maxDiscountIdr: 5000,
                }
              : null,
          conditionalPromotion: null,
        },
        {
          id: 'f0400000-0000-4000-8000-000000000402',
          name: 'DEMO — Chiffon Mix',
          slug: 'demo-mix',
          shortDescription: null,
          description: 'SYNTHETIC DEMO bundle.',
          productType: 'bundle' as const,
          isFeatured: true,
          isBestSeller: false,
          isNew: true,
          sortOrder: 2,
          createdAt: '2026-11-12T08:00:00+07:00',
          primaryCategory: {
            id: 'f0400000-0000-4000-8000-000000000200',
            name: 'DEMO — Chiffon Series',
            slug: 'demo-chiffon-series',
          },
          imageAlt: 'DEMO — ilustrasi placeholder',
          verifiedDietaryTags: [{ slug: 'gluten-free', name: 'Gluten-Free' }],
          activeVariantCount: 2,
          offeredVariantCount: resolvedBranchId ? 2 : 0,
          availabilityStatus: resolvedBranchId ? ('available' as const) : null,
          baseFromPriceIdr: resolvedBranchId ? 190_000 : null,
          fromPriceIdr: resolvedBranchId ? 190_000 : null,
          appliedPromotion: null,
          conditionalPromotion: null,
        },
      ];

      const filtered = baseItems.filter((item) => {
        if (category && item.primaryCategory.slug !== category) return false;
        if (q && !item.name.toLowerCase().includes(q)) return false;
        if (
          tag &&
          !item.verifiedDietaryTags.some((diet) => diet.slug === tag)
        ) {
          return false;
        }
        return true;
      });

      return route.fulfill({
        json: {
          ok: true,
          data: {
            items: filtered,
            total: filtered.length,
            page: 1,
            limit: 12,
            totalPages: filtered.length > 0 ? 1 : 0,
            resolvedBranchId,
            appliedFilters: {
              branch,
              category,
              q: q || null,
              tag,
              availability: null,
              minPriceIdr: null,
              maxPriceIdr: null,
              sort,
            },
          },
          requestId: 'synthetic-catalog-items',
        },
      });
    });
  }
});

test('renders /menu browse mode without branch, switches branch to display effective starting prices, and passes WCAG axe audit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/menu');
  await page.evaluate(() => document.fonts.ready);

  await expect(
    page.getByRole('heading', { level: 1, name: CATALOG_COPY.TITLE }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: CATALOG_COPY.BRANCH_NOTICE_TITLE,
    }),
  ).toBeVisible();

  await expect(
    page.getByText(CATALOG_COPY.PRICE_BRANCH_REQUIRED).first(),
  ).toBeVisible();

  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);

  // Select Surabaya branch in header selector
  const branchSelect = page.getByLabel(SITE_COPY.SELECT_BRANCH);
  await branchSelect.selectOption(syntheticBranches[0].id);
  await expect(page).toHaveURL(/branch=surabaya/);

  await expect(page.getByText('Rp15.000').first()).toBeVisible();

  await page.screenshot({
    path: 'test-results/f09-menu-1440.png',
    fullPage: true,
  });
});

test('supports shareable URL filters, mobile filter drawer, and real local /api/categories and /api/catalog contracts', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/menu?branch=surabaya&tag=gluten-free');
  await page.evaluate(() => document.fonts.ready);

  await expect(
    page.getByRole('heading', { level: 3, name: /DEMO — Chiffon Mix/ }),
  ).toBeVisible();

  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  const openMobileFilters = page.getByRole('button', {
    name: CATALOG_COPY.OPEN_FILTERS_MOBILE,
  });
  await expect(openMobileFilters).toBeVisible();
  await openMobileFilters.click();

  const closeMobileFilters = page.getByRole('button', {
    name: CATALOG_COPY.CLOSE_FILTERS_MOBILE,
  });
  await expect(closeMobileFilters).toBeVisible();
  await closeMobileFilters.click();

  await page.screenshot({
    path: 'test-results/f09-menu-375.png',
    fullPage: true,
  });

  if (process.env.BAKERY_SITE_LOCAL === '1') {
    const catRes = await request.get('/api/categories');
    expect(catRes.status()).toBe(200);
    expect(catRes.headers()['cache-control']).toBe('no-store');
    const catBody = await catRes.json();
    expect(catBody.ok).toBe(true);
    expect(catBody.data.items.length).toBeGreaterThanOrEqual(13);

    const sbyRes = await request.get('/api/catalog?branch=surabaya');
    expect(sbyRes.status()).toBe(200);
    const sbyBody = await sbyRes.json();
    expect(sbyBody.ok).toBe(true);
    expect(sbyBody.data.total).toBe(8);

    const btrCoffee = (
      await (await request.get('/api/catalog?branch=bintaro&q=Coffee')).json()
    ).data.items[0];
    expect(btrCoffee.slug).toBe('demo-coffee');
    expect(btrCoffee.baseFromPriceIdr).toBe(16_000);

    const invalidLimitRes = await request.get('/api/catalog?limit=99');
    expect(invalidLimitRes.status()).toBe(400);
  }
});
