import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { FaqView } from './_components/faq-view';
import SiteLoading from '../loading';
import { StructuredDataScript } from '@/components/common/structured-data-script';
import { getPublicEnvironment } from '@/config/environment.client';
import { PAGE_METADATA } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getInitialPublicFaqs } from '@/features/content/service.server';
import { buildPageMetadata } from '@/utils/seo';
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from '@/utils/structured-data';

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_METADATA.FAQ.title,
  description: PAGE_METADATA.FAQ.description,
  path: ROUTES.FAQ,
});

async function FaqContent() {
  await connection();
  const initial = await getInitialPublicFaqs();
  const siteUrl = getPublicEnvironment().NEXT_PUBLIC_SITE_URL;
  const faqJsonLd =
    initial.status === 'success'
      ? buildFaqJsonLd({ faqs: initial.data.items })
      : null;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd({
    siteUrl,
    items: [
      { name: 'Beranda', path: ROUTES.HOME },
      { name: 'FAQ', path: ROUTES.FAQ },
    ],
  });
  return (
    <>
      <StructuredDataScript data={faqJsonLd} />
      <StructuredDataScript data={breadcrumbJsonLd} />
      <FaqView initial={initial} />
    </>
  );
}

export default function FaqPage() {
  return (
    <Suspense fallback={<SiteLoading />}>
      <FaqContent />
    </Suspense>
  );
}
