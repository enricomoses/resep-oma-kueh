import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AdminForbiddenPanel } from '../_components/admin-forbidden-panel';
import { AdminPromotionsView } from './_components/admin-promotions-view';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { listAdminPromotions } from '@/features/admin-catalog/promotions.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.PROMOTIONS.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

export default async function AdminPromotionsPage() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_PROMOTIONS);
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  const initialData = await listAdminPromotions(profile);
  return <AdminPromotionsView profile={profile} initialData={initialData} />;
}
