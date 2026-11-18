import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/product-card.css';
import '@/styles/features/product-detail.css';
import { cn } from '@/utils';

import { SiteProductCardSkeleton } from './site-product-card-skeleton';
import { SiteSkeletonFrame } from './site-skeleton-frame';

interface SiteProductDetailSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching ProductDetailView gallery, variant picker, food info, FAQ banner, and related products. */
export function SiteProductDetailSkeleton({
  className,
}: SiteProductDetailSkeletonProps) {
  return (
    <SiteSkeletonFrame className={cn('product-detail-page', className)}>
      <div className="product-detail-container" aria-hidden="true">
        <div className="product-detail-nav-header">
          <Skeleton width="9rem" height="1rem" />
        </div>

        <div className="product-detail-header">
          <Skeleton width="8.5rem" height="0.8125rem" />
          <Skeleton
            width="min(24rem, 86%)"
            height="clamp(2rem, 3.8vw, 3.25rem)"
          />
          <div className="site-skel-inline-row mt-2">
            <Skeleton width="5.5rem" height="1.75rem" radius="pill" />
            <Skeleton width="6rem" height="1.75rem" radius="pill" />
          </div>
          <div className="site-skel-stack-xs mt-2">
            <Skeleton width="min(38rem, 95%)" height="1rem" />
            <Skeleton width="min(26rem, 74%)" height="1rem" />
          </div>
        </div>

        <div className="product-detail-main-grid">
          <div className="product-gallery">
            <div className="site-skel-media-box site-skel-product-gallery-main">
              <Skeleton
                width="100%"
                height="100%"
                radius="card"
                className="site-skel-fill"
              />
            </div>

            <div className="product-gallery-thumbnails">
              {Array.from({ length: 4 }, (_, idx) => (
                <Skeleton
                  key={idx}
                  width="4.5rem"
                  height="4.5rem"
                  radius="card"
                />
              ))}
            </div>
          </div>

          <Card className="product-picker-card">
            <div className="product-picker-header">
              <Skeleton width="10.5rem" height="1.25rem" />
              <Skeleton width="min(16rem, 85%)" height="0.8125rem" />
            </div>

            <div className="product-variant-grid">
              {Array.from({ length: 3 }, (_, idx) => (
                <div key={idx} className="site-skel-variant-card">
                  <Skeleton width="5.5rem" height="0.875rem" />
                  <Skeleton width="4.5rem" height="0.8125rem" />
                </div>
              ))}
            </div>

            <div className="product-price-section">
              <div className="product-price-row">
                <div className="product-price-unit">
                  <Skeleton width="4.5rem" height="0.75rem" />
                  <Skeleton width="9rem" height="1.875rem" />
                </div>
                <div className="product-price-badges">
                  <Skeleton width="5.5rem" height="1.75rem" radius="pill" />
                </div>
              </div>

              <div className="product-qty-subtotal-grid">
                <div className="product-qty-block">
                  <Skeleton width="4rem" height="0.75rem" />
                  <Skeleton width="9.5rem" height="2.75rem" radius="pill" />
                </div>
                <div className="product-subtotal-block">
                  <Skeleton width="5rem" height="0.75rem" className="ml-auto" />
                  <Skeleton width="7.5rem" height="1.25rem" />
                </div>
              </div>

              <Skeleton width="min(26rem, 92%)" height="0.8125rem" />

              <div className="product-picker-actions">
                <Skeleton width="100%" height="3.25rem" radius="pill" />
              </div>
            </div>
          </Card>
        </div>

        <div className="product-detail-food-section">
          <Card className="product-food-info-card">
            <Skeleton width="14rem" height="1.25rem" />

            <div className="product-food-info-grid">
              <div className="product-food-info-section">
                <Skeleton width="7.5rem" height="0.875rem" />
                <div className="site-skel-inline-row">
                  <Skeleton width="6rem" height="1.75rem" radius="pill" />
                  <Skeleton width="5rem" height="1.75rem" radius="pill" />
                </div>
              </div>
              <div className="product-food-info-section">
                <Skeleton width="8.5rem" height="0.875rem" />
                <div className="site-skel-inline-row">
                  <Skeleton width="6.5rem" height="1.75rem" radius="pill" />
                  <Skeleton width="5.5rem" height="1.75rem" radius="pill" />
                </div>
              </div>
            </div>

            <div className="product-food-info-grid product-food-info-divider">
              <div className="product-food-info-section">
                <Skeleton width="7rem" height="0.875rem" />
                <Skeleton width="100%" height="0.875rem" />
                <Skeleton width="82%" height="0.875rem" />
              </div>
              <div className="product-food-info-section">
                <Skeleton width="8rem" height="0.875rem" />
                <Skeleton width="100%" height="0.875rem" />
                <Skeleton width="75%" height="0.875rem" />
              </div>
            </div>

            <div className="site-skel-caveat-box">
              <Skeleton width="100%" height="0.8125rem" />
              <Skeleton width="78%" height="0.8125rem" />
            </div>
          </Card>
        </div>

        <Card className="product-detail-faq-banner">
          <div className="site-skel-inline-row flex-1">
            <Skeleton width="1.25rem" height="1.25rem" radius="circle" />
            <Skeleton width="min(26rem, 80%)" height="0.9375rem" />
          </div>
          <Skeleton width="7.5rem" height="1rem" />
        </Card>

        <section className="product-detail-related">
          <div className="product-detail-related-header">
            <Skeleton width="12.5rem" height="1.625rem" />
            <Skeleton width="min(22rem, 86%)" height="0.9375rem" />
          </div>
          <div className="product-grid">
            {Array.from({ length: 4 }, (_, idx) => (
              <SiteProductCardSkeleton key={idx} variant="catalog" />
            ))}
          </div>
        </section>
      </div>
    </SiteSkeletonFrame>
  );
}
