import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AdminForbiddenPanel } from '../../_components/admin-forbidden-panel';
import { AdminProductCreateView } from './_components/admin-product-create-view';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.PRODUCT_EDITOR.CREATE_PAGE_TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

export default async function AdminNewProductPage() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_PRODUCTS_NEW);
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  return <AdminProductCreateView />;
}
