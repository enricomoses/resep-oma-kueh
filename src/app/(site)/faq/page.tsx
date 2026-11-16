import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { FaqView } from './_components/faq-view';
import SiteLoading from '../loading';
import { PAGE_METADATA } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getInitialPublicFaqs } from '@/features/content/service.server';
import { buildPageMetadata } from '@/utils/seo';

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_METADATA.FAQ.title,
  description: PAGE_METADATA.FAQ.description,
  path: ROUTES.FAQ,
});

async function FaqContent() {
  await connection();
  const initial = await getInitialPublicFaqs();
  return <FaqView initial={initial} />;
}

export default function FaqPage() {
  return (
    <Suspense fallback={<SiteLoading />}>
      <FaqContent />
    </Suspense>
  );
}
