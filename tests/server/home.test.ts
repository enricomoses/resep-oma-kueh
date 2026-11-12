import { afterEach, expect, it, vi } from 'vitest';
import { HOME_CMS_DEFAULTS } from '@/constants/home.constant';
import { getHomeData } from '@/features/home/service.server';

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

it('projects only allowed public columns and enforces active time and consent boundaries', async () => {
  const fetchMock = stubSupabaseRest((table) => {
    if (table === 'site_content') {
      return {
        body: [
          {
            key: 'home.story',
            content_json: {
              title: 'DEMO — Resep Oma Kueh',
              body: 'Data demo — bukan katalog pemesanan aktif.',
              image_path: 'approved/f0400000-0000-4000-8000-000000000990.png',
              image_alt: 'DEMO placeholder',
              media_approved: true,
            },
            status: 'published',
          },
          {
            key: 'home.class_promo',
            content_json: {
              title: 'DEMO — Baking Class',
              body: 'Jadwal dan harga di dataset ini sintetis.',
            },
            status: 'published',
          },
        ],
      };
    }
    if (table === 'categories') {
      return {
        body: [
          {
            id: 'f0400000-0000-4000-8000-000000000200',
            name: 'DEMO — Chiffon Series',
            slug: 'demo-chiffon-series',
            description: 'Data sintetis lokal.',
            sort_order: 0,
            status: 'published',
          },
        ],
      };
    }
    if (table === 'products') {
      return {
        body: [
          {
            id: 'f0400000-0000-4000-8000-000000000400',
            name: 'DEMO — Coffee Chiffon',
            slug: 'demo-coffee',
            short_description: null,
            description: 'SYNTHETIC DEMO lokal.',
            product_type: 'variants',
            is_best_seller: true,
            is_new: false,
            is_featured: true,
            status: 'published',
            sort_order: 0,
            product_categories: [
              {
                is_primary: true,
                categories: {
                  name: 'DEMO — Chiffon Series',
                  slug: 'demo-chiffon-series',
                  status: 'published',
                },
              },
            ],
            product_images: [
              {
                alt_text: 'DEMO — ilustrasi placeholder',
                is_primary: true,
                sort_order: 0,
              },
            ],
          },
        ],
      };
    }
    if (table === 'promotions') {
      return {
        body: [
          {
            id: 'f0400000-0000-4000-8000-000000000930',
            title: 'DEMO — expired',
            slug: 'demo-expired',
            description: null,
            discount_type: 'percentage',
            discount_value: 10,
            min_spend_idr: 0,
            max_discount_idr: 10000,
            scope: 'category',
            starts_at: '2026-10-28T00:00:00+07:00',
            ends_at: '2026-11-04T00:00:00+07:00',
            status: 'published',
            is_enabled: true,
            priority: 0,
            promotion_branches: [],
          },
          {
            id: 'f0400000-0000-4000-8000-000000000931',
            title: 'DEMO — current at reference clock',
            slug: 'demo-current',
            description: 'Berlaku di cabang Bintaro.',
            discount_type: 'fixed',
            discount_value: 2000,
            min_spend_idr: 0,
            max_discount_idr: 5000,
            scope: 'product',
            starts_at: '2026-11-10T00:00:00+07:00',
            ends_at: '2026-11-18T00:00:00+07:00',
            status: 'published',
            is_enabled: true,
            priority: 1,
            promotion_branches: [{ branch_id: BINTARO_ID }],
          },
          {
            id: 'f0400000-0000-4000-8000-000000000932',
            title: 'DEMO — future',
            slug: 'demo-future',
            description: null,
            discount_type: 'percentage',
            discount_value: 15,
            min_spend_idr: 0,
            max_discount_idr: 20000,
            scope: 'variant',
            starts_at: '2026-12-11T00:00:00+07:00',
            ends_at: '2026-12-18T00:00:00+07:00',
            status: 'published',
            is_enabled: true,
            priority: 0,
            promotion_branches: [],
          },
        ],
      };
    }
    if (table === 'class_sessions') {
      return {
        body: [
          {
            id: 'f0400000-0000-4000-8000-000000000950',
            starts_at: '2026-10-28T10:00:00+07:00',
            ends_at: '2026-10-28T12:00:00+07:00',
            registration_deadline_at: null,
            capacity: 12,
            seats_left: 8,
            status: 'scheduled',
            is_registration_open: true,
            branches: {
              id: SURABAYA_ID,
              code: 'surabaya',
              name: 'Surabaya',
              city: 'Surabaya',
              is_active: true,
            },
            class_programs: {
              id: 'f0400000-0000-4000-8000-000000000940',
              title: 'DEMO — Past Session',
              slug: 'demo-past',
              short_description: null,
              description: 'Sesi lampau.',
              age_min: null,
              age_max: null,
              duration_minutes: null,
              cover_alt_text: 'DEMO alt',
              status: 'published',
            },
          },
          {
            id: 'f0400000-0000-4000-8000-000000000951',
            starts_at: '2026-12-11T10:00:00+07:00',
            ends_at: '2026-12-11T12:00:00+07:00',
            registration_deadline_at: '2026-12-10T10:00:00+07:00',
            capacity: 12,
            seats_left: 8,
            status: 'scheduled',
            is_registration_open: true,
            branches: {
              id: SURABAYA_ID,
              code: 'surabaya',
              name: 'Surabaya',
              city: 'Surabaya',
              is_active: true,
            },
            class_programs: {
              id: 'f0400000-0000-4000-8000-000000000940',
              title: 'DEMO — Fruit Tartlet',
              slug: 'demo-class-0',
              short_description: null,
              description: 'SYNTHETIC DEMO class.',
              age_min: null,
              age_max: null,
              duration_minutes: null,
              cover_alt_text: 'DEMO — ilustrasi placeholder',
              status: 'published',
            },
          },
          {
            id: 'f0400000-0000-4000-8000-000000000952',
            starts_at: '2026-12-12T10:00:00+07:00',
            ends_at: '2026-12-12T12:00:00+07:00',
            registration_deadline_at: null,
            capacity: 10,
            seats_left: 0,
            status: 'scheduled',
            is_registration_open: true,
            branches: {
              id: BINTARO_ID,
              code: 'bintaro',
              name: 'Bintaro',
              city: 'Bintaro',
              is_active: true,
            },
            class_programs: {
              id: 'f0400000-0000-4000-8000-000000000941',
              title: 'DEMO — Cookies',
              slug: 'demo-class-1',
              short_description: null,
              description: 'SYNTHETIC DEMO class.',
              age_min: null,
              age_max: null,
              duration_minutes: null,
              cover_alt_text: 'DEMO — ilustrasi placeholder',
              status: 'published',
            },
          },
        ],
      };
    }
    return {
      body: [
        {
          id: 'f0400000-0000-4000-8000-000000000970',
          display_name: 'Pelanggan Resep Oma',
          quote: 'Hands down the best chiffon cake ever.',
          rating: 5,
          source_label: 'Izin terverifikasi',
          status: 'published',
          sort_order: 0,
        },
        {
          id: 'f0400000-0000-4000-8000-000000000971',
          display_name: 'Draft tanpa izin',
          quote: 'Tidak boleh tampil',
          rating: null,
          source_label: null,
          status: 'draft',
          sort_order: 1,
        },
      ],
    };
  });

  const referenceClock = new Date('2026-11-11T00:00:00+07:00');
  const result = await getHomeData({ now: referenceClock });

  const selectsByTable = Object.fromEntries(
    fetchMock.mock.calls.map(([input]) => {
      const url = new URL(String(input));
      return [
        url.pathname.split('/').pop(),
        url.searchParams.get('select') ?? '',
      ];
    }),
  );
  expect(selectsByTable.site_content).not.toContain('updated_by');
  expect(selectsByTable.testimonials).not.toContain('consent_reference');
  expect(selectsByTable.testimonials).not.toContain('consent_at');

  expect(result.content.status).toBe('success');
  if (result.content.status === 'success') {
    expect(result.content.data.hero.headline).toBe(
      HOME_CMS_DEFAULTS.HERO.headline,
    );
    expect(result.content.data.story.title).toBe('DEMO — Resep Oma Kueh');
    expect(result.content.data.customBusiness.title).toBe(
      HOME_CMS_DEFAULTS.CUSTOM_BUSINESS.title,
    );
  }

  expect(result.promotions.status).toBe('success');
  if (result.promotions.status === 'success') {
    expect(result.promotions.data.map((p) => p.slug)).toEqual(['demo-current']);
    expect(result.promotions.data[0].branchIds).toEqual([BINTARO_ID]);
  }

  expect(result.upcomingClasses.status).toBe('success');
  if (result.upcomingClasses.status === 'success') {
    expect(result.upcomingClasses.data.map((s) => s.id)).toEqual([
      'f0400000-0000-4000-8000-000000000951',
    ]);
  }

  expect(result.testimonials.status).toBe('success');
  if (result.testimonials.status === 'success') {
    expect(result.testimonials.data).toHaveLength(1);
    expect(result.testimonials.data[0].displayName).toBe('Pelanggan Resep Oma');
  }
});

