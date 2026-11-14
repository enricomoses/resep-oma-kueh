import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AdminForbiddenPanel } from '../_components/admin-forbidden-panel';
import { AdminLocationsView } from './_components/admin-locations-view';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { listAdminBranches } from '@/features/admin-catalog/branches.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.LOCATIONS.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

export default async function AdminLocationsPage() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_LOCATIONS);
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  const initialData = await listAdminBranches(profile);
  return <AdminLocationsView profile={profile} initialData={initialData} />;
}
