import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AdminOverviewView } from '@/components/admin/admin-overview-view';
import { AUTH_COPY } from '@/constants/auth.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getAdminOverview } from '@/features/admin-catalog/service.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const metadata: Metadata = {
  title: AUTH_COPY.ADMIN_META_TITLE,
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN);
  const initialOverview = await getAdminOverview(profile);
  return (
    <AdminOverviewView profile={profile} initialOverview={initialOverview} />
  );
}
