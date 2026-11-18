import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/page-sections.css';
import '@/styles/features/content.css';
import { cn } from '@/utils';

import { SitePageHeaderSkeleton } from './site-page-header-skeleton';
import { SiteSectionHeaderSkeleton } from './site-section-header-skeleton';
import { SiteSkeletonFrame } from './site-skeleton-frame';

interface SiteFaqSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching FaqView hero, accordion card, and 3-column baseline guidance grid. */
export function SiteFaqSkeleton({ className }: SiteFaqSkeletonProps) {
  return (
    <SiteSkeletonFrame className={cn('content-page-main', className)}>
      <section className="content-container content-section" aria-hidden="true">
        <SitePageHeaderSkeleton subtitleLines={2} />

        <Card className="content-faq-accordion-card">
          <div className="content-faq-accordion">
            {Array.from({ length: 5 }, (_, idx) => (
              <div key={idx} className="content-faq-item">
                <div className="site-skel-faq-row">
                  <Skeleton
                    width={
                      idx % 2 === 0 ? 'min(26rem, 84%)' : 'min(21rem, 76%)'
                    }
                    height="1.0625rem"
                  />
                  <Skeleton width="1.125rem" height="1.125rem" radius="sm" />
                </div>

                {idx === 0 ? (
                  <div className="site-skel-faq-answer">
                    <Skeleton width="100%" height="0.9375rem" />
                    <Skeleton width="82%" height="0.9375rem" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="content-container content-section" aria-hidden="true">
        <SiteSectionHeaderSkeleton subtitleLines={2} />

        <div className="content-privacy-grid content-privacy-grid--3">
          {Array.from({ length: 3 }, (_, idx) => (
            <Card key={idx} className="content-privacy-card">
              <div className="content-privacy-card-header">
                <Skeleton width="1.375rem" height="1rem" />
                <Skeleton width="min(14rem, 82%)" height="1.0625rem" />
              </div>
              <div className="site-skel-stack-xs">
                <Skeleton width="100%" height="0.9375rem" />
                <Skeleton width="92%" height="0.9375rem" />
                <Skeleton width="70%" height="0.9375rem" />
              </div>
            </Card>
          ))}
        </div>

        <div className="content-legal-actions">
          <Skeleton width="11.5rem" height="2.75rem" radius="pill" />
          <Skeleton width="13.5rem" height="2.75rem" radius="pill" />
        </div>
      </section>
    </SiteSkeletonFrame>
  );
}
