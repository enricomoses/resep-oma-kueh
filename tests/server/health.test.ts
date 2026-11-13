import { afterEach, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/health/route';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('returns 200 ok with no-store headers and never leaks secrets or version numbers', async () => {
  vi.stubEnv('APP_ENV', 'test');
  vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'false');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example-project.supabase.co');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_synthetic_health_key_001',
  );

  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(JSON.stringify([{ id: 'b1' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );

  const response = await GET(new Request('http://127.0.0.1:3000/api/health'));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  expect(response.headers.get('referrer-policy')).toBe('no-referrer');

  const bodyText = await response.text();
  const parsed = JSON.parse(bodyText) as Record<string, unknown>;
  expect(parsed.ok).toBe(true);
  expect(parsed.data).toEqual({
    status: 'ok',
    checks: { database: 'ok' },
  });
  expect(bodyText).not.toContain('sb_publishable');
  expect(bodyText).not.toContain('example-project');
  expect(bodyText).not.toContain(process.version);
  expect(bodyText.toLowerCase()).not.toContain('version');
});

it('returns 503 degraded without leaking env keys or upstream errors when DB fails or production stays in demo mode', async () => {
  vi.stubEnv('APP_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'true');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example-project.supabase.co');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_synthetic_health_key_002',
  );

  const prodDemoResponse = await GET(
    new Request('https://resepomakueh.com/api/health'),
  );
  expect(prodDemoResponse.status).toBe(503);
  const prodDemoText = await prodDemoResponse.text();
  expect(prodDemoText).not.toContain('NEXT_PUBLIC_DEMO_MODE');

  vi.stubEnv('APP_ENV', 'staging');
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async () => {
      return new Response('sensitive upstream postgresql stack trace', {
        status: 500,
      });
    }),
  );

  const dbDownResponse = await GET(
    new Request('https://staging.resepomakueh.com/api/health'),
  );
  expect(dbDownResponse.status).toBe(503);
  expect(dbDownResponse.headers.get('cache-control')).toContain('no-store');
  expect(dbDownResponse.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  const dbDownText = await dbDownResponse.text();
  expect(dbDownText).not.toContain('postgresql');
  expect(dbDownText).not.toContain('stack trace');
});
