import type { Metadata } from 'next';
import { connection } from 'next/server';
import { FaqView } from '@/components/content/faq-view';
import { PAGE_METADATA } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getInitialPublicFaqs } from '@/features/content/service.server';

export const metadata: Metadata = {
  title: PAGE_METADATA.FAQ.title,
  description: PAGE_METADATA.FAQ.description,
  alternates: { canonical: ROUTES.FAQ },
};

export default async function FaqPage() {
  await connection();
  const initial = await getInitialPublicFaqs();
  return <FaqView initial={initial} />;
}
