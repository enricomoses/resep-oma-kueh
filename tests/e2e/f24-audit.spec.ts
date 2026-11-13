import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const AUDIT_VIEWPORTS = [375, 390, 768, 1440] as const;
const AUDIT_ROUTES = ['/', '/menu', '/classes', '/contact', '/cart'] as const;

const SYNTHETIC_BRANCHES = [
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

test.describe('F24 multi-viewport, accessibility, SEO, and security header audit', () => {
  test('renders cleanly across 375/390/768/1440 viewports with zero horizontal overflow, zero console errors, and zero WCAG AA violations', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    if (process.env.BAKERY_SITE_LOCAL !== '1') {
      await page.route('**/api/branches**', (route) =>
        route.fulfill({
          json: {
            ok: true,
            data: { items: SYNTHETIC_BRANCHES, resolvedBranchId: null },
            requestId: 'f24-audit-branches',
          },
        }),
      );
      await page.route('**/api/categories**', (route) =>
        route.fulfill({
          json: {
            ok: true,
            data: { items: [] },
            requestId: 'f24-audit-categories',
          },
        }),
      );
      await page.route('**/api/catalog**', (route) =>
        route.fulfill({
          json: {
            ok: true,
            data: {
              items: [],
              total: 0,
              page: 1,
              limit: 12,
              totalPages: 0,
              resolvedBranchId: null,
              appliedFilters: {
                branch: null,
                category: null,
                q: null,
                tag: null,
                availability: null,
                minPriceIdr: null,
                maxPriceIdr: null,
                sort: 'featured',
              },
            },
            requestId: 'f24-audit-catalog',
          },
        }),
      );
      await page.route('**/api/classes**', (route) =>
        route.fulfill({
          json: {
            ok: true,
            data: {
              items: [],
              resolvedBranchId: null,
              evaluatedAtUtc: '2026-11-12T00:00:00.000Z',
            },
            requestId: 'f24-audit-classes',
          },
        }),
      );
    }

    for (const width of AUDIT_VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });

      for (const route of AUDIT_ROUTES) {
        const pageErrors: string[] = [];
        const consoleErrors: string[] = [];
        const onPageError = (err: Error) => pageErrors.push(err.message);
        const onConsole = (msg: { type(): string; text(): string }) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        };
        page.on('pageerror', onPageError);
        page.on('console', onConsole);

        try {
          await page.goto(route);
          await page.evaluate(() => document.fonts.ready);

          const layoutCheck = await page.evaluate(() => {
            const overflow =
              document.documentElement.scrollWidth > window.innerWidth + 1;
            const brokenImages = Array.from(document.images)
              .filter((img) => img.complete && img.naturalWidth === 0)
              .map((img) => img.src);
            return { overflow, brokenImages };
          });

          expect(
            layoutCheck.overflow,
            `Horizontal overflow on ${route} at ${width}px`,
          ).toBe(false);
          expect(
            layoutCheck.brokenImages,
            `Broken images on ${route} at ${width}px`,
          ).toEqual([]);
          expect(pageErrors, `Page errors on ${route} at ${width}px`).toEqual(
            [],
          );
          expect(
            consoleErrors,
            `Console errors on ${route} at ${width}px`,
          ).toEqual([]);

          if (width === 375 || width === 1440) {
            const audit = await new AxeBuilder({ page })
              .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
              .analyze();
            expect(
              audit.violations,
              `Axe violations on ${route} at ${width}px`,
            ).toEqual([]);
          }
        } finally {
          page.off('pageerror', onPageError);
          page.off('console', onConsole);
        }
      }
    }
  });

  test('supports keyboard navigation, 200% text scaling, reduced motion, and bakery 404 page', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    // Tab reaches interactive element cleanly
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(
      () => document.activeElement?.tagName ?? null,
    );
    expect(focusedTag).not.toBeNull();
    expect(focusedTag).not.toBe('BODY');

    // Simulate 200% zoom via root font-size scaling on desktop 1440px
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const zoomOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(zoomOverflow).toBe(false);

    // Verify 404 boundary
    const notFoundResponse = await page.goto('/halaman-tidak-ditemukan-f24');
    expect(notFoundResponse?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { name: 'Halaman tidak ditemukan' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Kembali ke Beranda' }),
    ).toBeVisible();
    const notFoundAudit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(notFoundAudit.violations).toEqual([]);
  });

  test('serves workable security headers, noindex protections, sitemap.xml, robots.txt, and verified JSON-LD', async ({
    page,
    request,
  }) => {
    const homeRes = await request.get('/');
    expect(homeRes.status()).toBe(200);
    const homeHeaders = homeRes.headers();
    expect(homeHeaders['x-content-type-options']).toBe('nosniff');
    expect(homeHeaders['x-frame-options']).toBe('DENY');
    expect(homeHeaders['referrer-policy']).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(homeHeaders['cross-origin-opener-policy']).toBe('same-origin');
    expect(homeHeaders['content-security-policy']).toContain(
      "default-src 'self'",
    );
    expect(homeHeaders['content-security-policy']).not.toContain(
      'upgrade-insecure-requests',
    );

    const robotsRes = await request.get('/robots.txt');
    expect(robotsRes.status()).toBe(200);
    const robotsText = await robotsRes.text();
    expect(robotsText.toLowerCase()).toContain('user-agent: *');

    const sitemapRes = await request.get('/sitemap.xml');
    expect(sitemapRes.status()).toBe(200);
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).toContain('<urlset');
    expect(sitemapXml).toContain('/menu</loc>');
    expect(sitemapXml).toContain('/classes</loc>');
    expect(sitemapXml).not.toContain('/admin');
    expect(sitemapXml).not.toContain('/cart</loc>');
    expect(sitemapXml).not.toContain('/checkout</loc>');

    for (const privatePath of ['/cart', '/checkout', '/admin/login']) {
      const privateRes = await request.get(privatePath);
      expect(privateRes.status()).toBe(200);
      const headers = privateRes.headers();
      expect(headers['x-robots-tag']).toBe('noindex, nofollow');
      expect(headers['cache-control']).toContain('no-store');

      await page.goto(privatePath);
      const metaRobots = await page
        .locator('meta[name="robots"]')
        .first()
        .getAttribute('content');
      expect(metaRobots).toContain('noindex');
    }

    await page.goto('/contact');
    const jsonLdScripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(jsonLdScripts.length).toBeGreaterThanOrEqual(1);
    const bakerySchema = JSON.parse(jsonLdScripts[0]) as Record<
      string,
      unknown
    >;
    expect(bakerySchema['@type']).toBe('Bakery');
    expect(JSON.stringify(bakerySchema)).not.toContain('aggregateRating');
  });
});
