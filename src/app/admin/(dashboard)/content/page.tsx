import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AdminContentView } from '@/components/admin/admin-content-view';
import { AdminForbiddenPanel } from '@/components/admin/admin-forbidden-panel';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { listAdminCmsEntries } from '@/features/admin-catalog/cms-content.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.CMS.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

export default async function AdminContentPage() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_CONTENT);
  if (profile.role !== 'owner') {
    return <AdminForbiddenPanel />;
  }

  const initialData = await listAdminCmsEntries(profile);
  return <AdminContentView profile={profile} initialData={initialData} />;
}
