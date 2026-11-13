import { ROUTES } from '@/constants/routes.constant';
import { APP } from '@/constants/app.constant';
import type { ProductDetail } from '@/types/catalog';
import type { PublicClassProgram } from '@/types/classes';
import { resolveCanonicalUrl } from '@/utils/seo';

interface StructuredBranchHour {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
}

interface StructuredBranchInput {
  code: string;
  name: string;
  city?: string | null;
  whatsappNumber: string;
  address: string | null;
  hours?: readonly StructuredBranchHour[];
}

export interface BakeryJsonLdInput {
  siteUrl: string;
  email: string;
  instagramUrl?: string | null;
  branches: readonly StructuredBranchInput[];
}

const SCHEMA_DAYS = [
  'https://schema.org/Sunday',
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
] as const;

function normalizeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export function buildBakeryJsonLd({
  siteUrl,
  email,
  instagramUrl,
  branches,
}: BakeryJsonLdInput): Record<string, unknown> {
  const safeInstagram = normalizeHttpUrl(instagramUrl);
  const subOrganizations = branches.map((branch) => {
    const openingHoursSpecification = (branch.hours ?? [])
      .filter(
        (hour) =>
          !hour.isClosed &&
          Boolean(hour.opensAt) &&
          Boolean(hour.closesAt) &&
          SCHEMA_DAYS[hour.dayOfWeek] !== undefined,
      )
      .map((hour) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: SCHEMA_DAYS[hour.dayOfWeek],
        opens: hour.opensAt,
        closes: hour.closesAt,
      }));

    return {
      '@type': 'Bakery',
      name: `${APP.NAME} — ${branch.name}`,
      telephone: `+${branch.whatsappNumber.replace(/\D/g, '')}`,
      ...(branch.address
        ? {
            address: {
              '@type': 'PostalAddress',
              streetAddress: branch.address,
              ...(branch.city ? { addressLocality: branch.city } : {}),
              addressCountry: 'ID',
            },
          }
        : {}),
      ...(openingHoursSpecification.length > 0
        ? { openingHoursSpecification }
        : {}),
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: APP.NAME,
    url: resolveCanonicalUrl(siteUrl, ROUTES.HOME),
    email,
    ...(safeInstagram ? { sameAs: [safeInstagram] } : {}),
    ...(subOrganizations.length > 0 ? { department: subOrganizations } : {}),
  };
}

function mapVariantSchemaAvailability(
  availabilityStatus: string,
): string | undefined {
  if (availabilityStatus === 'available') {
    return 'https://schema.org/InStock';
  }
  if (availabilityStatus === 'sold_out') {
    return 'https://schema.org/OutOfStock';
  }
  return undefined;
}

export function buildProductJsonLd({
  siteUrl,
  product,
}: {
  siteUrl: string;
  product: ProductDetail | null;
}): Record<string, unknown> | null {
  if (!product) {
    return null;
  }

  const productUrl = resolveCanonicalUrl(
    siteUrl,
    `${ROUTES.MENU}/${product.slug}`,
  );
  const imageUrls = product.images
    .map((img) => normalizeHttpUrl(img.publicUrl))
    .filter((url): url is string => url !== null);

  const pricedOffers = product.offeredVariants
    .filter((variant) => variant.effectivePriceIdr > 0)
    .map((variant) => {
      const availability = mapVariantSchemaAvailability(
        variant.availabilityStatus,
      );
      return {
        '@type': 'Offer',
        priceCurrency: 'IDR',
        price: variant.effectivePriceIdr,
        sku: variant.sku,
        url: product.resolvedBranchCode
          ? `${productUrl}?branch=${encodeURIComponent(product.resolvedBranchCode)}`
          : productUrl,
        ...(availability ? { availability } : {}),
      };
    });

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description || undefined,
    url: productUrl,
    brand: {
      '@type': 'Brand',
      name: APP.NAME,
    },
    ...(product.primaryCategory?.name
      ? { category: product.primaryCategory.name }
      : {}),
    ...(imageUrls.length > 0 ? { image: imageUrls } : {}),
    ...(pricedOffers.length === 1
      ? { offers: pricedOffers[0] }
      : pricedOffers.length > 1
        ? { offers: pricedOffers }
        : {}),
  };
}

export function buildClassEventJsonLd({
  siteUrl,
  program,
  evaluatedAtIso,
}: {
  siteUrl: string;
  program: PublicClassProgram | null;
  evaluatedAtIso: string;
}): Record<string, unknown> | null {
  if (!program) {
    return null;
  }

  const evaluatedMs = new Date(evaluatedAtIso).getTime();
  const futureSession = program.upcomingSessions.find((session) => {
    const startMs = new Date(session.startsAt).getTime();
    return (
      Number.isFinite(startMs) &&
      startMs >= evaluatedMs &&
      session.status !== 'cancelled' &&
      session.status !== 'completed'
    );
  });

  if (!futureSession) {
    return null;
  }

  const eventUrl = resolveCanonicalUrl(
    siteUrl,
    `${ROUTES.CLASSES}/${program.slug}`,
  );
  const safeImage = normalizeHttpUrl(program.coverImageUrl);
  const offerAvailability = futureSession.isRegisterable
    ? 'https://schema.org/InStock'
    : futureSession.status === 'full'
      ? 'https://schema.org/SoldOut'
      : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: program.title,
    description: program.shortDescription || program.description,
    url: eventUrl,
    startDate: futureSession.startsAt,
    endDate: futureSession.endsAt,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    ...(safeImage ? { image: [safeImage] } : {}),
    location: {
      '@type': 'Place',
      name: `${APP.NAME} — ${futureSession.branch.name}`,
      ...(futureSession.branch.address
        ? {
            address: {
              '@type': 'PostalAddress',
              streetAddress: futureSession.branch.address,
              addressCountry: 'ID',
            },
          }
        : {}),
    },
    organizer: {
      '@type': 'Organization',
      name: APP.NAME,
      url: resolveCanonicalUrl(siteUrl, ROUTES.HOME),
    },
    ...(futureSession.effectivePriceIdr > 0
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'IDR',
            price: futureSession.effectivePriceIdr,
            url: `${eventUrl}?branch=${encodeURIComponent(futureSession.branch.code)}`,
            ...(offerAvailability ? { availability: offerAvailability } : {}),
          },
        }
      : {}),
  };
}
