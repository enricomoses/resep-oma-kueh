import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AdminForbiddenPanel } from '../_components/admin-forbidden-panel';
import { AdminTestimonialsSkeleton } from '../../_components/skeletons/admin-testimonials-skeleton';
import { AdminTestimonialsView } from './_components/admin-testimonials-view';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { listAdminTestimonials } from '@/features/admin-catalog/cms-faqs-testimonials.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const instant = false;

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.TESTIMONIALS.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

async function AdminTestimonialsContent() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_TESTIMONIALS);
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  const initialData = await listAdminTestimonials(profile);
  return <AdminTestimonialsView profile={profile} initialData={initialData} />;
}

export default function AdminTestimonialsPage() {
  return (
    <Suspense fallback={<AdminTestimonialsSkeleton />}>
      <AdminTestimonialsContent />
    </Suspense>
  );
}
