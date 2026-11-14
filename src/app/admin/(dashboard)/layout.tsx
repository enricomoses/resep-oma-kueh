import type { ReactNode } from 'react';
import { connection } from 'next/server';

import { AdminShell } from './_components/admin-shell';
import { ROUTES } from '@/constants/routes.constant';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

export default async function AdminDashboardLayout({
  children,
}: AdminDashboardLayoutProps) {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN);
  return <AdminShell initialProfile={profile}>{children}</AdminShell>;
}
