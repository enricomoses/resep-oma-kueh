import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AdminForbiddenPanel } from '../_components/admin-forbidden-panel';
import AdminLoading from '../../loading';
import { AdminPromotionsView } from './_components/admin-promotions-view';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { listAdminPromotions } from '@/features/admin-catalog/promotions.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const instant = false;

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.PROMOTIONS.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

async function AdminPromotionsContent() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_PROMOTIONS);
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  const initialData = await listAdminPromotions(profile);
  return <AdminPromotionsView profile={profile} initialData={initialData} />;
}

export default function AdminPromotionsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminPromotionsContent />
    </Suspense>
  );
}
