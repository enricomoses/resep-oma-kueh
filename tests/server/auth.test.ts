import type { CookieMethodsServer } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as getAdminSessionRoute } from '@/app/api/admin/session/route';
import { POST as loginRoute } from '@/app/api/auth/login/route';
import { POST as logoutRoute } from '@/app/api/auth/logout/route';
import { POST as requestResetRoute } from '@/app/api/auth/request-password-reset/route';
import { POST as updatePasswordRoute } from '@/app/api/auth/update-password/route';
import { GET as authCallbackRoute } from '@/app/auth/callback/route';
import { AUTH_COPY, AUTH_LIMITS } from '@/constants/auth.constant';
import {
  requireAdminSession,
  requireApiAdmin,
} from '@/features/auth/admin-guard.server';
import { resetAuthRateLimitsForTest } from '@/features/auth/rate-limit.server';

const mockState = vi.hoisted(() => {
  const redirectCalls: string[] = [];
  const cookieJar: { name: string; value: string }[] = [];
  const auth = {
    getClaims: vi.fn(),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    exchangeCodeForSession: vi.fn(),
    verifyOtp: vi.fn(),
  };
  const profileQuery = {
    data: null as unknown,
    error: null as unknown,
  };
  const activeAdapter: { current?: CookieMethodsServer } = {};
  return {
    redirectCalls,
    cookieJar,
    auth,
    profileQuery,
    activeAdapter,
  };
});

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => mockState.cookieJar,
    set: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockState.redirectCalls.push(url);
    const err = new Error(`NEXT_REDIRECT:${url}`);
    throw err;
  },
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: CookieMethodsServer },
  ) => {
    mockState.activeAdapter.current = options.cookies;
    return {
      auth: mockState.auth,
      from: (table: string) => {
        expect(table).toBe('admin_profiles');
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => mockState.profileQuery,
            }),
          }),
        };
      },
    };
  },
}));

const OWNER_ID = 'f1500000-0000-4000-8000-000000000001';
const STAFF_ID = 'f1500000-0000-4000-8000-000000000002';
const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';

function makeJsonPost(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: new URL(url).origin,
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetAuthRateLimitsForTest();
  mockState.redirectCalls.length = 0;
  mockState.cookieJar.length = 0;
  mockState.profileQuery = { data: null, error: null };
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_synthetic_fixture_key',
  );
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');

  mockState.auth.signOut.mockImplementation(async () => {
    await mockState.activeAdapter.current?.setAll?.(
      [
        {
          name: 'sb-local-auth-token',
          value: '',
          options: { path: '/', maxAge: 0 },
        },
      ],
      { 'Cache-Control': 'private, no-store' },
    );
    return { error: null };
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Admin server guards and session probe (/api/admin/session)', () => {
  it('returns 401 UNAUTHENTICATED with private, no-store for anonymous requests', async () => {
    mockState.auth.getClaims.mockResolvedValue({ data: null, error: null });

    const response = await getAdminSessionRoute();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('UNAUTHENTICATED');
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('returns 200 with owner profile and permits owner-only API guard', async () => {
    mockState.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: OWNER_ID } },
      error: null,
    });
    mockState.auth.getUser.mockResolvedValue({
      data: { user: { id: OWNER_ID, email: 'owner@example.invalid' } },
      error: null,
    });
    mockState.profileQuery = {
      data: {
        user_id: OWNER_ID,
        display_name: 'Oma Owner',
        role: 'owner',
        branch_id: null,
        is_active: true,
        branches: null,
      },
      error: null,
    };

    const response = await getAdminSessionRoute();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.profile).toEqual({
      userId: OWNER_ID,
      email: 'owner@example.invalid',
      displayName: 'Oma Owner',
      role: 'owner',
      branchId: null,
      branchCode: null,
      branchName: null,
    });

    await expect(
      requireApiAdmin({ roles: ['owner'], response: new NextResponse() }),
    ).resolves.toMatchObject({ role: 'owner' });
  });

  it('allows branch_admin for shared session and rejects branch_admin on owner-only guard', async () => {
    mockState.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: STAFF_ID } },
      error: null,
    });
    mockState.auth.getUser.mockResolvedValue({
      data: { user: { id: STAFF_ID, email: 'staff@example.invalid' } },
      error: null,
    });
    mockState.profileQuery = {
      data: {
        user_id: STAFF_ID,
        display_name: 'Admin Surabaya',
        role: 'branch_admin',
        branch_id: SURABAYA_ID,
        is_active: true,
        branches: {
          id: SURABAYA_ID,
          code: 'surabaya',
          name: 'Surabaya',
          is_active: true,
        },
      },
      error: null,
    };

    const response = await getAdminSessionRoute();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.profile.role).toBe('branch_admin');
    expect(json.data.profile.branchCode).toBe('surabaya');

    await expect(
      requireApiAdmin({ roles: ['owner'], response: new NextResponse() }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });

  it('rejects Auth user missing admin_profiles or disabled profile with 403 FORBIDDEN', async () => {
    mockState.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: STAFF_ID } },
      error: null,
    });
    mockState.auth.getUser.mockResolvedValue({
      data: { user: { id: STAFF_ID, email: 'noprofile@example.invalid' } },
      error: null,
    });
    mockState.profileQuery = { data: null, error: null };

    const missingResponse = await getAdminSessionRoute();
    expect(missingResponse.status).toBe(403);
    expect((await missingResponse.json()).error.code).toBe('FORBIDDEN');

    mockState.profileQuery = {
      data: {
        user_id: STAFF_ID,
        display_name: 'Nonaktif',
        role: 'branch_admin',
        branch_id: SURABAYA_ID,
        is_active: false,
        branches: {
          id: SURABAYA_ID,
          code: 'surabaya',
          name: 'Surabaya',
          is_active: true,
        },
      },
      error: null,
    };

    const inactiveResponse = await getAdminSessionRoute();
    expect(inactiveResponse.status).toBe(403);
    expect((await inactiveResponse.json()).error.code).toBe('FORBIDDEN');
  });

  it('redirects RSC access appropriately for anon, expired session, missing profile, and inactive profile', async () => {
    mockState.auth.getClaims.mockResolvedValue({ data: null, error: null });
    await expect(requireAdminSession('/admin')).rejects.toThrow(
      'NEXT_REDIRECT:/admin/login?next=%2Fadmin',
    );

    mockState.cookieJar.push({ name: 'sb-local-auth-token', value: 'stale' });
    await expect(requireAdminSession('/admin')).rejects.toThrow(
      'NEXT_REDIRECT:/admin/login?error=session_expired&next=%2Fadmin',
    );

    mockState.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: STAFF_ID } },
      error: null,
    });
    mockState.auth.getUser.mockResolvedValue({
      data: { user: { id: STAFF_ID, email: 'noprofile@example.invalid' } },
      error: null,
    });
    mockState.profileQuery = { data: null, error: null };
    await expect(requireAdminSession('/admin')).rejects.toThrow(
      'NEXT_REDIRECT:/admin/login?error=profile_missing',
    );
  });

  it('returns 503 UPSTREAM_ERROR when admin_profiles query fails rather than 401/403', async () => {
    mockState.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: OWNER_ID } },
      error: null,
    });
    mockState.auth.getUser.mockResolvedValue({
      data: { user: { id: OWNER_ID, email: 'owner@example.invalid' } },
      error: null,
    });
    mockState.profileQuery = {
      data: null,
      error: { message: 'connection refused' },
    };

    const response = await getAdminSessionRoute();
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe('UPSTREAM_ERROR');
  });
});

