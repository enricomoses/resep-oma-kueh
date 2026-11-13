import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('F16 Admin Shell, Categories & Products Security & Contracts', () => {
  test('redirects anonymous /admin/categories and /admin/products cleanly and enforces API 401/403', async ({
    page,
    request,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/admin/categories');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin/);
    const robotsMeta = page.locator('meta[name="robots"]').first();
    await expect(robotsMeta).toHaveAttribute('content', /noindex/i);

    await page.goto('/admin/products');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin/);

    const axeResult = await new AxeBuilder({ page }).analyze();
    expect(axeResult.violations).toEqual([]);

    // API endpoints must return 401 JSON with private, no-store (never HTML redirect)
    for (const endpoint of [
      '/api/admin/overview',
      '/api/admin/categories',
      '/api/admin/products',
    ]) {
      const res = await request.get(endpoint);
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('UNAUTHENTICATED');
      expect(res.headers()['cache-control']).toContain('no-store');
    }

    // Cross-origin CSRF writes rejected cleanly with 403 FORBIDDEN
    const csrfCategory = await request.post('/api/admin/categories', {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      data: {
        name: 'Cross Site',
        slug: 'cross-site',
        parentId: null,
        description: null,
        sortOrder: 0,
        status: 'draft',
      },
    });
    expect(csrfCategory.status()).toBe(403);

    const csrfProduct = await request.post('/api/admin/products', {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      data: {
        name: 'Cross Site Product',
        slug: 'cross-site-product',
        productType: 'simple',
        shortDescription: null,
        description: null,
        ingredientsInfo: null,
        storageInstructions: null,
        isFeatured: false,
        isBestSeller: false,
        isNew: false,
        needsOwnerReview: true,
        sortOrder: 0,
      },
    });
    expect(csrfProduct.status()).toBe(403);

    expect(errors).toEqual([]);
  });

  test('supports mobile 390px viewport cleanly on admin login redirect targets without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin/products');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin/);

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
