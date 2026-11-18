import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { ContactView } from './_components/contact-view';
import { SiteContactSkeleton } from '../_components/skeletons/site-contact-skeleton';
import { StructuredDataScript } from '@/components/common/structured-data-script';
import { getPublicEnvironment } from '@/config/environment.client';
import { PAGE_METADATA } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getContactPageData } from '@/features/content/service.server';
import { buildPageMetadata } from '@/utils/seo';
import {
  buildBakeryJsonLd,
  buildBreadcrumbJsonLd,
} from '@/utils/structured-data';

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_METADATA.CONTACT.title,
  description: PAGE_METADATA.CONTACT.description,
  path: ROUTES.CONTACT,
});

async function ContactContent() {
  await connection();
  const data = await getContactPageData();
  const siteUrl = getPublicEnvironment().NEXT_PUBLIC_SITE_URL;
  const bakeryJsonLd = buildBakeryJsonLd({
    siteUrl,
    email: data.email,
    instagramUrl: data.instagramUrl,
    branches: data.branches,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd({
    siteUrl,
    items: [
      { name: 'Beranda', path: ROUTES.HOME },
      { name: 'Contact', path: ROUTES.CONTACT },
    ],
  });

  return (
    <>
      <StructuredDataScript data={bakeryJsonLd} />
      <StructuredDataScript data={breadcrumbJsonLd} />
      <ContactView data={data} />
    </>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<SiteContactSkeleton />}>
      <ContactContent />
    </Suspense>
  );
}
