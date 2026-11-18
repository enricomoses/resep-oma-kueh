import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/features/admin-locations.css';
import { cn } from '@/utils';

import { AdminSectionHeaderSkeleton } from './admin-section-header-skeleton';
import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminLocationsSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AdminLocationsView readiness card, branch tabs, profile, and hours. */
export function AdminLocationsSkeleton({
  className,
}: AdminLocationsSkeletonProps) {
  return (
    <AdminSkeletonFrame
      className={cn('admin-section admin-loc-section', className)}
    >
      <AdminSectionHeaderSkeleton buttonCount={1} />

      <Card tone="surface" className="admin-readiness-card">
        <Skeleton width="12rem" height="1rem" />
        <div className="admin-readiness-notes">
          <Skeleton width="min(26rem, 90%)" height="0.875rem" />
          <Skeleton width="min(28rem, 95%)" height="0.875rem" />
        </div>
        <div className="admin-readiness-branches">
          {[0, 1].map((branchIdx) => (
            <div key={branchIdx} className="admin-readiness-branch">
              <Skeleton width="6rem" height="0.9375rem" />
              <div className="admin-readiness-indicators">
                <Skeleton width="5.5rem" height="0.8125rem" />
                <Skeleton width="6rem" height="0.8125rem" />
                <Skeleton width="7rem" height="0.8125rem" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="admin-loc-tabs">
        <Skeleton width="11rem" height="2.375rem" radius="sm" />
        <Skeleton width="12.5rem" height="2.375rem" radius="sm" />
      </div>

      <div className="admin-locations-stack">
        <Card tone="surface" className="admin-locations-panel">
          <div className="admin-section-header">
            <div className="admin-skel-header-copy">
              <Skeleton width="13rem" height="1.125rem" />
              <Skeleton width="10rem" height="0.875rem" />
            </div>
            <Skeleton width="8.5rem" height="0.875rem" />
          </div>

          <div className="admin-location-form">
            <div className="admin-loc-form-group">
              <Skeleton width="8rem" height="0.75rem" />
              <div className="admin-loc-grid-2">
                <div className="admin-skel-field">
                  <Skeleton width="6rem" height="0.8125rem" />
                  <Skeleton width="100%" height="3rem" radius="md" />
                </div>
                <div className="admin-skel-field">
                  <Skeleton width="4rem" height="0.8125rem" />
                  <Skeleton width="100%" height="3rem" radius="md" />
                </div>
              </div>
              <Skeleton width="100%" height="4.5rem" radius="md" />
            </div>

            <div className="admin-loc-form-group">
              <Skeleton width="8rem" height="0.75rem" />
              <Skeleton width="100%" height="3rem" radius="md" />
              <div className="admin-wa-preview-box">
                <Skeleton width="15rem" height="0.875rem" />
              </div>
            </div>

            <div className="admin-loc-form-footer">
              <Skeleton width="12.5rem" height="2.5rem" radius="pill" />
            </div>
          </div>
        </Card>

        <Card tone="surface" className="admin-locations-panel">
          <div className="admin-section-header">
            <div className="admin-skel-header-copy">
              <Skeleton width="15rem" height="1.125rem" />
              <Skeleton width="min(26rem, 90%)" height="0.875rem" />
            </div>
            <Skeleton width="8rem" height="0.875rem" />
          </div>

          <ul className="admin-hours-list">
            {Array.from({ length: 7 }, (_, dayIdx) => (
              <li key={dayIdx} className="admin-hours-row">
                <div className="admin-hours-day-header">
                  <Skeleton width="4.5rem" height="0.9375rem" />
                  <Skeleton width="6.5rem" height="0.8125rem" />
                </div>
                <div className="admin-hours-controls">
                  <Skeleton width="4rem" height="1.25rem" />
                  <Skeleton width="100%" height="2.5rem" radius="md" />
                  <Skeleton width="100%" height="2.5rem" radius="md" />
                  <Skeleton width="100%" height="2.5rem" radius="md" />
                  <Skeleton width="8.5rem" height="2.25rem" radius="pill" />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AdminSkeletonFrame>
  );
}
