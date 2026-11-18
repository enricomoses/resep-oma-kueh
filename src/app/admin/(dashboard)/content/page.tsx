import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AdminContentView } from './_components/admin-content-view';
import { AdminForbiddenPanel } from '../_components/admin-forbidden-panel';
import { AdminContentSkeleton } from '../../_components/skeletons/admin-content-skeleton';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { listAdminCmsEntries } from '@/features/admin-catalog/cms-content.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const instant = false;

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.CMS.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

async function AdminContentBody() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_CONTENT);
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  const initialData = await listAdminCmsEntries(profile);
  return <AdminContentView profile={profile} initialData={initialData} />;
}

export default function AdminContentPage() {
  return (
    <Suspense fallback={<AdminContentSkeleton />}>
      <AdminContentBody />
    </Suspense>
  );
}
