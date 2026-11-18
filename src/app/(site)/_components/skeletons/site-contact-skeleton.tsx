import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/page-sections.css';
import '@/styles/features/content.css';
import { cn } from '@/utils';

import { SitePageHeaderSkeleton } from './site-page-header-skeleton';
import { SiteSectionHeaderSkeleton } from './site-section-header-skeleton';
import { SiteSkeletonFrame } from './site-skeleton-frame';

interface SiteContactSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching ContactView hero, branch cards, B2B card, and official channels. */
export function SiteContactSkeleton({ className }: SiteContactSkeletonProps) {
  return (
    <SiteSkeletonFrame className={cn('content-page-main', className)}>
      <section className="content-container content-section" aria-hidden="true">
        <SitePageHeaderSkeleton subtitleLines={2} />
      </section>

      <section className="content-container content-section" aria-hidden="true">
        <SiteSectionHeaderSkeleton subtitleLines={0} />
        <div className="home-find-us-grid">
          {Array.from({ length: 2 }, (_, idx) => (
            <Card key={idx} className="content-branch-card">
              <div className="content-branch-header">
                <div className="content-branch-header-top">
                  <Skeleton width="9.5rem" height="1.3125rem" />
                  {idx === 0 ? (
                    <Skeleton width="7rem" height="1.5rem" radius="pill" />
                  ) : null}
                </div>
                <div className="site-skel-stack-xs">
                  <Skeleton width="100%" height="0.9375rem" />
                  <Skeleton width="74%" height="0.9375rem" />
                </div>
              </div>

              <div className="content-branch-details">
                {[0, 1, 2].map((rowIdx) => (
                  <div key={rowIdx} className="content-branch-detail-row">
                    <Skeleton width="1.125rem" height="1.125rem" radius="sm" />
                    <div className="content-branch-detail-body">
                      <Skeleton width="5.5rem" height="0.8125rem" />
                      <Skeleton
                        width={rowIdx === 1 ? 'min(18rem, 92%)' : '10.5rem'}
                        height="0.9375rem"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="content-branch-footer">
                <Skeleton width="100%" height="2.75rem" radius="pill" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="content-container content-section" aria-hidden="true">
        <Card className="content-b2b-card">
          <div className="content-b2b-intro">
            <Skeleton width="min(16rem, 80%)" height="1.75rem" />
            <div className="site-skel-stack-xs">
              <Skeleton width="100%" height="0.9375rem" />
              <Skeleton width="88%" height="0.9375rem" />
            </div>
            <div className="content-b2b-note">
              <Skeleton width="min(20rem, 90%)" height="0.8125rem" />
            </div>
          </div>

          <div className="content-b2b-controls">
            <div className="site-skel-field">
              <Skeleton width="9.5rem" height="0.875rem" />
              <Skeleton width="100%" height="3rem" radius="md" />
            </div>
            <div className="site-skel-field">
              <Skeleton width="10rem" height="0.875rem" />
              <Skeleton width="100%" height="3rem" radius="md" />
            </div>
            <div className="content-b2b-actions">
              <Skeleton
                width="16.5rem"
                height="2.75rem"
                radius="pill"
                className="w-full sm:w-[16.5rem]"
              />
            </div>
          </div>
        </Card>
      </section>

      <section className="content-container content-section" aria-hidden="true">
        <SiteSectionHeaderSkeleton subtitleLines={0} />
        <div className="content-channels-grid">
          {Array.from({ length: 2 }, (_, idx) => (
            <Card key={idx} className="content-channel-card">
              <div className="site-skel-inline-row">
                <Skeleton width="1.125rem" height="1.125rem" radius="sm" />
                <Skeleton width="5.5rem" height="1.1875rem" />
              </div>
              <Skeleton width="12.5rem" height="0.9375rem" />
            </Card>
          ))}
        </div>
      </section>
    </SiteSkeletonFrame>
  );
}
