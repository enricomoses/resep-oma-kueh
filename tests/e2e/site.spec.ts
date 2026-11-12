import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { PublicBranch } from '@/types/branch';
import { BRANCH, SITE_COPY } from '@/constants/site.constant';

const synthetic: PublicBranch[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    whatsappNumber: '628000000001',
    address: null,
    mapsUrl: null,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    code: 'bintaro',
    name: 'Bintaro',
    city: 'Bintaro',
    whatsappNumber: '628000000002',
    address: null,
    mapsUrl: null,
  },
];
let branches: PublicBranch[] = synthetic;
async function controlledApi(page: Page, items = branches) {
  await page.route('**/api/branches**', (route) => {
    const code = new URL(route.request().url()).searchParams.get('branch');
    return route.fulfill({
      json: {
        ok: true,
        data: {
          items,
          resolvedBranchId:
            items.find((branch) => branch.code === code)?.id ?? null,
        },
        requestId: 'synthetic-ui-fixture',
      },
    });
  });
}
test.beforeEach(async ({ page, request }) => {
  if (process.env.BAKERY_SITE_LOCAL === '1') {
    const response = await request.get('/api/branches');
    expect(response.status()).toBe(200);
    branches = (await response.json()).data.items;
    expect(branches).toHaveLength(2);
  } else {
    branches = synthetic;
    await controlledApi(page);
  }
});

test('default none, explicit choice survives reload and navigation/filter parameters', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const select = page.getByLabel(SITE_COPY.SELECT_BRANCH, { exact: true });
  await expect(select).toBeEnabled();
  await expect(select).toHaveValue('');
  await expect(
    page.getByRole('button', { name: SITE_COPY.CART_EMPTY }),
  ).toBeDisabled();
  const first = branches.find((branch) => branch.code === 'surabaya')!;
  const second = branches.find((branch) => branch.code === 'bintaro')!;
  await select.selectOption(first.id);
  await expect(page).toHaveURL(/branch=surabaya/);
  await expect(select).toHaveValue(first.id);
  await page.reload();
  await expect(select).toHaveValue(first.id);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
      BRANCH.STORAGE_KEY,
    ),
  ).toEqual({ state: { selectedBranchId: first.id }, version: 1 });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .getByRole('navigation', { name: SITE_COPY.NAV })
    .getByRole('link', { name: 'Menu', exact: true })
    .click();
  await expect(page).toHaveURL(/\/menu\?branch=surabaya/);
  await expect(
    page.getByRole('link', { name: 'Menu', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await page.goto('/menu?search=chiffon&category=bread&page=2');
  await expect(select).toHaveValue(first.id);
  await select.selectOption(second.id);
  await expect(page).toHaveURL(/branch=bintaro/);
  const url = new URL(page.url());
  expect(url.searchParams.get('search')).toBe('chiffon');
  expect(url.searchParams.get('category')).toBe('bread');
  expect(url.searchParams.get('page')).toBe('2');
  await page.reload();
  await expect(select).toHaveValue(second.id);
  expect(errors).toEqual([]);
});

test('valid URL outranks preference; unknown URL never silently falls back', async ({
  page,
}) => {
  const first = branches.find((branch) => branch.code === 'surabaya')!;
  const second = branches.find((branch) => branch.code === 'bintaro')!;
  await page.addInitScript(
    ({ key, id }) =>
      localStorage.setItem(
        key,
        JSON.stringify({ state: { selectedBranchId: id }, version: 1 }),
      ),
    { key: BRANCH.STORAGE_KEY, id: second.id },
  );
  await page.goto('/?branch=surabaya');
  await expect(
    page.getByLabel(SITE_COPY.SELECT_BRANCH, { exact: true }),
  ).toHaveValue(first.id);
  await page.goto('/?branch=retired-fixture');
  await expect(page.getByText(SITE_COPY.BRANCH_INVALID)).toBeVisible();
  await expect(
    page.getByLabel(SITE_COPY.SELECT_BRANCH, { exact: true }),
  ).toHaveValue('');
  await page.goto('/');
  await expect(
    page.getByLabel(SITE_COPY.SELECT_BRANCH, { exact: true }),
  ).toHaveValue(second.id);
});

test('inactive preference is not selected, empty API differs from failure and fallback stays trusted', async ({
  page,
}) => {
  await page.addInitScript(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          state: { selectedBranchId: '33333333-3333-4333-8333-333333333333' },
          version: 1,
        }),
      ),
    BRANCH.STORAGE_KEY,
  );
  await page.goto('/');
  await expect(page.getByText(SITE_COPY.PREFERENCE_INVALID)).toBeVisible();
  await controlledApi(page, []);
  await page.goto('/?branch=empty-fixture');
  await expect(page.getByText(SITE_COPY.BRANCH_EMPTY)).toBeVisible();
  await expect(page.getByRole('button', { name: SITE_COPY.RETRY })).toHaveCount(
    0,
  );
  await page.route('**/api/branches**', (route) =>
    route.fulfill({
      status: 503,
      json: {
        ok: false,
        error: { code: 'UPSTREAM_ERROR', message: 'Unavailable fixture' },
        requestId: 'synthetic-failure',
      },
    }),
  );
  await page.goto('/?branch=failure-fixture');
  await expect(page.getByText(SITE_COPY.BRANCH_ERROR)).toBeVisible();
  await expect(
    page.getByRole('button', { name: SITE_COPY.RETRY }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'WhatsApp Surabaya' }),
  ).toHaveAttribute('href', 'https://wa.me/6281703384308');
  await expect(
    page.getByRole('link', { name: 'WhatsApp Bintaro' }),
  ).toHaveAttribute('href', 'https://wa.me/6285119785194');
  await expect(page.getByText(SITE_COPY.ADDRESS_PENDING)).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'resepoma.kueh2@gmail.com' }),
  ).toHaveAttribute('href', 'mailto:resepoma.kueh2@gmail.com');
});

