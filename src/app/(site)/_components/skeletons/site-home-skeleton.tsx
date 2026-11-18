import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/page-sections.css';
import '@/styles/components/testimonials.css';
import '@/styles/features/home.css';
import { cn } from '@/utils';

import { SiteBakingClassCardSkeleton } from './site-baking-class-card-skeleton';
import { SiteProductCardSkeleton } from './site-product-card-skeleton';
import { SiteSectionHeaderSkeleton } from './site-section-header-skeleton';
import { SiteSkeletonFrame } from './site-skeleton-frame';

interface SiteHomeSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching HomeView hero and all 9 editorial sections. */
export function SiteHomeSkeleton({ className }: SiteHomeSkeletonProps) {
  return (
    <SiteSkeletonFrame className={cn('content-container home-main', className)}>
      <section className="foundation-hero home-hero" aria-hidden="true">
        <div className="home-hero-copy">
          <div className="site-skel-stack-xs">
            <Skeleton
              width="min(18.5rem, 88%)"
              height="clamp(2.375rem, 4.6vw, 4.25rem)"
            />
            <Skeleton
              width="min(16rem, 76%)"
              height="clamp(2.375rem, 4.6vw, 4.25rem)"
            />
            <Skeleton
              width="min(12rem, 58%)"
              height="clamp(2.375rem, 4.6vw, 4.25rem)"
            />
          </div>

          <div className="foundation-intro site-skel-stack-xs">
            <Skeleton width="min(25rem, 96%)" height="1.0625rem" />
            <Skeleton width="min(19rem, 78%)" height="1.0625rem" />
          </div>

          <div className="home-hero-actions">
            <Skeleton width="10.75rem" height="3.25rem" radius="pill" />
            <Skeleton width="11.75rem" height="3.25rem" radius="pill" />
          </div>
        </div>

        <div className="home-hero-media-stage">
          <div className="site-skel-media-box site-skel-hero-media">
            <Skeleton
              width="100%"
              height="100%"
              radius="card"
              className="site-skel-fill"
            />
          </div>
        </div>
      </section>

      <section className="home-section" aria-hidden="true">
        <SiteSectionHeaderSkeleton hasAction actionWidth="10.5rem" />
        <div className="home-series-grid">
          {Array.from({ length: 4 }, (_, idx) => (
            <Card key={idx} className="home-series-card">
              <div className="home-series-card-body">
                <Skeleton width="78%" height="1.25rem" />
                <div className="site-skel-stack-xs">
                  <Skeleton width="100%" height="0.875rem" />
                  <Skeleton width="84%" height="0.875rem" />
                </div>
              </div>
              <div className="home-series-card-link">
                <Skeleton width="7.5rem" height="1rem" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="home-section" aria-hidden="true">
        <SiteSectionHeaderSkeleton hasAction actionWidth="12rem" />
        <div className="product-grid home-featured-grid">
          {Array.from({ length: 4 }, (_, idx) => (
            <SiteProductCardSkeleton key={idx} variant="featured" />
          ))}
        </div>
      </section>

      <section className="home-section home-story-section" aria-hidden="true">
        <div className="home-story-grid">
          <div className="home-story-content">
            <Skeleton
              width="min(15rem, 72%)"
              height="clamp(1.75rem, 2.8vw, 2.5rem)"
            />

            <div className="site-skel-stack-xs w-full">
              <Skeleton width="min(34rem, 98%)" height="1rem" />
              <Skeleton width="min(32rem, 92%)" height="1rem" />
              <Skeleton width="min(24rem, 70%)" height="1rem" />
            </div>

            <div className="home-values-group">
              <Skeleton width="7rem" height="0.8125rem" />
              <div className="home-story-values-list">
                {['6rem', '6.75rem', '5rem', '5rem', '5.75rem'].map(
                  (w, idx) => (
                    <Skeleton
                      key={idx}
                      width={w}
                      height="1.875rem"
                      radius="pill"
                    />
                  ),
                )}
              </div>
            </div>

            <Skeleton width="11rem" height="2.75rem" radius="pill" />
          </div>

          <div className="site-skel-media-box site-skel-story-media">
            <Skeleton
              width="100%"
              height="100%"
              radius="card"
              className="site-skel-fill"
            />
          </div>
        </div>

        <Card tone="surface" className="home-custom-business-card">
          <div className="home-custom-business-copy w-full">
            <Skeleton width="min(14rem, 75%)" height="1.25rem" />
            <Skeleton width="min(32rem, 96%)" height="0.9375rem" />
            <Skeleton width="min(22rem, 76%)" height="0.9375rem" />
          </div>
          <Skeleton width="13rem" height="2.75rem" radius="pill" />
        </Card>
      </section>

      <section className="home-section" aria-hidden="true">
        <SiteSectionHeaderSkeleton />
        <div className="home-treats-grid">
          {Array.from({ length: 3 }, (_, idx) => (
            <Card key={idx} className="home-treat-card">
              <div className="home-treat-offer-band">
                <div className="home-treat-offer-top">
                  <Skeleton width="7.75rem" height="1.5rem" radius="pill" />
                  <Skeleton width="4.75rem" height="1.375rem" radius="pill" />
                </div>
                <Skeleton width="9rem" height="1.875rem" />
                <Skeleton width="12.5rem" height="0.8125rem" />
              </div>

              <div className="home-treat-body">
                <Skeleton width="78%" height="1.1875rem" />
                <div className="site-skel-stack-xs">
                  <Skeleton width="100%" height="0.9375rem" />
                  <Skeleton width="82%" height="0.9375rem" />
                </div>
              </div>

              <div className="home-treat-footer">
                <div className="site-skel-inline-row">
                  <Skeleton width="0.875rem" height="0.875rem" radius="sm" />
                  <Skeleton width="12rem" height="0.8125rem" />
                </div>
                <div className="site-skel-inline-row">
                  <Skeleton width="0.875rem" height="0.875rem" radius="sm" />
                  <Skeleton width="10rem" height="0.8125rem" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="home-section" aria-hidden="true">
        <SiteSectionHeaderSkeleton hasAction actionWidth="13.5rem" />
        <div className="baking-class-grid">
          {Array.from({ length: 2 }, (_, idx) => (
            <SiteBakingClassCardSkeleton key={idx} />
          ))}
        </div>
      </section>

      <section className="home-section" aria-hidden="true">
        <SiteSectionHeaderSkeleton />
        <div className="home-testimonials-grid">
          {Array.from({ length: 3 }, (_, idx) => (
            <Card key={idx} className="home-testimonial-card">
              <div className="home-testimonial-header">
                <Skeleton width="1.25rem" height="1.25rem" radius="sm" />
                <Skeleton width="3.75rem" height="1.5rem" radius="pill" />
              </div>
              <div className="site-skel-stack-xs">
                <Skeleton width="100%" height="1.0625rem" />
                <Skeleton width="84%" height="1.0625rem" />
              </div>
              <Skeleton width="10.5rem" height="0.875rem" />
            </Card>
          ))}
        </div>
      </section>

      <section className="home-section" aria-hidden="true">
        <SiteSectionHeaderSkeleton />
        <div className="home-find-us-grid">
          {Array.from({ length: 2 }, (_, idx) => (
            <Card key={idx} className="home-branch-card">
              <div className="home-branch-card-header">
                <Skeleton width="7.5rem" height="1.25rem" />
                {idx === 0 ? (
                  <Skeleton width="8.5rem" height="1.5rem" radius="pill" />
                ) : null}
              </div>

              <div className="site-skel-stack-sm">
                <div className="site-skel-inline-row">
                  <Skeleton width="1rem" height="1rem" radius="sm" />
                  <Skeleton width="min(18rem, 85%)" height="0.9375rem" />
                </div>
                <div className="site-skel-inline-row">
                  <Skeleton width="1rem" height="1rem" radius="sm" />
                  <Skeleton width="8rem" height="0.9375rem" />
                </div>
                <div className="site-skel-inline-row">
                  <Skeleton width="1rem" height="1rem" radius="sm" />
                  <Skeleton width="13.5rem" height="0.9375rem" />
                </div>
              </div>

              <div className="home-branch-actions">
                <Skeleton width="11.5rem" height="2.75rem" radius="pill" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="home-section" aria-hidden="true">
        <SiteSectionHeaderSkeleton hasAction actionWidth="15.5rem" />
        <div className="home-community-grid">
          {Array.from({ length: 3 }, (_, idx) => (
            <Card key={idx} className="home-community-card">
              <div className="site-skel-media-box site-skel-community-media">
                <Skeleton
                  width="100%"
                  height="100%"
                  radius="sm"
                  className="site-skel-fill"
                />
              </div>
              <Skeleton width="74%" height="1.1875rem" />
              <div className="site-skel-stack-xs">
                <Skeleton width="100%" height="0.9375rem" />
                <Skeleton width="82%" height="0.9375rem" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </SiteSkeletonFrame>
  );
}
