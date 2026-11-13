import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const BINTARO_ID = 'f0400000-0000-4000-8000-000000000002';
const VAR_1 = 'b1800000-0000-4000-8000-000000000001';

test.describe('F18 Branch Locations, Hours, Availability Security & Public Sync', () => {
  test('enforces unauthenticated redirects and 401/403 JSON contracts for all F18 endpoints', async ({
    page,
    request,
  }) => {
    await page.goto('/admin/locations');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin/);
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      'content',
      /noindex/i,
    );

    await page.goto('/admin/availability');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin/);

    for (const endpoint of ['/api/admin/branches', '/api/admin/availability']) {
      const res = await request.get(endpoint);
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('UNAUTHENTICATED');
      expect(res.headers()['cache-control']).toContain('no-store');
    }

    const csrfBranchPatch = await request.patch(
      `/api/admin/branches/${SURABAYA_ID}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://evil.example',
        },
        data: { expectedUpdatedAt: '2026-11-13T08:00:00.000Z' },
      },
    );
    expect(csrfBranchPatch.status()).toBe(403);

    const csrfHoursPut = await request.put(
      `/api/admin/branches/${SURABAYA_ID}/hours`,
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://evil.example',
        },
        data: { expectedUpdatedAt: '2026-11-13T08:00:00.000Z', hours: [] },
      },
    );
    expect(csrfHoursPut.status()).toBe(403);

    const csrfOfferPut = await request.put(
      `/api/admin/availability/${BINTARO_ID}/${VAR_1}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://evil.example',
        },
        data: {
          expectedOfferUpdatedAt: null,
          isListed: true,
          availabilityStatus: 'available',
          stockQuantity: 1,
        },
      },
    );
    expect(csrfOfferPut.status()).toBe(403);

    const csrfBulkPost = await request.post('/api/admin/availability/bulk', {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      data: { items: [] },
    });
    expect(csrfBulkPost.status()).toBe(403);
  });

  test('renders both WhatsApp links, Bintaro unresolved notice, and clean 390px mobile layout on /contact', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/contact');

    await expect(
      page.locator('a[href="https://wa.me/6281703384308"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('a[href="https://wa.me/6285119785194"]').first(),
    ).toBeVisible();
    await expect(
      page.getByText(/Rungkut Asri Tengah V No\. 22, Surabaya/i).first(),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);

    const axeResult = await new AxeBuilder({ page }).analyze();
    expect(axeResult.violations).toEqual([]);
  });
});
