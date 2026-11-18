import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/features/admin-faqs.css';
import { cn } from '@/utils';

import { AdminSectionHeaderSkeleton } from './admin-section-header-skeleton';
import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminFaqsSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AdminFaqsView toolbar and unified Q&A panel. */
export function AdminFaqsSkeleton({ className }: AdminFaqsSkeletonProps) {
  return (
    <AdminSkeletonFrame
      className={cn('admin-section admin-faq-section', className)}
    >
      <AdminSectionHeaderSkeleton buttonCount={2} />

      <Card tone="surface" className="admin-faq-toolbar">
        <div className="admin-skel-field">
          <Skeleton width="4.5rem" height="0.8125rem" />
          <Skeleton width="100%" height="2.5rem" radius="md" />
        </div>
        <div className="admin-skel-field">
          <Skeleton width="5rem" height="0.8125rem" />
          <Skeleton width="100%" height="2.5rem" radius="md" />
        </div>
      </Card>

      <Card tone="surface" className="admin-faq-panel">
        <ul className="admin-faq-list">
          {Array.from({ length: 5 }, (_, idx) => (
            <li key={idx} className="admin-faq-row">
              <div className="admin-faq-main">
                <div className="admin-faq-meta">
                  <Skeleton width="5.5rem" height="1.25rem" radius="pill" />
                  <Skeleton width="5.5rem" height="0.8125rem" />
                  <Skeleton width="4rem" height="0.75rem" />
                </div>
                <Skeleton width="min(24rem, 90%)" height="1rem" />
                <Skeleton width="min(36rem, 95%)" height="0.875rem" />
              </div>

              <div className="admin-faq-actions">
                <Skeleton width="4.5rem" height="2rem" radius="pill" />
                <Skeleton width="5.25rem" height="2rem" radius="pill" />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </AdminSkeletonFrame>
  );
}
