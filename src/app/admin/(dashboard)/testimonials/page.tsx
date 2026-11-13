import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AdminForbiddenPanel } from '@/components/admin/admin-forbidden-panel';
import { AdminTestimonialsView } from '@/components/admin/admin-testimonials-view';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { listAdminTestimonials } from '@/features/admin-catalog/cms-faqs-testimonials.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.TESTIMONIALS.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

export default async function AdminTestimonialsPage() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_TESTIMONIALS);
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  const initialData = await listAdminTestimonials(profile);
  return <AdminTestimonialsView profile={profile} initialData={initialData} />;
}
