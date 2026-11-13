import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const SAMPLE_PRODUCT_ID = 'a1600000-0000-4000-8000-000000000001';

test.describe('F17 admin product editor & media auth boundaries', () => {
  test('redirects anonymous browser visits to /admin/login for new and edit product routes', async ({
    page,
  }) => {
    await page.goto('/admin/products/new');
    await expect(page).toHaveURL(/\/admin\/login\?next=/);

    await page.goto(`/admin/products/${SAMPLE_PRODUCT_ID}/edit`);
    await expect(page).toHaveURL(/\/admin\/login\?next=/);
  });

  test('denies unauthenticated requests to F17 bootstrap, configuration PUT, and media upload endpoints', async ({
    request,
  }) => {
    const bootstrapRes = await request.get(
      '/api/admin/products/editor-bootstrap',
    );
    expect(bootstrapRes.status()).toBe(401);

    const putRes = await request.put(
      `/api/admin/products/${SAMPLE_PRODUCT_ID}/configuration`,
      {
        data: {},
      },
    );
    expect([401, 403]).toContain(putRes.status());

    const uploadRes = await request.post('/api/admin/media/upload', {
      multipart: {
        file: {
          name: 'test.png',
          mimeType: 'image/png',
          buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        },
      },
    });
    expect([401, 403]).toContain(uploadRes.status());
  });

  test('renders admin login shell cleanly on mobile 390px without overflow or Axe violations', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin/products/new');
    await expect(page).toHaveURL(/\/admin\/login/);

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
