import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  HOME_CMS_DEFAULTS,
  HOME_COPY,
  HOME_SECTION_IDS,
} from '@/constants/home.constant';
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

let branches: PublicBranch[] = syntheticBranches;

test.beforeEach(async ({ page, request }) => {
  if (process.env.BAKERY_SITE_LOCAL === '1') {
    const response = await request.get('/api/branches');
    expect(response.status()).toBe(200);
    branches = (await response.json()).data.items;
  } else {
    branches = syntheticBranches;
    await page.route('**/api/branches**', (route) => {
      const code = new URL(route.request().url()).searchParams.get('branch');
      return route.fulfill({
        json: {
          ok: true,
          data: {
            items: branches,
            resolvedBranchId:
              branches.find((branch) => branch.code === code)?.id ?? null,
          },
          requestId: 'synthetic-home-fixture',
        },
      });
    });
  }
});

test('renders complete Home sequence in exact PRD §6.2 order with accessible desktop and mobile layouts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const isLocalSite = process.env.BAKERY_SITE_LOCAL === '1';

  const sectionIds = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main > section')).map((s) => s.id),
  );
  expect(sectionIds).toEqual(
    isLocalSite
      ? [
          HOME_SECTION_IDS.HERO,
          HOME_SECTION_IDS.SERIES,
          HOME_SECTION_IDS.FEATURED,
          HOME_SECTION_IDS.STORY,
          HOME_SECTION_IDS.TREATS,
          HOME_SECTION_IDS.CLASSES,
          HOME_SECTION_IDS.FIND_US,
          HOME_SECTION_IDS.COMMUNITY,
        ]
      : [
          HOME_SECTION_IDS.HERO,
          HOME_SECTION_IDS.SERIES,
          HOME_SECTION_IDS.FEATURED,
          HOME_SECTION_IDS.STORY,
          HOME_SECTION_IDS.TREATS,
          HOME_SECTION_IDS.CLASSES,
          HOME_SECTION_IDS.TESTIMONIALS,
          HOME_SECTION_IDS.FIND_US,
          HOME_SECTION_IDS.COMMUNITY,
        ],
  );

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    HOME_CMS_DEFAULTS.HERO.headline,
  );
  await expect(
    page.getByRole('heading', { level: 2, name: HOME_COPY.SERIES_TITLE }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: HOME_COPY.FEATURED_TITLE }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 3,
      name: HOME_CMS_DEFAULTS.CUSTOM_BUSINESS.title,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: HOME_COPY.TREATS_TITLE }),
  ).toBeVisible();
  if (isLocalSite) {
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: HOME_COPY.TESTIMONIALS_TITLE,
      }),
    ).toHaveCount(0);
  } else {
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: HOME_COPY.TESTIMONIALS_TITLE,
      }),
    ).toBeVisible();
    await expect(page.getByText(HOME_COPY.TESTIMONIALS_ERROR)).toBeVisible();
  }
  await expect(
    page.getByRole('heading', { level: 2, name: HOME_COPY.FIND_US_TITLE }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: HOME_COPY.COMMUNITY_TITLE }),
  ).toBeVisible();

  await expect(
    page.getByText('Rungkut Asri Tengah V No. 22, Surabaya').first(),
  ).toBeVisible();
  await expect(page.getByText(HOME_COPY.FIND_US_ADDRESS_PENDING)).toBeVisible();

  if (process.env.BAKERY_SITE_LOCAL === '1') {
    await expect(
      page.getByRole('heading', { level: 3, name: 'DEMO — Chiffon Series' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'DEMO — Coffee Chiffon' }),
    ).toBeVisible();
    await expect(
      page.getByText(HOME_COPY.FEATURED_PRICE_NOTE).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 3,
        name: 'DEMO — current at reference clock',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'DEMO — Fruit Tartlet' }),
    ).toBeVisible();
    await expect(page.getByText(HOME_COPY.TESTIMONIALS_EMPTY)).toHaveCount(0);
  }

  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);

  await page.screenshot({
    path: 'test-results/f07-home-1440.png',
    fullPage: true,
  });

  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/f07-home-375.png',
    fullPage: true,
  });
});

test('branch selection on Find Us updates Home CTAs and branch-scoped sections', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const surabayaButton = page.getByRole('button', {
    name: `${HOME_COPY.FIND_US_SELECT_CTA} Surabaya`,
  });
  await expect(surabayaButton).toBeVisible();
  await surabayaButton.click();

  await expect(page).toHaveURL(/branch=surabaya/);
  await expect(
    page.getByRole('link', { name: HOME_COPY.HERO_EXPLORE_CTA }),
  ).toHaveAttribute('href', '/menu?branch=surabaya');
  await expect(
    page.getByRole('link', { name: HOME_COPY.HERO_CLASS_CTA }),
  ).toHaveAttribute('href', '/classes?branch=surabaya');

  if (process.env.BAKERY_SITE_LOCAL === '1') {
    await expect(page.getByText(HOME_COPY.TREATS_EMPTY)).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'DEMO — Fruit Tartlet' }),
    ).toBeVisible();

    const bintaroButton = page.getByRole('button', {
      name: `${HOME_COPY.FIND_US_SELECT_CTA} Bintaro`,
    });
    await bintaroButton.click();
    await expect(page).toHaveURL(/branch=bintaro/);
    await expect(
      page.getByRole('heading', {
        level: 3,
        name: 'DEMO — current at reference clock',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: HOME_COPY.CLASSES_EMPTY }),
    ).toBeVisible();
  }
});
