import type { Metadata } from 'next';
import { connection } from 'next/server';
import { HomeView } from './_components/home-view';
import { StructuredDataScript } from '@/components/common/structured-data-script';
import { getPublicEnvironment } from '@/config/environment.client';
import { APP, ROUTES } from '@/constants';
import { FOUNDATION_COPY } from '@/constants/ui.constant';
import { APPROVED_CONTACTS } from '@/features/branches/contacts.server';
import { getInitialBranches } from '@/features/branches/service.server';
import { getHomeData } from '@/features/home/service.server';
import { buildPageMetadata } from '@/utils/seo';
import { buildBakeryJsonLd } from '@/utils/structured-data';

export const metadata: Metadata = buildPageMetadata({
  title: APP.NAME,
  description: FOUNDATION_COPY.META,
  path: ROUTES.HOME,
});

export default async function Home() {
  await connection();
  const [data, initialBranches] = await Promise.all([
    getHomeData(),
    getInitialBranches(),
  ]);
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnvironment();

  const structuredBranches =
    initialBranches.status === 'success' &&
    initialBranches.data.items.length > 0
      ? initialBranches.data.items
      : APPROVED_CONTACTS.branches;
  const bakeryJsonLd = buildBakeryJsonLd({
    siteUrl: NEXT_PUBLIC_SITE_URL,
    email: APPROVED_CONTACTS.email,
    instagramUrl: APPROVED_CONTACTS.instagramUrl,
    branches: structuredBranches,
  });

  return (
    <>
      <StructuredDataScript data={bakeryJsonLd} />
      <HomeView data={data} contacts={APPROVED_CONTACTS} />
    </>
  );
}
