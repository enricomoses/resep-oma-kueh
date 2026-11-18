import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/features/admin-availability.css';
import { cn } from '@/utils';

import { AdminSectionHeaderSkeleton } from './admin-section-header-skeleton';
import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminAvailabilitySkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AdminAvailabilityView filters, bulk bar, and SKU panel. */
export function AdminAvailabilitySkeleton({
  className,
}: AdminAvailabilitySkeletonProps) {
  return (
    <AdminSkeletonFrame
      className={cn('admin-section admin-avail-section', className)}
    >
      <AdminSectionHeaderSkeleton buttonCount={1} />

      <Skeleton width="min(32rem, 90%)" height="0.875rem" />

      <Card tone="surface" className="admin-avail-filter-card">
        <div className="admin-avail-filter-grid">
          {Array.from({ length: 4 }, (_, idx) => (
            <div key={idx} className="admin-skel-field">
              <Skeleton width="5.5rem" height="0.8125rem" />
              <Skeleton width="100%" height="2.5rem" radius="md" />
            </div>
          ))}
        </div>
      </Card>

      <div className="admin-avail-bulk-bar">
        <div className="admin-avail-bulk-head">
          <div className="admin-avail-bulk-title-wrap admin-skel-stack-sm">
            <Skeleton width="14rem" height="0.9375rem" />
            <Skeleton width="18rem" height="0.8125rem" />
          </div>
          <Skeleton width="11.5rem" height="2.25rem" radius="pill" />
        </div>
      </div>

      <Card tone="surface" className="admin-avail-panel">
        <ul className="admin-avail-list">
          {Array.from({ length: 4 }, (_, idx) => (
            <li key={idx} className="admin-avail-row">
              <div className="admin-avail-row-head">
                <div className="admin-avail-title-group">
                  <Skeleton width="1.125rem" height="1.125rem" radius="sm" />
                  <div className="admin-avail-identity">
                    <div className="admin-avail-name-line">
                      <Skeleton width="15rem" height="1rem" />
                      <Skeleton width="4.5rem" height="1.25rem" radius="pill" />
                    </div>
                    <Skeleton width="8.5rem" height="0.8125rem" />
                  </div>
                </div>

                <div className="admin-avail-summary">
                  <div className="admin-skel-inline-row">
                    <Skeleton width="0.5rem" height="0.5rem" radius="circle" />
                    <Skeleton width="5rem" height="0.8125rem" />
                  </div>
                  <Skeleton width="5.5rem" height="0.9375rem" />
                </div>
              </div>

              <div className="admin-avail-controls admin-avail-controls--owner">
                <div className="admin-avail-toggle-col">
                  <Skeleton width="8.5rem" height="1rem" />
                  <Skeleton width="6rem" height="0.75rem" />
                </div>
                <div className="admin-skel-field">
                  <Skeleton width="6rem" height="0.75rem" />
                  <Skeleton width="100%" height="2.5rem" radius="md" />
                </div>
                <div className="admin-skel-field">
                  <Skeleton width="5rem" height="0.75rem" />
                  <Skeleton width="100%" height="2.5rem" radius="md" />
                </div>
                <div className="admin-skel-field">
                  <Skeleton width="6rem" height="0.75rem" />
                  <Skeleton width="100%" height="2.5rem" radius="md" />
                </div>
                <div className="admin-skel-field">
                  <Skeleton width="6.5rem" height="0.75rem" />
                  <Skeleton width="100%" height="2.5rem" radius="md" />
                </div>
                <div className="admin-avail-save-col">
                  <Skeleton width="7.25rem" height="2.25rem" radius="pill" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </AdminSkeletonFrame>
  );
}
