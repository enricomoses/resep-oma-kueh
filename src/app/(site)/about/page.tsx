import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { AboutView } from './_components/about-view';
import SiteLoading from '../loading';
import { StructuredDataScript } from '@/components/common/structured-data-script';
import { getPublicEnvironment } from '@/config/environment.client';
import { PAGE_METADATA } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getInitialPublicContent } from '@/features/content/service.server';
import { buildPageMetadata } from '@/utils/seo';
import { buildBreadcrumbJsonLd } from '@/utils/structured-data';

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_METADATA.ABOUT.title,
  description: PAGE_METADATA.ABOUT.description,
  path: ROUTES.ABOUT,
});

async function AboutContent() {
  await connection();
  const initial = await getInitialPublicContent([
    'about.story',
    'about.values',
  ]);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd({
    siteUrl: getPublicEnvironment().NEXT_PUBLIC_SITE_URL,
    items: [
      { name: 'Beranda', path: ROUTES.HOME },
      { name: 'Tentang Oma', path: ROUTES.ABOUT },
    ],
  });
  return (
    <>
      <StructuredDataScript data={breadcrumbJsonLd} />
      <AboutView initial={initial} />
    </>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={<SiteLoading />}>
      <AboutContent />
    </Suspense>
  );
}
