import { expect, it } from 'vitest';
import { APPROVED_CONTACTS } from '@/constants/contacts.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { ProductDetail } from '@/types/catalog';
import type { PublicClassProgram } from '@/types/classes';
import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
} from '@/utils/security-headers';
import {
  buildPageMetadata,
  isNoIndexDeployment,
  resolveCanonicalUrl,
} from '@/utils/seo';
import {
  buildBakeryJsonLd,
  buildClassEventJsonLd,
  buildProductJsonLd,
  serializeJsonLd,
} from '@/utils/structured-data';

it('builds metadata with canonical URL, OG tags, and noindex overrides cleanly', () => {
  const indexableMeta = buildPageMetadata({
    title: 'Menu & Katalog | Resep Oma Kueh',
    description: 'Katalog produk resmi',
    path: ROUTES.MENU,
    siteUrl: 'https://resepomakueh.com',
    demoMode: false,
  });

  expect(indexableMeta.alternates?.canonical).toBe(
    'https://resepomakueh.com/menu',
  );
  expect(indexableMeta.openGraph?.url).toBe('https://resepomakueh.com/menu');
  expect(indexableMeta.robots).toBeUndefined();

  const cartMeta = buildPageMetadata({
    title: 'Keranjang | Resep Oma Kueh',
    description: 'Keranjang lokal',
    path: ROUTES.CART,
    noIndex: true,
    siteUrl: 'https://resepomakueh.com',
    demoMode: false,
  });
  expect(cartMeta.robots).toEqual({ index: false, follow: false });

  expect(
    isNoIndexDeployment({
      siteUrl: 'https://resep-oma-kueh-preview.vercel.app',
      demoMode: false,
    }),
  ).toBe(true);
  expect(
    isNoIndexDeployment({
      siteUrl: 'https://deploy-preview-12--resep-oma-kueh.netlify.app',
      demoMode: false,
    }),
  ).toBe(true);
  expect(
    isNoIndexDeployment({
      siteUrl: 'https://staging-resep-oma-kueh.netlify.app',
      demoMode: false,
    }),
  ).toBe(true);
  expect(
    isNoIndexDeployment({
      siteUrl: 'https://resepomakueh.com',
      demoMode: true,
    }),
  ).toBe(true);
  expect(
    isNoIndexDeployment({
      siteUrl: 'https://resepomakueh.com',
      demoMode: false,
    }),
  ).toBe(false);

  expect(resolveCanonicalUrl('https://resepomakueh.com/', '/menu/')).toBe(
    'https://resepomakueh.com/menu',
  );
});

it('builds Bakery JSON-LD strictly from verified facts without inventing hours or Bintaro address', () => {
  const jsonLd = buildBakeryJsonLd({
    siteUrl: 'https://resepomakueh.com',
    email: APPROVED_CONTACTS.email,
    instagramUrl: APPROVED_CONTACTS.instagramUrl,
    branches: APPROVED_CONTACTS.branches,
  });

  const text = JSON.stringify(jsonLd);
  expect(text).not.toContain('aggregateRating');
  const departments = jsonLd.department as Array<Record<string, unknown>>;
  expect(departments).toHaveLength(2);
  expect(departments[0].address).toMatchObject({
    streetAddress: 'Rungkut Asri Tengah V No. 22, Surabaya',
  });
  expect(departments[1].address).toBeUndefined();
  expect(departments[0].openingHoursSpecification).toBeUndefined();
});

