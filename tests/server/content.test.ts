import { afterEach, expect, it, vi } from 'vitest';
import { GET as getContentRoute } from '@/app/api/content/route';
import { GET as getFaqsRoute } from '@/app/api/faqs/route';
import { CONTENT_DEFAULTS } from '@/constants/content.constant';
import {
  getContactPageData,
  getInitialPublicContent,
  getInitialPublicFaqs,
  getPublicContent,
  getPublicFaqs,
} from '@/features/content/service.server';

const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const BINTARO_ID = 'f0400000-0000-4000-8000-000000000002';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function stubSupabaseRest(
  responder: (table: string, url: URL) => { status?: number; body: unknown },
) {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_synthetic_fixture_key',
  );
  const fetchMock = vi.fn<typeof globalThis.fetch>(async (input) => {
    const url = new URL(String(input));
    const table = url.pathname.split('/').pop() ?? '';
    const result = responder(table, url);
    return new Response(JSON.stringify(result.body), {
      status: result.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

it('projects only allowed site_content columns without updated_by and distinguishes published vs template entries', async () => {
  const fetchMock = stubSupabaseRest((table) => {
    if (table === 'site_content') {
      return {
        body: [
          {
            key: 'business.contacts',
            content_json: {
              email: 'resepoma.kueh2@gmail.com',
              instagram_url: 'https://www.instagram.com/resepoma.kueh/',
            },
            status: 'published',
            updated_at: '2026-11-12T08:00:00Z',
          },
          {
            key: 'about.story',
            content_json: {
              title: 'Draft Story',
              body: 'Hidden draft body.',
            },
            status: 'draft',
            updated_at: '2026-11-12T08:00:00Z',
          },
        ],
      };
    }
    return { body: [] };
  });

  const directory = await getPublicContent({
    keys: 'business.contacts,about.story,about.values,legal.privacy,legal.ordering_policy',
  });

  const calledUrls = fetchMock.mock.calls.map(([input]) =>
    new URL(String(input)).toString(),
  );
  const contentUrl = calledUrls.find((url) => url.includes('/site_content'));
  expect(contentUrl).toBeDefined();
  expect(contentUrl).not.toContain('updated_by');

  const contacts = directory.items.find(
    (item) => item.key === 'business.contacts',
  );
  expect(contacts).toEqual({
    key: 'business.contacts',
    source: 'published',
    updatedAt: '2026-11-12T08:00:00Z',
    content: {
      email: 'resepoma.kueh2@gmail.com',
      instagram_url: 'https://www.instagram.com/resepoma.kueh/',
    },
  });

  const aboutStory = directory.items.find((item) => item.key === 'about.story');
  expect(aboutStory).toEqual({
    key: 'about.story',
    source: 'template',
    updatedAt: null,
    content: CONTENT_DEFAULTS.ABOUT_STORY,
  });

  const aboutValues = directory.items.find(
    (item) => item.key === 'about.values',
  );
  expect(aboutValues?.source).toBe('template');
  if (aboutValues?.key === 'about.values') {
    expect(aboutValues.content.items).toEqual([
      'Authenticity',
      'Craftsmanship',
      'Warmth',
      'Quality',
      'Tradition',
    ]);
  }

  const privacy = directory.items.find((item) => item.key === 'legal.privacy');
  expect(privacy?.source).toBe('template');
  if (privacy?.key === 'legal.privacy') {
    expect(privacy.content.body).toContain('localStorage');
    expect(privacy.content.body).toContain('sementara (transient) di server');
    expect(privacy.content.body).toContain('wa.me');
  }

  const orderingPolicy = directory.items.find(
    (item) => item.key === 'legal.ordering_policy',
  );
  expect(orderingPolicy?.source).toBe('template');
  if (orderingPolicy?.key === 'legal.ordering_policy') {
    expect(orderingPolicy.content.body).toContain('WhatsApp');
    expect(orderingPolicy.content.body).toContain('menunggu persetujuan owner');
  }
});

it('rejects raw HTML tags or unexpected properties in CMS JSON and falls back to safe plain-text template', async () => {
  stubSupabaseRest((table) => {
    if (table === 'site_content') {
      return {
        body: [
          {
            key: 'legal.privacy',
            content_json: {
              title: 'Kebijakan Privasi',
              body: '<script>alert("xss")</script>Data aman.',
            },
            status: 'published',
            updated_at: '2026-11-12T08:00:00Z',
          },
          {
            key: 'about.values',
            content_json: {
              items: ['Authenticity', '<img src=x onerror=alert(1)>'],
            },
            status: 'published',
            updated_at: '2026-11-12T08:00:00Z',
          },
          {
            key: 'legal.ordering_policy',
            content_json: {
              title: 'Kebijakan Pemesanan Resmi',
              body: 'Pesanan dikonfirmasi manual oleh admin WhatsApp cabang.',
              unexpectedField: 'not-allowed',
            },
            status: 'published',
            updated_at: '2026-11-12T08:00:00Z',
          },
        ],
      };
    }
    return { body: [] };
  });

  const directory = await getPublicContent({
    keys: 'legal.privacy,about.values,legal.ordering_policy',
  });

  for (const item of directory.items) {
    expect(item.source).toBe('template');
    expect(JSON.stringify(item.content)).not.toContain('<script>');
    expect(JSON.stringify(item.content)).not.toContain('onerror');
    expect(JSON.stringify(item.content)).not.toContain('unexpectedField');
  }
});

it('filters published FAQs only and strips rows containing raw HTML tags', async () => {
  stubSupabaseRest((table) => {
    if (table === 'faqs') {
      return {
        body: [
          {
            id: 'f0400000-0000-4000-8000-000000000962',
            category: 'DEMO',
            question: 'DEMO — Apakah data ini dapat dipakai memesan?',
            answer: 'Tidak. Ini data sintetis lokal.',
            sort_order: 0,
            status: 'published',
          },
          {
            id: 'f0400000-0000-4000-8000-000000000960',
            category: 'Pemesanan',
            question: 'Draft refund question',
            answer: 'Draft refund answer',
            sort_order: 1,
            status: 'draft',
          },
          {
            id: 'f0400000-0000-4000-8000-000000000963',
            category: 'Keamanan',
            question: 'Malicious FAQ',
            answer: '<iframe src="https://evil.example"></iframe>',
            sort_order: 2,
            status: 'published',
          },
        ],
      };
    }
    return { body: [] };
  });

  const faqs = await getPublicFaqs();
  expect(faqs.items).toHaveLength(1);
  expect(faqs.items[0]?.id).toBe('f0400000-0000-4000-8000-000000000962');
});

it('combines active branches, verified hours, and fallback contacts on Contact page data', async () => {
  stubSupabaseRest((table) => {
    if (table === 'branches') {
      return {
        body: [
          {
            id: SURABAYA_ID,
            code: 'surabaya',
            name: 'Surabaya',
            city: 'Surabaya',
            whatsapp_number: '6281703384308',
            address: 'Rungkut Asri Tengah V No. 22, Surabaya',
            maps_url: 'https://maps.google.com/?q=Surabaya',
          },
          {
            id: BINTARO_ID,
            code: 'bintaro',
            name: 'Bintaro',
            city: 'Bintaro',
            whatsapp_number: '6285119785194',
            address: null,
            maps_url: null,
          },
        ],
      };
    }
    if (table === 'business_hours') {
      return {
        body: [
          {
            id: 'f0400000-0000-4000-8000-000000000801',
            branch_id: SURABAYA_ID,
            day_of_week: 1,
            opens_at: '08:00',
            closes_at: '17:00',
            is_closed: false,
            note: 'Pre-order & pickup',
          },
        ],
      };
    }
    if (table === 'site_content') {
      return {
        body: [
          {
            key: 'business.contacts',
            content_json: {
              email: 'resepoma.kueh2@gmail.com',
              instagram_url: 'https://www.instagram.com/resepoma.kueh/',
            },
            status: 'published',
            updated_at: '2026-11-12T08:00:00Z',
          },
        ],
      };
    }
    return { body: [] };
  });

  const contactData = await getContactPageData();
  expect(contactData.status).toBe('success');
  expect(contactData.email).toBe('resepoma.kueh2@gmail.com');
  expect(contactData.branches).toHaveLength(2);
  expect(contactData.branches[0]?.code).toBe('surabaya');
  expect(contactData.branches[0]?.address).toBe(
    'Rungkut Asri Tengah V No. 22, Surabaya',
  );
  expect(contactData.branches[0]?.mapsUrl).toBe(
    'https://maps.google.com/?q=Surabaya',
  );
  expect(contactData.branches[0]?.hours).toHaveLength(1);
  expect(contactData.branches[1]?.code).toBe('bintaro');
  expect(contactData.branches[1]?.address).toBeNull();
  expect(contactData.branches[1]?.mapsUrl).toBeNull();
  expect(contactData.branches[1]?.hours).toEqual([]);
});

it('falls back to approved contacts when upstream DB fails during getContactPageData and initial loaders', async () => {
  stubSupabaseRest(() => ({
    status: 503,
    body: { message: 'Database unavailable' },
  }));

  const contactData = await getContactPageData();
  expect(contactData.status).toBe('fallback');
  expect(contactData.branches).toHaveLength(2);
  expect(contactData.branches[0]?.whatsappNumber).toBe('6281703384308');
  expect(contactData.branches[1]?.whatsappNumber).toBe('6285119785194');
  expect(contactData.branches[1]?.address).toBeNull();

  const initialContent = await getInitialPublicContent(['about.story']);
  expect(initialContent).toEqual({ status: 'error' });

  const initialFaqs = await getInitialPublicFaqs();
  expect(initialFaqs).toEqual({ status: 'error' });
});

it('serves GET /api/content and GET /api/faqs with no-store headers, 400 on invalid params, and 503 on upstream failure', async () => {
  stubSupabaseRest((table) => {
    if (table === 'site_content') {
      return {
        body: [
          {
            key: 'footer.note',
            content_json: {
              text: 'Data demo — bukan katalog pemesanan aktif.',
            },
            status: 'published',
            updated_at: '2026-11-12T08:00:00Z',
          },
        ],
      };
    }
    if (table === 'faqs') {
      return { body: [] };
    }
    return { body: [] };
  });

  const validContentRes = await getContentRoute(
    new Request(
      'http://localhost:3000/api/content?keys=footer.note,about.story',
    ),
  );
  expect(validContentRes.status).toBe(200);
  expect(validContentRes.headers.get('cache-control')).toBe('no-store');
  const validContentJson = await validContentRes.json();
  expect(validContentJson.ok).toBe(true);
  expect(validContentJson.data.items).toHaveLength(2);

  const invalidKeyRes = await getContentRoute(
    new Request('http://localhost:3000/api/content?keys=unknown.secret.key'),
  );
  expect(invalidKeyRes.status).toBe(400);
  expect(invalidKeyRes.headers.get('cache-control')).toBe('no-store');

  const duplicateKeysParamRes = await getContentRoute(
    new Request(
      'http://localhost:3000/api/content?keys=about.story&keys=footer.note',
    ),
  );
  expect(duplicateKeysParamRes.status).toBe(400);

  const emptyFaqsRes = await getFaqsRoute(
    new Request('http://localhost:3000/api/faqs'),
  );
  expect(emptyFaqsRes.status).toBe(200);
  expect(emptyFaqsRes.headers.get('cache-control')).toBe('no-store');
  const emptyFaqsJson = await emptyFaqsRes.json();
  expect(emptyFaqsJson.ok).toBe(true);
  expect(emptyFaqsJson.data.items).toEqual([]);

  const invalidFaqsQueryRes = await getFaqsRoute(
    new Request('http://localhost:3000/api/faqs?unexpected=1'),
  );
  expect(invalidFaqsQueryRes.status).toBe(400);

  stubSupabaseRest(() => ({
    status: 503,
    body: { message: 'Upstream failure' },
  }));

  const errorContentRes = await getContentRoute(
    new Request('http://localhost:3000/api/content?keys=about.story'),
  );
  expect(errorContentRes.status).toBe(503);
  expect(errorContentRes.headers.get('cache-control')).toBe('no-store');

  const errorFaqsRes = await getFaqsRoute(
    new Request('http://localhost:3000/api/faqs'),
  );
  expect(errorFaqsRes.status).toBe(503);
  expect(errorFaqsRes.headers.get('cache-control')).toBe('no-store');
});
