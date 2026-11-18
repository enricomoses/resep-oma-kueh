import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/stat-card.css';
import '@/styles/features/admin-overview.css';
import { cn } from '@/utils';

import { AdminSectionHeaderSkeleton } from './admin-section-header-skeleton';
import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminOverviewSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AdminOverviewView bento metrics and module directory. */
export function AdminOverviewSkeleton({
  className,
}: AdminOverviewSkeletonProps) {
  return (
    <AdminSkeletonFrame
      className={cn('admin-section admin-overview-section', className)}
    >
      <AdminSectionHeaderSkeleton buttonCount={1} />

      <div className="admin-overview-grid admin-overview-grid--owner">
        {Array.from({ length: 5 }, (_, idx) => (
          <Card key={idx} tone="surface" className="admin-stat-card">
            <div className="admin-stat-head">
              <Skeleton width="8.5rem" height="0.875rem" />
              <Skeleton width="1.75rem" height="1.75rem" radius="sm" />
            </div>

            <div className="admin-stat-body">
              <Skeleton width="3.25rem" height="2.25rem" />
              <div className="admin-skel-inline-row">
                <Skeleton width="0.5rem" height="0.5rem" radius="circle" />
                <Skeleton width="10rem" height="0.8125rem" />
              </div>
            </div>

            <div className="admin-stat-footer">
              <Skeleton width="8rem" height="0.8125rem" />
              <Skeleton width="5.5rem" height="0.8125rem" />
            </div>
          </Card>
        ))}
      </div>

      <Card tone="surface" className="admin-directory-card">
        <div className="admin-directory-head">
          <Skeleton width="11rem" height="1.125rem" />
          <Skeleton width="min(36rem, 90%)" height="0.875rem" />
        </div>

        <div className="admin-directory-groups admin-directory-groups--two">
          {[4, 5].map((itemCount, groupIdx) => (
            <div key={groupIdx} className="admin-directory-group">
              <div className="admin-directory-group-label">
                <Skeleton width="11rem" height="0.75rem" />
              </div>
              <ul className="admin-directory-list">
                {Array.from({ length: itemCount }, (_, rowIdx) => (
                  <li key={rowIdx} className="admin-directory-item">
                    <div className="admin-directory-link">
                      <div className="admin-directory-link-main">
                        <Skeleton width="1rem" height="1rem" radius="sm" />
                        <Skeleton
                          width={rowIdx % 2 === 0 ? '12.5rem' : '14.5rem'}
                          height="0.875rem"
                        />
                      </div>
                      <Skeleton width="1rem" height="1rem" radius="sm" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </AdminSkeletonFrame>
  );
}
