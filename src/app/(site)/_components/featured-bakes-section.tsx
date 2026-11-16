import { ArrowRight } from 'lucide-react';

import { MenuProductCardMedia } from '@/components/common/commerce/menu-product-card-media';
import { ProductBadgeRow } from '@/components/common/commerce/product-badge-row';
import type { ProductBadgeItem } from '@/components/common/commerce/product-badge-row';
import { SectionHeader } from '@/components/common/layout/section-header';
import { ActionLink } from '@/components/ui/action-link';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ROUTES } from '@/constants';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import type { HomeFeaturedProduct, HomeSectionResult } from '@/types/home';
import { cn, formatIdr } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface FeaturedBakesSectionProps {
  featuredProducts: HomeSectionResult<HomeFeaturedProduct[]>;
  selectedBranchId: string | null;
  branchCode: string | null;
  className?: string;
}

export function FeaturedBakesSection({
  featuredProducts,
  selectedBranchId,
  branchCode,
  className,
}: FeaturedBakesSectionProps) {
  return (
    <section
      id={HOME_SECTION_IDS.FEATURED}
      className={cn('home-section', className)}
      aria-labelledby="home-featured-title"
    >
      <SectionHeader
        titleId="home-featured-title"
        title={HOME_COPY.FEATURED_TITLE}
        subtitle={HOME_COPY.FEATURED_SUBTITLE}
        actions={
          <ActionLink
            href={withBranch(ROUTES.MENU, branchCode)}
            variant="secondary"
            prefetch={false}
          >
            {HOME_COPY.FEATURED_ALL_CTA}
          </ActionLink>
        }
      />
      {featuredProducts.status === 'error' ? (
        <Feedback tone="error" title={HOME_COPY.FEATURED_ERROR} />
      ) : featuredProducts.data.length === 0 ? (
        <Feedback title={HOME_COPY.FEATURED_EMPTY} />
      ) : (
        <div className="product-grid home-featured-grid">
          {featuredProducts.data.map((product) => {
            const targetHref = `${ROUTES.MENU}/${encodeURIComponent(product.slug)}`;
            const branchPrice =
              selectedBranchId && product.branchFromPriceIdr
                ? product.branchFromPriceIdr[selectedBranchId]
                : undefined;
            const branchPromo =
              selectedBranchId && product.branchPromotions
                ? product.branchPromotions[selectedBranchId]
                : undefined;
            const badges: ProductBadgeItem[] = [
              {
                id: 'featured',
                label: HOME_COPY.BADGE_FEATURED,
                tone: 'accent',
              },
              ...(branchPromo
                ? [
                    {
                      id: 'promo',
                      label: branchPromo.badgeTitle,
                      tone: 'accent' as const,
                    },
                  ]
                : []),
              ...(product.isBestSeller
                ? [
                    {
                      id: 'best-seller',
                      label: HOME_COPY.BADGE_BEST_SELLER,
                      tone: 'success' as const,
                    },
                  ]
                : []),
              ...(product.isNew
                ? [
                    {
                      id: 'new',
                      label: HOME_COPY.BADGE_NEW,
                      tone: 'neutral' as const,
                    },
                  ]
                : []),
              ...(product.productType === 'bundle'
                ? [
                    {
                      id: 'bundle',
                      label: HOME_COPY.BADGE_BUNDLE,
                      tone: 'neutral' as const,
                    },
                  ]
                : []),
            ];
            return (
              <Card key={product.id} className="home-featured-card">
                <MenuProductCardMedia
                  previewImageUrl={product.imageUrl ?? null}
                  imageAlt={product.imageAlt}
                  placeholderCaption={product.imageAlt}
                  className="home-card-media"
                />
                <ProductBadgeRow items={badges} />
                <div className="home-featured-card-body">
                  <p
                    className="home-card-eyebrow"
                    aria-hidden={!product.primaryCategory}
                  >
                    {product.primaryCategory?.name ?? ''}
                  </p>
                  <h3>{product.name}</h3>
                  {(product.shortDescription ?? product.description) ? (
                    <p>{product.shortDescription ?? product.description}</p>
                  ) : null}
                  {branchPrice !== undefined ? (
                    <div className="menu-product-price-block">
                      <p className="menu-product-price">
                        <span>{HOME_COPY.FEATURED_PRICE_FROM_PREFIX}</span>{' '}
                        <strong>{formatIdr(branchPrice)}</strong>
                      </p>
                      {branchPromo &&
                      branchPrice < branchPromo.originalFromPriceIdr ? (
                        <p className="menu-product-price-original">
                          <span>
                            {formatIdr(branchPromo.originalFromPriceIdr)}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="home-price-note">
                      {HOME_COPY.FEATURED_PRICE_NOTE}
                    </p>
                  )}
                </div>
                <ActionLink
                  href={withBranch(targetHref, branchCode)}
                  variant="secondary"
                  prefetch={false}
                >
                  {HOME_COPY.FEATURED_CTA}
                  <ArrowRight size={16} aria-hidden="true" />
                </ActionLink>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
