import { afterEach, expect, it, vi } from 'vitest';
import { getBranches } from '@/features/branches/service.server';
import { GET } from '@/app/api/branches/route';

const row = {
  id: '11111111-1111-4111-8111-111111111111',
  code: 'surabaya',
  name: 'DEMO',
  city: 'DEMO',
  whatsapp_number: '628000000000',
  address: null,
  maps_url: null,
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function transport(body: unknown, status = 200) {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_synthetic_fixture_key',
  );
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
it('selects only public fields/active rows and resolves code to UUID in domain', async () => {
  const fetch = transport([row]);
  expect((await getBranches({ branch: 'surabaya' })).resolvedBranchId).toBe(
    row.id,
  );
  const [input, init] = fetch.mock.calls[0];
  const url = new URL(String(input));
  expect(url.searchParams.get('is_active')).toBe('eq.true');
  expect(url.searchParams.get('select')).toBe(
    'id,code,name,city,whatsapp_number,address,maps_url,allow_pickup,allow_delivery',
  );
  expect(init?.cache).toBe('no-store');
  expect(
    (await getBranches({ branch: 'inactive' })).resolvedBranchId,
  ).toBeNull();
});
it('keeps successful empty distinct from upstream error; sanitizes and no-stores API errors', async () => {
  transport([]);
  const empty = await GET(new Request('http://localhost/api/branches'));
  expect(empty.status).toBe(200);
  expect((await empty.json()).data.items).toEqual([]);
  transport({ message: 'private failure fixture' }, 503);
  const failure = await GET(new Request('http://localhost/api/branches'));
  expect(failure.status).toBe(503);
  expect(failure.headers.get('cache-control')).toBe('no-store');
  expect(await failure.text()).not.toContain('private failure fixture');
});
it('rejects duplicate/unknown parameters and invalid output without leaking data', async () => {
  transport([row]);
  expect(
    (
      await GET(
        new Request(
          'http://localhost/api/branches?branch=bintaro&branch=surabaya',
        ),
      )
    ).status,
  ).toBe(400);
  expect(
    (await GET(new Request('http://localhost/api/branches?admin=true'))).status,
  ).toBe(400);
  transport([{ ...row, whatsapp_number: 'javascript:fixture' }]);
  expect((await GET(new Request('http://localhost/api/branches'))).status).toBe(
    503,
  );
});
