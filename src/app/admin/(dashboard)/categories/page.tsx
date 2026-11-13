import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AdminCategoriesView } from '@/components/admin/admin-categories-view';
import { AdminForbiddenPanel } from '@/components/admin/admin-forbidden-panel';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { listAdminCategories } from '@/features/admin-catalog/service.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.CATEGORIES.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
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
