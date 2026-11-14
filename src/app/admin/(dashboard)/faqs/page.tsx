import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AdminFaqsView } from './_components/admin-faqs-view';
import { AdminForbiddenPanel } from '../_components/admin-forbidden-panel';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { listAdminFaqs } from '@/features/admin-catalog/cms-faqs-testimonials.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.FAQS.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

export default async function AdminFaqsPage() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_FAQS);
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  const initialData = await listAdminFaqs(profile);
  return <AdminFaqsView profile={profile} initialData={initialData} />;
}
