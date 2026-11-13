import type { Metadata } from 'next';
import { connection } from 'next/server';
import { AboutView } from '@/components/content/about-view';
import { PAGE_METADATA } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getInitialPublicContent } from '@/features/content/service.server';
import { buildPageMetadata } from '@/utils/seo';

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_METADATA.ABOUT.title,
  description: PAGE_METADATA.ABOUT.description,
  path: ROUTES.ABOUT,
});

export default async function AboutPage() {
  await connection();
  const initial = await getInitialPublicContent([
    'about.story',
    'about.values',
  ]);
  return <AboutView initial={initial} />;
}