it('builds Product JSON-LD with verified branch pricing, accurate availability, and no fake rating', () => {
  const product: ProductDetail = {
    id: 'prod-1',
    name: 'Lapis Surabaya Speciaal',
    slug: 'lapis-surabaya-speciaal',
    shortDescription: 'Lapis klasik 3 lapisan',
    description: 'Resep klasik keluarga.',
    ingredientsInfo: null,
    storageInstructions: null,
    productType: 'simple',
    isFeatured: true,
    isBestSeller: false,
    isNew: false,
    primaryCategory: {
      id: 'cat-1',
      name: 'Classic Cakes',
      slug: 'classic-cakes',
    },
    categories: [
      {
        id: 'cat-1',
        name: 'Classic Cakes',
        slug: 'classic-cakes',
        isPrimary: true,
      },
    ],
    resolvedBranchId: 'br-1',
    resolvedBranchCode: 'surabaya',
    activeVariantCount: 2,
    relatedProducts: [],
    images: [
      {
        id: 'img-1',
        variantId: null,
        publicUrl:
          'https://example.supabase.co/storage/v1/object/public/product-images/lapis.webp',
        altText: 'Lapis Surabaya',
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    offeredVariants: [
      {
        id: 'var-1',
        sku: 'ROK-LAP-20',
        name: 'Whole 20x20',
        sizeLabel: '20x20 cm',
        baseOrOverrideIdr: 250000,
        minOptionDeltaIdr: 0,
        unitGrossIdr: 250000,
        unconditionalDiscountIdr: 25000,
        effectivePriceIdr: 225000,
        appliedPromotion: null,
        conditionalPromotion: null,
        availabilityStatus: 'available',
        stockQuantity: 4,
        isDefault: true,
        sortOrder: 0,
        maxQuantityPerOrder: 5,
        bundleRecipe: null,
        bundleUnitsTotal: null,
        bundleRulesVerified: false,
        verifiedDietaryTags: [],
        verifiedAllergens: [],
        optionGroups: [],
        fixedComponents: [],
      },
      {
        id: 'var-2',
        sku: 'ROK-LAP-10',
        name: 'Half 10x20',
        sizeLabel: '10x20 cm',
        baseOrOverrideIdr: 135000,
        minOptionDeltaIdr: 0,
        unitGrossIdr: 135000,
        unconditionalDiscountIdr: 0,
        effectivePriceIdr: 135000,
        appliedPromotion: null,
        conditionalPromotion: null,
        availabilityStatus: 'unconfirmed',
        stockQuantity: null,
        isDefault: false,
        sortOrder: 1,
        maxQuantityPerOrder: 5,
        bundleRecipe: null,
        bundleUnitsTotal: null,
        bundleRulesVerified: false,
        verifiedDietaryTags: [],
        verifiedAllergens: [],
        optionGroups: [],
        fixedComponents: [],
      },
    ],
  };

  const jsonLd = buildProductJsonLd({
    siteUrl: 'https://resepomakueh.com',
    product,
  });
  expect(jsonLd).not.toBeNull();
  expect(jsonLd?.aggregateRating).toBeUndefined();
  const offers = jsonLd?.offers as Array<Record<string, unknown>>;
  expect(offers).toHaveLength(2);
  expect(offers[0].price).toBe(225000);
  expect(offers[0].availability).toBe('https://schema.org/InStock');
  // Unconfirmed status never fabricates InStock!
  expect(offers[1].availability).toBeUndefined();
});

it('builds Event JSON-LD only for upcoming non-cancelled class sessions', () => {
  const program: PublicClassProgram = {
    id: 'cls-1',
    title: 'ROK Kids Baking Studio',
    slug: 'kids-baking-studio',
    shortDescription: 'Kelas anak',
    description: 'Kelas dekorasi kue.',
    basePriceIdr: 275000,
    ageMin: 5,
    ageMax: 12,
    durationMinutes: 90,
    coverImageUrl:
      'https://example.supabase.co/storage/v1/object/public/class-images/cover.webp',
    coverAltText: 'Cover kelas',
    includedItems: ['Apron'],
    registerableSessionCount: 1,
    upcomingSessions: [
      {
        id: 'ses-past',
        programId: 'cls-1',
        branch: {
          id: 'br-1',
          code: 'surabaya',
          name: 'Surabaya',
          city: 'Surabaya',
          whatsappNumber: '6281703384308',
          address: 'Rungkut Asri Tengah V No. 22, Surabaya',
        },
        startsAt: '2026-06-20T03:00:00.000Z',
        endsAt: '2026-06-20T04:30:00.000Z',
        registrationDeadlineAt: '2026-06-19T00:00:00.000Z',
        capacity: 10,
        seatsLeft: 5,
        capacityIsEstimate: true,
        effectivePriceIdr: 275000,
        hasPriceOverride: false,
        status: 'scheduled',
        isRegistrationOpen: true,
        isRegisterable: true,
        unavailableReason: null,
      },
    ],
  };

  expect(
    buildClassEventJsonLd({
      siteUrl: 'https://resepomakueh.com',
      program,
      evaluatedAtIso: '2026-11-12T00:00:00.000Z',
    }),
  ).toBeNull();

  const futureProgram: PublicClassProgram = {
    ...program,
    upcomingSessions: [
      {
        ...program.upcomingSessions[0],
        id: 'ses-future',
        startsAt: '2026-12-05T03:00:00.000Z',
        endsAt: '2026-12-05T04:30:00.000Z',
        registrationDeadlineAt: '2026-12-04T00:00:00.000Z',
      },
    ],
  };

  const eventJsonLd = buildClassEventJsonLd({
    siteUrl: 'https://resepomakueh.com',
    program: futureProgram,
    evaluatedAtIso: '2026-11-12T00:00:00.000Z',
  });
  expect(eventJsonLd).toMatchObject({
    '@type': 'Event',
    name: 'ROK Kids Baking Studio',
    startDate: '2026-12-05T03:00:00.000Z',
  });
});

it('escapes HTML-sensitive characters in JSON-LD serialization and builds workable CSP without HTTP upgrade breaks', () => {
  const raw = serializeJsonLd({
    name: '</script><script>alert(1)</script> & kue',
  });
  expect(raw).not.toContain('</script>');
  expect(raw).toContain('\\u003c/script\\u003e');
  expect(raw).toContain('\\u0026');

  const localHttpCsp = buildContentSecurityPolicy({
    isProduction: true,
    siteUrl: 'http://127.0.0.1:3100',
    supabaseUrl: 'http://127.0.0.1:54321',
  });
  expect(localHttpCsp).not.toContain('upgrade-insecure-requests');
  expect(localHttpCsp).toContain('http://127.0.0.1:54321');
  expect(localHttpCsp).toContain('ws://127.0.0.1:54321');

  const prodHttpsHeaders = buildSecurityHeaders({
    isProduction: true,
    siteUrl: 'https://resepomakueh.com',
    supabaseUrl: 'https://demo.supabase.co',
  });
  const cspHeader = prodHttpsHeaders.find(
    (h) => h.key === 'Content-Security-Policy',
  );
  const hstsHeader = prodHttpsHeaders.find(
    (h) => h.key === 'Strict-Transport-Security',
  );
  expect(cspHeader?.value).toContain('upgrade-insecure-requests');
  expect(hstsHeader?.value).toContain('max-age=31536000');
});
