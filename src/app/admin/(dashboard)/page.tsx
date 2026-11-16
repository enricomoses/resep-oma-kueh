import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AdminOverviewView } from './_components/admin-overview-view';
import AdminLoading from '../loading';
import { AUTH_COPY } from '@/constants/auth.constant';
import { ROUTES } from '@/constants/routes.constant';
import { getAdminOverview } from '@/features/admin-catalog/service.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const instant = false;

export const metadata: Metadata = {
  title: AUTH_COPY.ADMIN_META_TITLE,
  robots: { index: false, follow: false },
};

async function AdminDashboardContent() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN);
  const initialOverview = await getAdminOverview(profile);
  return (
    <AdminOverviewView profile={profile} initialOverview={initialOverview} />
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
