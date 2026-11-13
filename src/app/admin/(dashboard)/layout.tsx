import type { ReactNode } from 'react';
import { connection } from 'next/server';

import { ROUTES } from '@/constants/routes.constant';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

export default async function AdminDashboardLayout({
  children,
}: AdminDashboardLayoutProps) {
  await connection();
  await requireAdminSession(ROUTES.ADMIN);
  return <>{children}</>;
}
