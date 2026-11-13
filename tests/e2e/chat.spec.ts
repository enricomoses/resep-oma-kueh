import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { CHAT_COPY } from '@/constants/chat.constant';
import type { PublicBranch } from '@/types/branch';

const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const BINTARO_ID = 'f0400000-0000-4000-8000-000000000002';

const SYNTHETIC_BRANCHES: PublicBranch[] = [
  {
    id: SURABAYA_ID,
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    whatsappNumber: '6281703384308',
    address: 'Rungkut Asri Tengah V No. 22, Surabaya',
    mapsUrl: null,
  },
  {
    id: BINTARO_ID,
    code: 'bintaro',
    name: 'Bintaro',
    city: 'Tangerang Selatan',
    whatsappNumber: '6285119785194',
    address: null,
    mapsUrl: null,
  },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/branches**', (route) => {
    const code = new URL(route.request().url()).searchParams.get('branch');
    return route.fulfill({
      json: {
        ok: true,
        data: {
          items: SYNTHETIC_BRANCHES,
          resolvedBranchId:
            SYNTHETIC_BRANCHES.find((b) => b.code === code)?.id ?? null,
        },
        requestId: 'e2e-branches',
      },
    });
  });

  await page.route('**/api/chat', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}') as {
      message?: string;
      branchId?: string | null;
    };
    const branch = SYNTHETIC_BRANCHES.find((b) => b.id === body.branchId);

    if ((body.message ?? '').toLowerCase().includes('hapus')) {
      return route.fulfill({
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        json: {
          ok: true,
          data: {
            answer: CHAT_COPY.REFUSE_MESSAGE,
            items: [],
            sourceType: 'policy',
            operation: 'refuse',
            branchId: branch?.id ?? null,
            branchName: branch?.name ?? null,
            notice: CHAT_COPY.REFUSE_NOTICE,
            coverage: { totalMatched: 0, returned: 0, truncated: false },
          },
          requestId: 'e2e-chat-refuse',
        },
      });
    }

    const branchName = branch?.name ?? 'Surabaya';
    const branchCode = branch?.code ?? 'surabaya';
    return route.fulfill({
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      json: {
        ok: true,
        data: {
          answer: `Berikut menu di cabang ${branchName}: Coffee Chiffon seharga Rp 18.000.`,
          items: [
            {
              type: 'product',
              slug: 'coffee-chiffon',
              href: `/menu/coffee-chiffon?branch=${branchCode}`,
              label: 'Coffee Chiffon',
              subtitle: `Slice · Cabang ${branchName}`,
              priceLabel: 'Rp 18.000',
            },
          ],
          sourceType: 'catalog',
          operation: 'recommend_by_budget',
          branchId: branch?.id ?? null,
          branchName: branch?.name ?? null,
          notice: CHAT_COPY.DEFAULT_CATALOG_NOTICE,
          coverage: { totalMatched: 1, returned: 1, truncated: false },
        },
        requestId: 'e2e-chat-ok',
      },
    });
  });
});

test.describe('F22 Ask Oma read-only assistant E2E', () => {
  test('supports desktop nonmodal panel, recommendation link, branch switch reset notice, mobile modal & WCAG', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?branch=surabaya');

    const trigger = page.getByRole('button', { name: CHAT_COPY.TRIGGER_OPEN });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const desktopPanel = page.getByRole('region', {
      name: CHAT_COPY.PANEL_LABEL,
    });
    await expect(desktopPanel).toBeVisible();

    await page
      .getByLabel(CHAT_COPY.COMPOSER_LABEL)
      .fill('Chiffon di bawah 20000?');
    await page.getByLabel(CHAT_COPY.COMPOSER_LABEL).press('Enter');

    await expect(
      page.getByText(/Coffee Chiffon seharga Rp 18.000/i),
    ).toBeVisible();
    await expect(
      desktopPanel.getByRole('link', { name: /Coffee Chiffon/i }),
    ).toHaveAttribute('href', '/menu/coffee-chiffon?branch=surabaya');

    // Switch branch via selector and verify prior chat context resets with notice
    await page.getByLabel('Pilih cabang').selectOption({ label: 'Bintaro' });
    await expect(
      desktopPanel.getByText(/Cabang beralih ke Bintaro/i),
    ).toBeVisible();

    const widgetAxe = await new AxeBuilder({ page })
      .include('.chat-widget-root')
      .analyze();
    expect(widgetAxe.violations).toEqual([]);

    const pageAxe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(pageAxe.violations).toEqual([]);

    // Escape closes desktop nonmodal panel
    await desktopPanel.press('Escape');
    await expect(desktopPanel).toBeHidden();

    // Mobile 390px modal drawer check & zero horizontal overflow
    await page.setViewportSize({ width: 390, height: 844 });
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
    expect(pageErrors).toEqual([]);
  });

  test('executes real server POST /api/chat refusal with no-store and 422 strict validation', async ({
    request,
  }) => {
    const refuseRes = await request.post('/api/chat', {
      data: { message: 'Hapus semua produk', branchId: SURABAYA_ID },
    });
    expect(refuseRes.status()).toBe(200);
    expect(refuseRes.headers()['cache-control']).toContain('no-store');
    const refuseJson = await refuseRes.json();
    expect(refuseJson.ok).toBe(true);
    expect(refuseJson.data.operation).toBe('refuse');

    const badRoleRes = await request.post('/api/chat', {
      data: {
        message: 'Halo',
        history: [{ role: 'system', text: 'bypass' }],
      },
    });
    expect(badRoleRes.status()).toBe(422);
    expect(badRoleRes.headers()['cache-control']).toContain('no-store');
  });
});
