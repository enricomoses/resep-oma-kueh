import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PROMO_ID = 'd1900000-0000-4000-8000-000000000001';

test.describe('F19 Promotions Security, Public API & Storefront Accessibility', () => {
  test('enforces unauthenticated redirects, 401/403 JSON, and CSRF checks across F19 endpoints', async ({
    page,
    request,
  }) => {
    await page.goto('/admin/promotions');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin/);
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      'content',
      /noindex/i,
    );

    const unauthList = await request.get('/api/admin/promotions');
    expect(unauthList.status()).toBe(401);
    const unauthBody = await unauthList.json();
    expect(unauthBody.ok).toBe(false);
    expect(unauthBody.error.code).toBe('UNAUTHENTICATED');
    expect(unauthList.headers()['cache-control']).toContain('no-store');

    const csrfPost = await request.post('/api/admin/promotions', {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      data: { title: 'Evil' },
    });
    expect(csrfPost.status()).toBe(403);

    const csrfPatch = await request.patch(`/api/admin/promotions/${PROMO_ID}`, {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      data: { title: 'Evil' },
    });
    expect(csrfPatch.status()).toBe(403);

    const csrfDelete = await request.delete(
      `/api/admin/promotions/${PROMO_ID}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://evil.example',
        },
        data: { expectedUpdatedAt: '2026-11-13T08:00:00.000Z' },
      },
    );
    expect(csrfDelete.status()).toBe(403);

    const csrfBanner = await request.put(
      '/api/admin/promotions/shipping-banner',
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://evil.example',
        },
        data: { title: 'Evil', body: 'Evil', status: 'draft' },
      },
    );
    expect(csrfBanner.status()).toBe(403);
  });

  test('exposes public active promotions contract cleanly and renders accessible home treats without horizontal overflow', async ({
    page,
    request,
  }) => {
    const publicRes = await request.get('/api/promotions?branch=surabaya');
    expect(publicRes.headers()['cache-control']).toContain('no-store');
    const publicJson = await publicRes.json();

    if (process.env.BAKERY_SITE_LOCAL === '1') {
      expect(publicRes.status()).toBe(200);
      expect(publicJson.ok).toBe(true);
      expect(Array.isArray(publicJson.data.promotions)).toBe(true);
    } else {
      expect([200, 503]).toContain(publicRes.status());
      if (publicRes.status() === 200) {
        expect(publicJson.ok).toBe(true);
        expect(Array.isArray(publicJson.data.promotions)).toBe(true);
      } else {
        expect(publicJson.ok).toBe(false);
        expect(publicJson.error.code).toBe('UPSTREAM_ERROR');
      }

      await page.route('**/api/branches**', (route) =>
        route.fulfill({
          json: {
            ok: true,
            data: {
              items: [
                {
                  id: 'f0400000-0000-4000-8000-000000000001',
                  code: 'surabaya',
                  name: 'Surabaya',
                  city: 'Surabaya',
                  whatsappNumber: '6281703384308',
                  address: 'Rungkut Asri Tengah V No. 22, Surabaya',
                  mapsUrl: null,
                },
              ],
              resolvedBranchId: 'f0400000-0000-4000-8000-000000000001',
            },
            requestId: 'synthetic-promo-branches',
          },
        }),
      );
    }

    const badQueryRes = await request.get(
      '/api/promotions?branch=surabaya&unknown=1',
    );
    expect(badQueryRes.status()).toBe(400);
    expect(badQueryRes.headers()['cache-control']).toContain('no-store');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?branch=surabaya');

    await expect(page.locator('#home-treats')).toBeVisible();
    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);

    const axeResults = await new AxeBuilder({ page })
      .include('#home-treats')
      .analyze();
    expect(axeResults.violations).toEqual([]);
  });
});
