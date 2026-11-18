import type { ReactNode } from 'react';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AdminShell } from './_components/admin-shell';
import { AdminOverviewSkeleton } from '../_components/skeletons/admin-overview-skeleton';
import { AdminWorkspaceSkeleton } from '../_components/skeletons/admin-workspace-skeleton';
import { ROUTES } from '@/constants/routes.constant';
import { requireAdminSession } from '@/features/auth/admin-guard.server';
import '@/styles/layouts/admin-workspace.css';
import '@/styles/features/admin-shared.css';

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

export const instant = false;

async function AdminDashboardGate({ children }: AdminDashboardLayoutProps) {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN);
  return <AdminShell initialProfile={profile}>{children}</AdminShell>;
}

export default function AdminDashboardLayout({
  children,
}: AdminDashboardLayoutProps) {
  return (
    <Suspense
      fallback={
        <AdminWorkspaceSkeleton>
          <AdminOverviewSkeleton />
        </AdminWorkspaceSkeleton>
      }
    >
      <AdminDashboardGate>{children}</AdminDashboardGate>
    </Suspense>
  );
}
