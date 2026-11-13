import type { Metadata } from 'next';
import { connection } from 'next/server';

import {
  type AdminClassBranchOption,
  AdminClassesView,
} from '@/components/admin/admin-classes-view';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { listAdminBranches } from '@/features/admin-catalog/branches.server';
import {
  listAdminClassPrograms,
  listAdminClassSessions,
} from '@/features/admin-catalog/classes.server';
import { requireAdminSession } from '@/features/auth/admin-guard.server';
import { getBranches } from '@/features/branches/service.server';

export const metadata: Metadata = {
  title: `${ADMIN_CATALOG_COPY.CLASSES.TITLE} · Admin Resep Oma Kueh`,
  robots: { index: false, follow: false },
};

export default async function AdminClassesPage() {
  await connection();
  const profile = await requireAdminSession(ROUTES.ADMIN_CLASSES);

  const [initialPrograms, initialSessions, branches] = await Promise.all([
    listAdminClassPrograms(profile),
    listAdminClassSessions(profile, {}),
    profile.role === 'owner'
      ? listAdminBranches(profile).then((result): AdminClassBranchOption[] =>
          result.branches.map((branch) => ({
            id: branch.id,
            code: branch.code,
            name: branch.name,
            city: branch.city,
            isActive: branch.isActive,
          })),
        )
      : getBranches().then((result): AdminClassBranchOption[] => {
          const allActive = result.items.map((branch) => ({
            id: branch.id,
            code: branch.code,
            name: branch.name,
            city: branch.city,
            isActive: true,
          }));
          if (!profile.branchId) return allActive;
          const own = allActive.filter(
            (branch) => branch.id === profile.branchId,
          );
          return own.length > 0 ? own : allActive;
        }),
  ]);

  return (
    <AdminClassesView
      profile={profile}
      initialPrograms={initialPrograms}
      initialSessions={initialSessions}
      branches={branches}
    />
  );
}
