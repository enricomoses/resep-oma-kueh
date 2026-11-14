import type { Metadata } from 'next';
import { connection } from 'next/server';
import { ContactView } from './_components/contact-view';
import { StructuredDataScript } from '@/components/common/structured-data-script';
import { getPublicEnvironment } from '@/config/environment.client';
import { PAGE_METADATA } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getContactPageData } from '@/features/content/service.server';
import { buildPageMetadata } from '@/utils/seo';
import { buildBakeryJsonLd } from '@/utils/structured-data';

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_METADATA.CONTACT.title,
  description: PAGE_METADATA.CONTACT.description,
  path: ROUTES.CONTACT,
});

export default async function ContactPage() {
  await connection();
  const data = await getContactPageData();
  const bakeryJsonLd = buildBakeryJsonLd({
    siteUrl: getPublicEnvironment().NEXT_PUBLIC_SITE_URL,
    email: data.email,
    instagramUrl: data.instagramUrl,
    branches: data.branches,
  });

  return (
    <>
      <StructuredDataScript data={bakeryJsonLd} />
      <ContactView data={data} />
    </>
  );
}
