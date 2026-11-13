import { describe, expect, it } from 'vitest';

import { ROUTES } from '@/constants/routes.constant';
import { resolveSafeAdminRedirectPath } from '@/utils/auth-redirect';
import {
  loginRequestSchema,
  passwordResetRequestSchema,
  updatePasswordFormSchema,
  updatePasswordRequestSchema,
} from '@/validations/auth.schema';

describe('resolveSafeAdminRedirectPath', () => {
  it('allows internal /admin paths with query or hash', () => {
    expect(resolveSafeAdminRedirectPath('/admin')).toBe('/admin');
    expect(resolveSafeAdminRedirectPath('/admin/reset-password')).toBe(
      '/admin/reset-password',
    );
    expect(resolveSafeAdminRedirectPath('/admin/products?page=2#top')).toBe(
      '/admin/products?page=2#top',
    );
  });

  it('rejects open redirects, non-admin routes, and control characters', () => {
    expect(resolveSafeAdminRedirectPath('https://evil.example/admin')).toBe(
      ROUTES.ADMIN,
    );
    expect(resolveSafeAdminRedirectPath('//evil.example/admin')).toBe(
      ROUTES.ADMIN,
    );
    expect(resolveSafeAdminRedirectPath('///evil.example')).toBe(ROUTES.ADMIN);
    expect(resolveSafeAdminRedirectPath('/\\evil.example')).toBe(ROUTES.ADMIN);
    expect(resolveSafeAdminRedirectPath('javascript:alert(1)')).toBe(
      ROUTES.ADMIN,
    );
    expect(resolveSafeAdminRedirectPath('/menu?branch=surabaya')).toBe(
      ROUTES.ADMIN,
    );
    expect(resolveSafeAdminRedirectPath('/admin\r\nSet-Cookie: a=b')).toBe(
      ROUTES.ADMIN,
    );
    expect(resolveSafeAdminRedirectPath('/admin/login')).toBe(ROUTES.ADMIN);
    expect(resolveSafeAdminRedirectPath('')).toBe(ROUTES.ADMIN);
    expect(resolveSafeAdminRedirectPath(null)).toBe(ROUTES.ADMIN);
  });
});

describe('auth Zod schemas', () => {
  it('normalizes valid login payloads and rejects extra fields', () => {
    const parsed = loginRequestSchema.parse({
      email: ' Owner@Example.COM ',
      password: 'secret-password',
      next: '/admin',
    });
    expect(parsed.email).toBe('owner@example.com');

    expect(
      loginRequestSchema.safeParse({
        email: 'owner@example.com',
        password: 'secret',
        role: 'owner',
      }).success,
    ).toBe(false);
  });

  it('validates password reset email strictly', () => {
    expect(
      passwordResetRequestSchema.safeParse({ email: 'not-an-email' }).success,
    ).toBe(false);
    expect(
      passwordResetRequestSchema.parse({ email: ' Staff@Example.COM ' }).email,
    ).toBe('staff@example.com');
  });

  it('enforces minimum password length and confirmation match', () => {
    expect(
      updatePasswordRequestSchema.safeParse({ password: 'short' }).success,
    ).toBe(false);
    expect(
      updatePasswordRequestSchema.safeParse({ password: 'valid-password-123' })
        .success,
    ).toBe(true);

    expect(
      updatePasswordFormSchema.safeParse({
        password: 'valid-password-123',
        confirmPassword: 'different-password',
      }).success,
    ).toBe(false);
    expect(
      updatePasswordFormSchema.safeParse({
        password: 'valid-password-123',
        confirmPassword: 'valid-password-123',
      }).success,
    ).toBe(true);
  });
});
