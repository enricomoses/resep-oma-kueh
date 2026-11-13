import 'server-only';

import { ROUTES } from '@/constants/routes.constant';
import {
  PUBLIC_STATIC_SITEMAP_ENTRIES,
  SITEMAP_LIMITS,
} from '@/constants/seo.constant';
import { isPublicClassProgramPublishReady } from '@/features/classes/service.server';
import { createPublicReadClient } from '@/lib/supabase/public-read.server';
import { resolveCanonicalUrl } from '@/utils/seo';

export interface SitemapRecord {
  url: string;
  lastModified?: Date;
  changeFrequency?:
    'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

interface RawSitemapProductRow {
  slug: string;
  updated_at: string;
  status: string;
  needs_owner_review: boolean;
  product_categories: Array<{
    categories: { status: string } | null;
  }> | null;
  product_variants: Array<{
    status: string;
    branch_variant_offers: Array<{ is_listed: boolean }> | null;
  }> | null;
}

interface RawSitemapClassRow {
  slug: string;
  updated_at: string;
  status: string;
  needs_owner_review: boolean;
  cover_is_approved: boolean;
  cover_storage_bucket: string;
  cover_image_path: string | null;
  cover_alt_text: string | null;
  description: string | null;
}

function isSitemapProductEligible(row: RawSitemapProductRow): boolean {
  if (row.status !== 'published' || row.needs_owner_review) {
    return false;
  }

  const hasPublishedCategory = (row.product_categories ?? []).some(
    (entry) => entry.categories?.status === 'published',
  );
  if (!hasPublishedCategory) {
    return false;
  }

  return (row.product_variants ?? []).some(
    (variant) =>
      variant.status === 'active' &&
      (variant.branch_variant_offers ?? []).some((offer) => offer.is_listed),
  );
}

export async function getDynamicSitemapEntries(
  siteUrl: string,
): Promise<SitemapRecord[]> {
  const staticEntries: SitemapRecord[] = PUBLIC_STATIC_SITEMAP_ENTRIES.map(
    (item) => ({
      url: resolveCanonicalUrl(siteUrl, item.path),
      changeFrequency: item.changeFrequency,
      priority: item.priority,
    }),
  );

  try {
    const client = createPublicReadClient();
    const signal = AbortSignal.timeout(SITEMAP_LIMITS.READ_TIMEOUT_MS);

    const [productsResult, classesResult] = await Promise.allSettled([
      client
        .from('products')
        .select(
          'slug,updated_at,status,needs_owner_review,product_categories(categories(status)),product_variants(status,branch_variant_offers(is_listed))',
        )
        .eq('status', 'published')
        .eq('needs_owner_review', false)
        .retry(false)
        .order('sort_order')
        .order('id')
        .limit(SITEMAP_LIMITS.MAX_PRODUCTS)
        .abortSignal(signal),
      client
        .from('class_programs')
        .select(
          'slug,updated_at,status,needs_owner_review,cover_is_approved,cover_storage_bucket,cover_image_path,cover_alt_text,description',
        )
        .eq('status', 'published')
        .eq('needs_owner_review', false)
        .eq('cover_is_approved', true)
        .retry(false)
        .order('title')
        .order('id')
        .limit(SITEMAP_LIMITS.MAX_CLASSES)
        .abortSignal(signal),
    ]);

    const dynamicEntries: SitemapRecord[] = [];

    if (productsResult.status === 'fulfilled' && !productsResult.value.error) {
      const productRows = (productsResult.value.data ??
        []) as unknown as RawSitemapProductRow[];
      for (const product of productRows) {
        if (!isSitemapProductEligible(product)) continue;
        const parsedDate = new Date(product.updated_at);
        dynamicEntries.push({
          url: resolveCanonicalUrl(siteUrl, `${ROUTES.MENU}/${product.slug}`),
          ...(Number.isNaN(parsedDate.getTime())
            ? {}
            : { lastModified: parsedDate }),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    if (classesResult.status === 'fulfilled' && !classesResult.value.error) {
      const classRows = (classesResult.value.data ??
        []) as unknown as RawSitemapClassRow[];
      for (const program of classRows) {
        if (!isPublicClassProgramPublishReady(program)) continue;
        const parsedDate = new Date(program.updated_at);
        dynamicEntries.push({
          url: resolveCanonicalUrl(
            siteUrl,
            `${ROUTES.CLASSES}/${program.slug}`,
          ),
          ...(Number.isNaN(parsedDate.getTime())
            ? {}
            : { lastModified: parsedDate }),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }

    return [...staticEntries, ...dynamicEntries];
  } catch {
    return staticEntries;
  }
}
