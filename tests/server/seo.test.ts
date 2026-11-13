import { afterEach, expect, it, vi } from 'vitest';
import { getDynamicSitemapEntries } from '@/features/seo/sitemap.server';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('includes only published ready products/classes in sitemap and never emits admin/cart/checkout/draft URLs', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'sb_publishable_synthetic_fixture_key',
  );

  vi.stubGlobal(
    'fetch',
    vi.fn<typeof globalThis.fetch>(async (input) => {
      const url = new URL(String(input));
      const table = url.pathname.split('/').pop() ?? '';

      if (table === 'products') {
        return new Response(
          JSON.stringify([
            {
              slug: 'lapis-surabaya',
              updated_at: '2026-11-11T00:00:00.000Z',
              status: 'published',
              needs_owner_review: false,
              product_categories: [{ categories: { status: 'published' } }],
              product_variants: [
                {
                  status: 'active',
                  branch_variant_offers: [{ is_listed: true }],
                },
              ],
            },
            {
              slug: 'unreviewed-hidden-product',
              updated_at: '2026-11-11T00:00:00.000Z',
              status: 'published',
              needs_owner_review: true,
              product_categories: [{ categories: { status: 'published' } }],
              product_variants: [
                {
                  status: 'active',
                  branch_variant_offers: [{ is_listed: true }],
                },
              ],
            },
            {
              slug: 'unlisted-variant-product',
              updated_at: '2026-11-11T00:00:00.000Z',
              status: 'published',
              needs_owner_review: false,
              product_categories: [{ categories: { status: 'published' } }],
              product_variants: [
                {
                  status: 'active',
                  branch_variant_offers: [{ is_listed: false }],
                },
              ],
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (table === 'class_programs') {
        return new Response(
          JSON.stringify([
            {
              slug: 'kids-baking-studio',
              updated_at: '2026-11-11T00:00:00.000Z',
              status: 'published',
              needs_owner_review: false,
              cover_is_approved: true,
              cover_storage_bucket: 'class-images',
              cover_image_path: 'kids/cover.webp',
              cover_alt_text: 'Kids studio',
              description: 'Belajar memanggang bersama chef.',
            },
            {
              slug: 'missing-cover-class',
              updated_at: '2026-11-11T00:00:00.000Z',
              status: 'published',
              needs_owner_review: false,
              cover_is_approved: false,
              cover_storage_bucket: 'class-images',
              cover_image_path: 'kids/draft.webp',
              cover_alt_text: 'Draft',
              description: 'Draft cover.',
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );

  const entries = await getDynamicSitemapEntries('https://resepomakueh.com');
  const urls = entries.map((entry) => entry.url);

  expect(urls).toContain('https://resepomakueh.com/');
  expect(urls).toContain('https://resepomakueh.com/menu');
  expect(urls).toContain('https://resepomakueh.com/menu/lapis-surabaya');
  expect(urls).toContain('https://resepomakueh.com/classes/kids-baking-studio');
  expect(urls).not.toContain(
    'https://resepomakueh.com/menu/unreviewed-hidden-product',
  );
  expect(urls).not.toContain(
    'https://resepomakueh.com/menu/unlisted-variant-product',
  );
  expect(urls).not.toContain(
    'https://resepomakueh.com/classes/missing-cover-class',
  );
  expect(urls.some((u) => /\/(admin|cart|checkout|auth|api)/.test(u))).toBe(
    false,
  );
});

it('falls back to static public entries when DB read fails or is unconfigured', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');

  const entries = await getDynamicSitemapEntries('https://resepomakueh.com');
  expect(entries.length).toBeGreaterThanOrEqual(8);
  expect(entries.some((e) => e.url === 'https://resepomakueh.com/menu')).toBe(
    true,
  );
});
