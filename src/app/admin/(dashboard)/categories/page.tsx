import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AdminCategoriesView } from './_components/admin-categories-view';
import { AdminForbiddenPanel } from '../_components/admin-forbidden-panel';
import { AdminCategoriesSkeleton } from '../../_components/skeletons/admin-categories-skeleton';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { listAdminCategories } from '@/features/admin-catalog/service.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const instant = false;

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.CATEGORIES.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

async function AdminCategoriesContent() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_CATEGORIES);
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  const initialCategories = await listAdminCategories(profile);
  return (
    <AdminCategoriesView
      profile={profile}
      initialCategories={initialCategories}
    />
  );
}

export default function AdminCategoriesPage() {
  return (
    <Suspense fallback={<AdminCategoriesSkeleton />}>
      <AdminCategoriesContent />
    </Suspense>
  );
}
