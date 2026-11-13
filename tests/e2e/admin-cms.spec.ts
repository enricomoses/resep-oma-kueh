import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const SAMPLE_UUID = 'f20f0000-0000-4000-8000-000000000001';

test.describe('F20 CMS, FAQ & Testimonials Auth, CSRF & Public Storefront Sync', () => {
  test('enforces unauthenticated redirects, 401/403 JSON, and CSRF checks on CMS, FAQ, and testimonial endpoints', async ({
    page,
    request,
  }) => {
    for (const route of [
      '/admin/content',
      '/admin/faqs',
      '/admin/testimonials',
    ]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin/);
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
        'content',
        /noindex/i,
      );
    }

    for (const apiPath of [
      '/api/admin/content',
      '/api/admin/content/home.hero',
      '/api/admin/faqs',
      '/api/admin/testimonials',
    ]) {
      const unauth = await request.get(apiPath);
      expect(unauth.status()).toBe(401);
      const body = await unauth.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('UNAUTHENTICATED');
      expect(unauth.headers()['cache-control']).toContain('no-store');
    }

    const csrfPutContent = await request.put('/api/admin/content/footer.note', {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      data: {
        status: 'draft',
        expectedUpdatedAt: null,
        content: { text: 'X' },
      },
    });
    expect(csrfPutContent.status()).toBe(403);

    const csrfPostFaq = await request.post('/api/admin/faqs', {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      data: { category: 'Umum', question: 'Q', answer: 'A' },
    });
    expect(csrfPostFaq.status()).toBe(403);

    const csrfPatchFaq = await request.patch(`/api/admin/faqs/${SAMPLE_UUID}`, {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      data: {
        category: 'Umum',
        question: 'Q',
        answer: 'A',
        expectedUpdatedAt: '2026-11-13T00:00:00Z',
      },
    });
    expect(csrfPatchFaq.status()).toBe(403);

    const csrfPostTestimonial = await request.post('/api/admin/testimonials', {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      data: { quote: 'Enak' },
    });
    expect(csrfPostTestimonial.status()).toBe(403);
  });

  test('renders accessible public About, Contact B2B anchor, and FAQ pages with zero horizontal overflow at 390px', async ({
    page,
  }) => {
    for (const targetUrl of ['/about', '/contact#custom-business', '/faq']) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(targetUrl);
      await page.evaluate(() => document.fonts.ready);

      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    }
  });
});
