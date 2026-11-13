import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AdminGuardedShell } from '@/components/admin/admin-guarded-shell';
import { AUTH_COPY } from '@/constants/auth.constant';
import { ROUTES } from '@/constants/routes.constant';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const metadata: Metadata = {
  title: AUTH_COPY.ADMIN_META_TITLE,
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN);
  return <AdminGuardedShell initialProfile={profile} />;
}
