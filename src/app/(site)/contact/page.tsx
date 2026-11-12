import type { Metadata } from 'next';
import { connection } from 'next/server';
import { ContactView } from '@/components/content/contact-view';
import { PAGE_METADATA } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getContactPageData } from '@/features/content/service.server';

export const metadata: Metadata = {
  title: PAGE_METADATA.CONTACT.title,
  description: PAGE_METADATA.CONTACT.description,
  alternates: { canonical: ROUTES.CONTACT },
};

export default async function ContactPage() {
  await connection();
  const data = await getContactPageData();
  return <ContactView data={data} />;
}
