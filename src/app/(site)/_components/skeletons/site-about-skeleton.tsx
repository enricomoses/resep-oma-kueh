import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/page-sections.css';
import '@/styles/features/content.css';
import { cn } from '@/utils';

import { SitePageHeaderSkeleton } from './site-page-header-skeleton';
import { SiteSectionHeaderSkeleton } from './site-section-header-skeleton';
import { SiteSkeletonFrame } from './site-skeleton-frame';

interface SiteAboutSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AboutView hero, 5 brand value cards, and team profile card. */
export function SiteAboutSkeleton({ className }: SiteAboutSkeletonProps) {
  return (
    <SiteSkeletonFrame className={cn('content-page-main', className)}>
      <section className="content-container content-section" aria-hidden="true">
        <SitePageHeaderSkeleton subtitleLines={3} actionCount={2} />
      </section>

      <section className="content-container content-section" aria-hidden="true">
        <SiteSectionHeaderSkeleton subtitleLines={2} />
        <div className="content-values-grid">
          {Array.from({ length: 5 }, (_, idx) => (
            <Card key={idx} tone="cream" className="content-value-card">
              <Skeleton width="8.5rem" height="1.1875rem" />
              <div className="site-skel-stack-xs">
                <Skeleton width="100%" height="0.9375rem" />
                <Skeleton width="82%" height="0.9375rem" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="content-container content-section" aria-hidden="true">
        <Card className="content-team-card">
          <Skeleton
            width="min(18rem, 78%)"
            height="clamp(1.75rem, 2.8vw, 2.5rem)"
          />
          <div className="site-skel-stack-xs">
            <Skeleton width="100%" height="1.0625rem" />
            <Skeleton width="84%" height="1.0625rem" />
          </div>
          <div className="site-skel-disclaimer-box">
            <Skeleton width="100%" height="0.875rem" />
            <Skeleton width="76%" height="0.875rem" />
          </div>
        </Card>
      </section>
    </SiteSkeletonFrame>
  );
}
