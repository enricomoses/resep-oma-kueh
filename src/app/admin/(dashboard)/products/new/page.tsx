import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AdminForbiddenPanel } from '../../_components/admin-forbidden-panel';
import { AdminProductCreateSkeleton } from '../../../_components/skeletons/admin-product-create-skeleton';
import { AdminProductCreateView } from './_components/admin-product-create-view';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const instant = false;

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.PRODUCT_EDITOR.CREATE_PAGE_TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

async function AdminNewProductContent() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_PRODUCTS_NEW);
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  return <AdminProductCreateView />;
}

export default function AdminNewProductPage() {
  return (
    <Suspense fallback={<AdminProductCreateSkeleton />}>
      <AdminNewProductContent />
    </Suspense>
  );
}
