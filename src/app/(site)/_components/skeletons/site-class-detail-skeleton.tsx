import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/features/classes.css';
import { cn } from '@/utils';

import { SiteSkeletonFrame } from './site-skeleton-frame';

interface SiteClassDetailLayoutSkeletonProps {
  className?: string;
}

/** Inner 2-column layout skeleton for ClassDetailView (program hero + sessions + WA registration form). */
export function SiteClassDetailLayoutSkeleton({
  className,
}: SiteClassDetailLayoutSkeletonProps) {
  return (
    <div className={cn('classes-detail-layout', className)} aria-hidden="true">
      <div className="classes-detail-summary">
        <Card className="classes-detail-hero-card">
          <div className="site-skel-media-box site-skel-class-detail-media">
            <Skeleton
              width="100%"
              height="100%"
              radius="sm"
              className="site-skel-fill"
            />
          </div>

          <div className="classes-badge-row">
            {['7.5rem', '9rem', '5.5rem', '5.5rem'].map((w, idx) => (
              <Skeleton key={idx} width={w} height="1.75rem" radius="pill" />
            ))}
          </div>

          <Skeleton
            width="min(22rem, 88%)"
            height="clamp(1.75rem, 2.8vw, 2.5rem)"
          />

          <Skeleton width="min(26rem, 92%)" height="1.0625rem" />

          <div className="site-skel-stack-xs">
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="94%" height="1rem" />
            <Skeleton width="76%" height="1rem" />
          </div>

          <div className="classes-included-box">
            <Skeleton width="11rem" height="1.125rem" />
            <div className="site-skel-stack-sm">
              {['72%', '64%', '78%', '60%'].map((w, idx) => (
                <div key={idx} className="site-skel-inline-row">
                  <Skeleton width="1rem" height="1rem" radius="circle" />
                  <Skeleton width={w} height="0.9375rem" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="classes-registration-stack">
        <Card tone="surface" className="classes-sessions-card">
          <Skeleton width="13rem" height="1.25rem" />
          <div className="classes-session-list">
            {Array.from({ length: 2 }, (_, idx) => (
              <Card key={idx} tone="surface" className="classes-session-item">
                <div className="classes-badge-row">
                  <Skeleton width="5.5rem" height="1.625rem" radius="pill" />
                  <Skeleton width="7.5rem" height="1.625rem" radius="pill" />
                  <Skeleton width="7rem" height="1.625rem" radius="pill" />
                </div>
                <div className="site-skel-inline-row">
                  <Skeleton width="1rem" height="1rem" radius="sm" />
                  <Skeleton width="13rem" height="0.875rem" />
                </div>
                <Skeleton width="12rem" height="0.875rem" />
                <Skeleton width="11rem" height="0.875rem" />
                <Skeleton width="8.5rem" height="2.375rem" radius="pill" />
              </Card>
            ))}
          </div>
        </Card>

        <Card tone="cream" className="classes-register-card">
          <Skeleton width="14.5rem" height="1.25rem" />
          <div className="site-skel-caveat-box">
            <Skeleton width="100%" height="0.875rem" />
            <Skeleton width="84%" height="0.875rem" />
          </div>
          <div className="classes-register-form">
            {['7.5rem', '6.5rem', '11rem'].map((w, idx) => (
              <div key={idx} className="site-skel-field">
                <Skeleton width={w} height="0.875rem" />
                <Skeleton width="100%" height="3rem" radius="md" />
              </div>
            ))}
            <div className="site-skel-inline-row">
              <Skeleton width="1.125rem" height="1.125rem" radius="sm" />
              <Skeleton width="min(20rem, 86%)" height="0.875rem" />
            </div>
            <Skeleton width="16rem" height="2.75rem" radius="pill" />
          </div>
        </Card>
      </div>
    </div>
  );
}

interface SiteClassDetailSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching ClassDetailView back row and 2-column detail/registration layout. */
export function SiteClassDetailSkeleton({
  className,
}: SiteClassDetailSkeletonProps) {
  return (
    <SiteSkeletonFrame
      className={cn('content-container classes-main', className)}
    >
      <div className="classes-back-row" aria-hidden="true">
        <Skeleton width="12rem" height="2.375rem" radius="pill" />
      </div>

      <SiteClassDetailLayoutSkeleton />
    </SiteSkeletonFrame>
  );
}
