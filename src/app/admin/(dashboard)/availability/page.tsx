import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AdminAvailabilityView } from './_components/admin-availability-view';
import {
  ADMIN_BRANCH_LIMITS,
  ADMIN_CATALOG_COPY,
} from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { listAdminAvailability } from '@/features/admin-catalog/availability.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.AVAILABILITY.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

export default async function AdminAvailabilityPage() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_AVAILABILITY);
  const initialData = await listAdminAvailability(profile, {
    search: undefined,
    listed: 'all',
    page: 1,
    pageSize: ADMIN_BRANCH_LIMITS.AVAILABILITY_PAGE_SIZE,
  });

  return <AdminAvailabilityView profile={profile} initialData={initialData} />;
}
