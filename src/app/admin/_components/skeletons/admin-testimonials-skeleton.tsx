import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/features/admin-testimonials.css';
import { cn } from '@/utils';

import { AdminSectionHeaderSkeleton } from './admin-section-header-skeleton';
import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminTestimonialsSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AdminTestimonialsView preview card and consent directory. */
export function AdminTestimonialsSkeleton({
  className,
}: AdminTestimonialsSkeletonProps) {
  return (
    <AdminSkeletonFrame
      className={cn('admin-section admin-testi-section', className)}
    >
      <AdminSectionHeaderSkeleton buttonCount={2} />

      <Skeleton width="100%" height="3.25rem" radius="md" />

      <Card tone="surface" className="admin-testi-preview-card">
        <div className="admin-testi-preview-head">
          <Skeleton width="14rem" height="1.125rem" />
          <Skeleton width="9rem" height="0.875rem" />
        </div>
        <div className="admin-skel-preview-grid">
          {Array.from({ length: 3 }, (_, idx) => (
            <div key={idx} className="admin-skel-preview-quote-card">
              <Skeleton width="5rem" height="0.8125rem" />
              <Skeleton width="100%" height="0.875rem" />
              <Skeleton width="85%" height="0.875rem" />
              <Skeleton width="6.5rem" height="0.8125rem" />
            </div>
          ))}
        </div>
      </Card>

      <Card tone="surface" className="admin-testi-panel">
        <ul className="admin-testi-list">
          {Array.from({ length: 3 }, (_, idx) => (
            <li key={idx} className="admin-testi-row">
              <div className="admin-testi-main">
                <div className="admin-testi-meta">
                  <Skeleton width="9.5rem" height="1rem" />
                  <Skeleton width="5rem" height="0.8125rem" />
                  <Skeleton width="6.5rem" height="0.8125rem" />
                  <Skeleton width="5.5rem" height="1.25rem" radius="pill" />
                </div>
                <Skeleton width="min(32rem, 95%)" height="0.9375rem" />
                <Skeleton width="min(20rem, 80%)" height="0.8125rem" />
              </div>

              <div className="admin-testi-actions">
                <Skeleton width="8.5rem" height="2rem" radius="pill" />
                <Skeleton width="5.25rem" height="2rem" radius="pill" />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </AdminSkeletonFrame>
  );
}
