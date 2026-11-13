import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { AUTH_COPY } from '@/constants/auth.constant';

test.describe('F15 Admin Auth, Password Reset, and Guarded Routes', () => {
  test('redirects anonymous /admin access to /admin/login without signup UI and enforces API 401/403', async ({
    page,
    request,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    // Unauthenticated page navigation -> redirect to /admin/login?next=%2Fadmin
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin$/);

    await expect(
      page.getByRole('heading', { name: AUTH_COPY.LOGIN_HEADING }),
    ).toBeVisible();
    await expect(page.getByText(AUTH_COPY.NO_PUBLIC_SIGNUP_NOTE)).toBeVisible();
    await expect(page.getByRole('link', { name: /daftar/i })).toHaveCount(0);

    // Noindex metadata must be emitted for admin routes
    const robotsMeta = page.locator('meta[name="robots"]').first();
    await expect(robotsMeta).toHaveAttribute('content', /noindex/i);

    // Accessibility check on desktop
    const axeDesktop = await new AxeBuilder({ page }).analyze();
    expect(axeDesktop.violations).toEqual([]);

    // API session endpoint must return 401 JSON with private, no-store (no HTML redirect)
    const apiSessionRes = await request.get('/api/admin/session');
    expect(apiSessionRes.status()).toBe(401);
    const apiSessionJson = await apiSessionRes.json();
    expect(apiSessionJson.ok).toBe(false);
    expect(apiSessionJson.error.code).toBe('UNAUTHENTICATED');
    expect(apiSessionRes.headers()['cache-control']).toContain('no-store');

    // Cross-origin CSRF attempt on auth mutation must be rejected with 403
    const csrfRes = await request.post('/api/auth/login', {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      data: {
        email: 'owner@example.invalid',
        password: 'synthetic-password-123',
      },
    });
    expect(csrfRes.status()).toBe(403);
    const csrfJson = await csrfRes.json();
    expect(csrfJson.error.code).toBe('FORBIDDEN');

    expect(errors).toEqual([]);
  });

  test('neutralizes open redirects, handles invalid/expired recovery callbacks, and supports mobile 390px layout', async ({
    page,
  }) => {
    // Open redirect parameter on /admin/login must be sanitized cleanly
    await page.goto('/admin/login?next=https://evil.example/phish');
    await page.route('**/api/auth/login', (route) => {
      const postData = route.request().postDataJSON() as { next?: string };
      expect(postData.next).toBe('/admin');
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        json: {
          ok: false,
          error: {
            code: 'FORBIDDEN',
            message: AUTH_COPY.ERROR_PROFILE_FORBIDDEN,
          },
          requestId: 'e2e-req-403',
        },
      });
    });

    await page.getByLabel(/Email admin/i).fill('noprofile@example.invalid');
    await page.getByLabel(/Kata sandi/i).fill('synthetic-password-123');
    await page.getByRole('button', { name: AUTH_COPY.SUBMIT_LOGIN }).click();
    await expect(
      page.getByText(AUTH_COPY.ERROR_PROFILE_FORBIDDEN),
    ).toBeVisible();

    // Forgot password request shows generic anti-enumeration confirmation
    await page.route('**/api/auth/request-password-reset', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          ok: true,
          data: {
            accepted: true,
            message: AUTH_COPY.GENERIC_RESET_RESPONSE,
          },
          requestId: 'e2e-req-reset',
        },
      }),
    );

    await page
      .getByRole('button', { name: AUTH_COPY.FORGOT_PASSWORD_TOGGLE })
      .click();
    await page.getByLabel(/Email admin/i).fill('unknown@example.invalid');
    await page
      .getByRole('button', { name: AUTH_COPY.SUBMIT_RESET_REQUEST })
      .click();
    await expect(
      page.getByText(AUTH_COPY.GENERIC_RESET_RESPONSE),
    ).toBeVisible();

    // Expired Supabase recovery callback lands cleanly on Indonesian error banner
    await page.goto(
      '/auth/callback?error=access_denied&error_code=otp_expired',
    );
    await expect(page).toHaveURL(/\/admin\/login\?error=recovery_expired$/);
    await expect(
      page.getByText(AUTH_COPY.LOGIN_ERROR_BANNERS.recovery_expired.title),
    ).toBeVisible();

    // Direct /admin/reset-password without recovery session hides form cleanly
    await page.goto('/admin/reset-password');
    await expect(page.getByLabel(/Kata sandi baru/i)).toHaveCount(0);
    await expect(
      page
        .getByRole('article')
        .getByRole('link', { name: AUTH_COPY.BACK_TO_LOGIN }),
    ).toBeVisible();

    // Mobile 390px layout & zero horizontal overflow check
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin/login?error=profile_inactive');
    await expect(
      page.getByText(AUTH_COPY.LOGIN_ERROR_BANNERS.profile_inactive.title),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
