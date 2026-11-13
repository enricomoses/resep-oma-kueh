import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AdminForbiddenPanel } from '@/components/admin/admin-forbidden-panel';
import { AdminProductsView } from '@/components/admin/admin-products-view';
import {
  ADMIN_CATALOG_COPY,
  ADMIN_CATALOG_LIMITS,
} from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import {
  listAdminCategories,
  listAdminProducts,
} from '@/features/admin-catalog/service.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.PRODUCTS.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_PRODUCTS);
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  const [initialProducts, initialCategories] = await Promise.all([
    listAdminProducts(profile, {
      page: ADMIN_CATALOG_LIMITS.DEFAULT_PAGE,
      limit: ADMIN_CATALOG_LIMITS.DEFAULT_LIMIT,
    }),
    listAdminCategories(profile),
  ]);

  return (
    <AdminProductsView
      profile={profile}
      initialProducts={initialProducts}
      initialCategories={initialCategories}
    />
  );
}