test('mobile navigation Escape returns focus, links preserve branch and one chat slot', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/?branch=surabaya');
  await expect(
    page.getByLabel(SITE_COPY.SELECT_BRANCH, { exact: true }),
  ).toHaveValue(branches.find((branch) => branch.code === 'surabaya')!.id);
  const trigger = page.getByRole('button', { name: SITE_COPY.OPEN_NAV });
  await trigger.click();
  const drawer = page.getByRole('dialog', { name: SITE_COPY.MOBILE_NAV });
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await drawer.getByRole('link', { name: 'Kontak', exact: true }).click();
  await expect(page).toHaveURL(/\/contact\?branch=surabaya/);
  await expect(drawer).not.toBeVisible();
  await expect(
    page.getByRole('complementary', { name: SITE_COPY.CHAT }),
  ).toHaveCount(1);
  for (const name of ['FAQ', 'Privasi', 'Kebijakan pemesanan']) {
    const link = page.getByRole('link', { name, exact: true });
    expect(await link.getAttribute('href')).toContain('branch=surabaya');
  }
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: 'test-results/f06-mobile.png',
    fullPage: true,
  });
});

test('production HTTP branch endpoint contract on real local anonymous SDK', async ({
  request,
}) => {
  test.skip(
    process.env.BAKERY_SITE_LOCAL !== '1',
    'Real local DB harness required; UI mocks are not API evidence.',
  );
  const response = await request.get('/api/branches?branch=surabaya');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe('no-store');
  const payload = await response.json();
  expect(payload.data.resolvedBranchId).toBe(
    branches.find((branch) => branch.code === 'surabaya')!.id,
  );
  expect(payload.requestId).toMatch(/^[0-9a-f-]{36}$/);
  const invalid = await request.get(
    '/api/branches?branch=surabaya&branch=bintaro',
  );
  expect(invalid.status()).toBe(400);
  const unknown = await request.get('/api/branches?branch=retired-fixture');
  expect((await unknown.json()).data.resolvedBranchId).toBeNull();
});
