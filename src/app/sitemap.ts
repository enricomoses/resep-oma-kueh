import type { MetadataRoute } from 'next';
import { connection } from 'next/server';

import { getPublicEnvironment } from '@/config/environment.client';
import { getDynamicSitemapEntries } from '@/features/seo/sitemap.server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnvironment();
  return getDynamicSitemapEntries(NEXT_PUBLIC_SITE_URL);
}