describe('Auth BFF routes (/api/auth/*) and /auth/callback', () => {
  it('sets SSR cookies + private, no-store on valid login and neutralizes open redirect', async () => {
    mockState.auth.signInWithPassword.mockImplementation(async () => {
      await mockState.activeAdapter.current?.setAll?.(
        [
          {
            name: 'sb-local-auth-token',
            value: 'synthetic-jwt',
            options: { path: '/', httpOnly: true, sameSite: 'lax' },
          },
        ],
        { Pragma: 'no-cache' },
      );
      return {
        data: { user: { id: OWNER_ID, email: 'owner@example.invalid' } },
        error: null,
      };
    });
    mockState.profileQuery = {
      data: {
        user_id: OWNER_ID,
        display_name: 'Oma Owner',
        role: 'owner',
        branch_id: null,
        is_active: true,
        branches: null,
      },
      error: null,
    };

    const response = await loginRoute(
      makeJsonPost('http://localhost:3000/api/auth/login', {
        email: 'owner@example.invalid',
        password: 'valid-password-123',
        next: 'https://evil.example/steal',
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.redirectTo).toBe('/admin');
    expect(json.data.profile.role).toBe('owner');
    expect(response.cookies.get('sb-local-auth-token')?.value).toBe(
      'synthetic-jwt',
    );
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('pragma')).toBe('no-cache');
  });

  it('signs out and clears cookies with 403 if logged-in Auth user lacks active profile', async () => {
    mockState.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: STAFF_ID, email: 'noprofile@example.invalid' } },
      error: null,
    });
    mockState.profileQuery = { data: null, error: null };

    const response = await loginRoute(
      makeJsonPost('http://localhost:3000/api/auth/login', {
        email: 'noprofile@example.invalid',
        password: 'valid-password-123',
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error.code).toBe('FORBIDDEN');
    expect(mockState.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(response.cookies.get('sb-local-auth-token')?.value).toBe('');
  });

  it('rejects cross-site CSRF origins and missing Origin/Referer headers on auth mutations', async () => {
    const crossOriginRes = await loginRoute(
      makeJsonPost(
        'http://localhost:3000/api/auth/login',
        { email: 'owner@example.invalid', password: 'password-123' },
        { Origin: 'https://evil.example' },
      ),
    );
    expect(crossOriginRes.status).toBe(403);
    expect((await crossOriginRes.json()).error.code).toBe('FORBIDDEN');

    const missingOriginLogout = await logoutRoute(
      new Request('http://localhost:3000/api/auth/logout', { method: 'POST' }),
    );
    expect(missingOriginLogout.status).toBe(403);

    const secFetchCrossSite = await updatePasswordRoute(
      makeJsonPost(
        'http://localhost:3000/api/auth/update-password',
        { password: 'new-password-123' },
        { 'Sec-Fetch-Site': 'cross-site' },
      ),
    );
    expect(secFetchCrossSite.status).toBe(403);
  });

  it('logs out cleanly while clearing Supabase cookies and preventing caching', async () => {
    mockState.cookieJar.push({
      name: 'sb-local-auth-token',
      value: 'synthetic-jwt',
    });
    const response = await logoutRoute(
      makeJsonPost('http://localhost:3000/api/auth/logout', {}),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.loggedOut).toBe(true);
    expect(response.cookies.get('sb-local-auth-token')?.value).toBe('');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('returns generic password reset response, uses allowlisted callback URL, and enforces rate limit', async () => {
    mockState.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

    for (let i = 0; i < AUTH_LIMITS.RESET_RATE_LIMIT_MAX; i++) {
      const res = await requestResetRoute(
        makeJsonPost('http://localhost:3000/api/auth/request-password-reset', {
          email: 'unknown@example.invalid',
        }),
      );
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data.message).toBe(AUTH_COPY.GENERIC_RESET_RESPONSE);
    }

    expect(mockState.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'unknown@example.invalid',
      {
        redirectTo:
          'http://localhost:3000/auth/callback?next=%2Fadmin%2Freset-password',
      },
    );

    const limitedRes = await requestResetRoute(
      makeJsonPost('http://localhost:3000/api/auth/request-password-reset', {
        email: 'unknown@example.invalid',
      }),
    );
    expect(limitedRes.status).toBe(429);
    expect((await limitedRes.json()).error.code).toBe('RATE_LIMITED');
    expect(limitedRes.headers.get('retry-after')).toBeTruthy();
  });

  it('updates password only when recovery session and active profile are valid', async () => {
    mockState.auth.getClaims.mockResolvedValue({ data: null, error: null });
    const unauthRes = await updatePasswordRoute(
      makeJsonPost('http://localhost:3000/api/auth/update-password', {
        password: 'new-password-123',
      }),
    );
    expect(unauthRes.status).toBe(401);

    mockState.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: OWNER_ID } },
      error: null,
    });
    mockState.auth.getUser.mockResolvedValue({
      data: { user: { id: OWNER_ID, email: 'owner@example.invalid' } },
      error: null,
    });
    mockState.profileQuery = {
      data: {
        user_id: OWNER_ID,
        display_name: 'Oma Owner',
        role: 'owner',
        branch_id: null,
        is_active: true,
        branches: null,
      },
      error: null,
    };
    mockState.auth.updateUser.mockResolvedValue({
      data: { user: { id: OWNER_ID } },
      error: null,
    });

    const okRes = await updatePasswordRoute(
      makeJsonPost('http://localhost:3000/api/auth/update-password', {
        password: 'new-password-123',
      }),
    );
    expect(okRes.status).toBe(200);
    expect((await okRes.json()).data).toEqual({
      updated: true,
      redirectTo: '/admin',
    });
  });

  it('handles /auth/callback code exchange, preserves cookies, and blocks open redirects or expired links', async () => {
    mockState.auth.exchangeCodeForSession.mockImplementation(async () => {
      await mockState.activeAdapter.current?.setAll?.(
        [
          {
            name: 'sb-local-auth-token',
            value: 'recovery-jwt',
            options: { path: '/', httpOnly: true },
          },
        ],
        {},
      );
      return {
        data: { user: { id: OWNER_ID, email: 'owner@example.invalid' } },
        error: null,
      };
    });
    mockState.profileQuery = {
      data: {
        user_id: OWNER_ID,
        display_name: 'Oma Owner',
        role: 'owner',
        branch_id: null,
        is_active: true,
        branches: null,
      },
      error: null,
    };

    const okCallback = await authCallbackRoute(
      new Request(
        'http://localhost:3000/auth/callback?code=valid-code&next=https://evil.example',
      ),
    );
    expect(okCallback.status).toBe(307);
    expect(okCallback.headers.get('location')).toBe(
      'http://localhost:3000/admin/reset-password',
    );
    expect(okCallback.cookies.get('sb-local-auth-token')?.value).toBe(
      'recovery-jwt',
    );
    expect(okCallback.headers.get('cache-control')).toContain('no-store');

    mockState.auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { message: 'Token expired' },
    });
    const expiredCallback = await authCallbackRoute(
      new Request('http://localhost:3000/auth/callback?code=expired-code'),
    );
    expect(expiredCallback.status).toBe(307);
    expect(expiredCallback.headers.get('location')).toBe(
      'http://localhost:3000/admin/login?error=recovery_expired',
    );

    const supabaseErrorCallback = await authCallbackRoute(
      new Request(
        'http://localhost:3000/auth/callback?error=access_denied&error_code=otp_expired',
      ),
    );
    expect(supabaseErrorCallback.status).toBe(307);
    expect(supabaseErrorCallback.headers.get('location')).toBe(
      'http://localhost:3000/admin/login?error=recovery_expired',
    );
  });
});