it('handles exact starts_at inclusive and ends_at exclusive boundaries', async () => {
  stubSupabaseRest((table) => {
    if (table === 'promotions') {
      return {
        body: [
          {
            id: 'f0400000-0000-4000-8000-000000000931',
            title: 'DEMO — boundary',
            slug: 'demo-boundary',
            description: null,
            discount_type: 'fixed',
            discount_value: 2000,
            min_spend_idr: 0,
            max_discount_idr: null,
            scope: 'all',
            starts_at: '2026-11-10T00:00:00+07:00',
            ends_at: '2026-11-18T00:00:00+07:00',
            status: 'published',
            is_enabled: true,
            priority: 0,
            promotion_branches: [],
          },
        ],
      };
    }
    return { body: [] };
  });

  const atStart = await getHomeData({
    now: new Date('2026-11-10T00:00:00+07:00'),
  });
  expect(
    atStart.promotions.status === 'success' && atStart.promotions.data.length,
  ).toBe(1);

  const atEnd = await getHomeData({
    now: new Date('2026-11-18T00:00:00+07:00'),
  });
  expect(
    atEnd.promotions.status === 'success' && atEnd.promotions.data.length,
  ).toBe(0);
});

it('isolates per-section database failures without crashing other sections', async () => {
  stubSupabaseRest((table) => {
    if (table === 'categories' || table === 'promotions') {
      return { status: 503, body: { message: 'upstream error' } };
    }
    return { body: [] };
  });

  const result = await getHomeData();
  expect(result.categories.status).toBe('error');
  expect(result.promotions.status).toBe('error');
  expect(result.content.status).toBe('success');
  expect(result.featuredProducts).toEqual({ status: 'success', data: [] });
  expect(result.upcomingClasses).toEqual({ status: 'success', data: [] });
  expect(result.testimonials).toEqual({ status: 'success', data: [] });
});
