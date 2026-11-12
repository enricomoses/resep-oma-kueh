import type { CookieMethodsServer } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createBrowserAuthClient } from '@/lib/supabase/client';
import { createServerAuthClient } from '@/lib/supabase/server';
import { proxy, config } from '@/proxy';

const mock = vi.hoisted(() => {
  const adapters: CookieMethodsServer[] = [];
  return {
    adapters,
    getAll: vi.fn(() => [{ name: 'existing', value: 'synthetic' }]),
    set: vi.fn(),
    browser: vi.fn(),
    claims: vi.fn(),
  };
});

vi.mock('next/headers', () => ({
  cookies: async () => ({ getAll: mock.getAll, set: mock.set }),
}));
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mock.browser,
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: CookieMethodsServer },
  ) => {
    mock.adapters.push(options.cookies);
    return { auth: { getClaims: mock.claims } };
  },
}));

beforeEach(() => {
  mock.adapters.length = 0;
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_synthetic_fixture_key',
  );
});
afterEach(() => vi.unstubAllEnvs());

it('bridges all refresh chunks and SDK cache headers into the final request and response', async () => {
  mock.claims.mockImplementation(async () => {
    const adapter = mock.adapters.at(-1);
    expect(adapter?.getAll()).toEqual([
      { name: 'old', value: 'synthetic-old' },
    ]);
    await adapter?.setAll?.(
      [
        {
          name: 'session.0',
          value: 'synthetic-a',
          options: { path: '/', sameSite: 'lax' },
        },
      ],
      {
        'Cache-Control': 'private, no-store',
        Expires: '0',
        Pragma: 'no-cache',
      },
    );
    await adapter?.setAll?.(
      [{ name: 'session.1', value: 'synthetic-b', options: { path: '/' } }],
      {},
    );
    return { data: null, error: null };
  });
  const request = new NextRequest('http://localhost/admin', {
    headers: { Cookie: 'old=synthetic-old' },
  });
  const response = await proxy(request);
  expect(mock.claims).toHaveBeenCalledOnce();
  expect(request.cookies.get('session.0')?.value).toBe('synthetic-a');
  expect(response.cookies.get('session.0')?.value).toBe('synthetic-a');
  expect(response.cookies.get('session.1')?.value).toBe('synthetic-b');
  expect(response.headers.get('pragma')).toBe('no-cache');
  expect(response.headers.get('expires')).toBe('0');
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(response.headers.get('x-middleware-request-cookie')).toContain(
    'session.1',
  );
  expect(config.matcher).not.toContain('/api/chat');
});

it('creates per-request SSR clients and handles explicit Route Handler writes', async () => {
  const response = NextResponse.json({ ok: true });
  await createServerAuthClient(response);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  await createServerAuthClient();
  const [writable, readOnly] = mock.adapters;
  expect(writable).not.toBe(readOnly);
  expect(writable.getAll()).toEqual([{ name: 'existing', value: 'synthetic' }]);
  await writable.setAll?.(
    [{ name: 'session', value: 'synthetic', options: { path: '/' } }],
    { Pragma: 'no-cache', 'Cache-Control': 'private, no-store' },
  );
  expect(mock.set).toHaveBeenCalledOnce();
  expect(response.cookies.get('session')?.value).toBe('synthetic');
  expect(response.headers.get('pragma')).toBe('no-cache');
  await readOnly.setAll?.(
    [{ name: 'ignored-rsc', value: 'synthetic', options: {} }],
    {},
  );
  expect(mock.set).toHaveBeenCalledOnce();
});

it('browser auth factory uses only validated public config', () => {
  createBrowserAuthClient();
  expect(mock.browser).toHaveBeenCalledWith(
    'http://127.0.0.1:54321',
    'sb_publishable_synthetic_fixture_key',
  );
});
