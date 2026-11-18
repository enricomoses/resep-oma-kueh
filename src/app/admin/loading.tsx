import { AdminOverviewSkeleton } from './_components/skeletons/admin-overview-skeleton';
import { AdminWorkspaceSkeleton } from './_components/skeletons/admin-workspace-skeleton';

export default function AdminLoading() {
  return (
    <AdminWorkspaceSkeleton>
      <AdminOverviewSkeleton />
    </AdminWorkspaceSkeleton>
  );
}
