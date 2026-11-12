import { afterEach, expect, it, vi } from 'vitest';

import { createPublicReadClient } from '@/lib/supabase/public-read.server';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('uses a new anonymous SDK context with no browser cookie/admin credentials on reads', async () => {
  const key = 'sb_publishable_synthetic_fixture_key';
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', key);
  vi.stubEnv('SUPABASE_SECRET_KEY', 'synthetic-private-never-used');
  vi.stubGlobal('document', { cookie: 'admin-session=synthetic-admin' });
  const requests: RequestInit[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(init ?? {});
      return new Response(JSON.stringify([{ id: 'synthetic' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );
  const first = createPublicReadClient();
  const second = createPublicReadClient();
  expect(first).not.toBe(second);
  expect((await first.auth.getSession()).data.session).toBeNull();
  const { data, error } = await first.from('transport_fixture').select('id');
  expect(error).toBeNull();
  expect(data).toEqual([{ id: 'synthetic' }]);
  expect(requests).toHaveLength(1);
  const init = requests[0];
  const headers = new Headers(init.headers);
  expect(headers.get('authorization')).toBe(`Bearer ${key}`);
  expect(headers.get('apikey')).toBe(key);
  expect(headers.has('cookie')).toBe(false);
  expect(init.credentials).toBe('omit');
  expect(init.cache).toBe('no-store');
});
