import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/page-sections.css';
import '@/styles/features/content.css';
import { cn } from '@/utils';

import { SitePageHeaderSkeleton } from './site-page-header-skeleton';
import { SiteSectionHeaderSkeleton } from './site-section-header-skeleton';
import { SiteSkeletonFrame } from './site-skeleton-frame';

interface SiteLegalPolicySkeletonProps {
  factCount?: 3 | 4;
  className?: string;
}

/** 1:1 layout skeleton matching LegalPolicyView for /privacy (4 facts) and /ordering-policy (3 facts). */
export function SiteLegalPolicySkeleton({
  factCount = 4,
  className,
}: SiteLegalPolicySkeletonProps) {
  return (
    <SiteSkeletonFrame className={cn('content-page-main', className)}>
      <section className="content-container content-section" aria-hidden="true">
        <SitePageHeaderSkeleton subtitleLines={2} />

        <Card className="content-legal-card">
          <div className="content-legal-body content-legal-body--full">
            {Array.from({ length: 3 }, (_, idx) => (
              <div key={idx} className="site-skel-stack-xs">
                <Skeleton width="100%" height="1rem" />
                <Skeleton width="96%" height="1rem" />
                <Skeleton width={idx === 2 ? '68%' : '82%'} height="1rem" />
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="content-container content-section" aria-hidden="true">
        <SiteSectionHeaderSkeleton subtitleLines={0} />

        <div
          className={cn(
            'content-privacy-grid',
            factCount === 3 && 'content-privacy-grid--3',
          )}
        >
          {Array.from({ length: factCount }, (_, idx) => (
            <Card key={idx} className="content-privacy-card">
              <div className="content-privacy-card-header">
                <Skeleton width="1.375rem" height="1rem" />
                <Skeleton width="min(14rem, 82%)" height="1.0625rem" />
              </div>
              <div className="site-skel-stack-xs">
                <Skeleton width="100%" height="0.9375rem" />
                <Skeleton width="94%" height="0.9375rem" />
                <Skeleton width="74%" height="0.9375rem" />
              </div>
            </Card>
          ))}
        </div>

        <div className="content-legal-actions">
          <Skeleton width="11.5rem" height="2.75rem" radius="pill" />
          <Skeleton width="13.5rem" height="2.75rem" radius="pill" />
          <Skeleton width="8.5rem" height="1.25rem" />
        </div>
      </section>
    </SiteSkeletonFrame>
  );
}
