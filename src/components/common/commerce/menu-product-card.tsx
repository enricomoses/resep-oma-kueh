import { ArrowRight } from 'lucide-react';

import { MenuProductCardMedia } from '@/components/common/commerce/menu-product-card-media';
import { ProductBadgeRow } from '@/components/common/commerce/product-badge-row';
import type { ProductBadgeItem } from '@/components/common/commerce/product-badge-row';
import { ActionLink } from '@/components/ui/action-link';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants';
import {
  CATALOG_AVAILABILITY_LABELS,
  CATALOG_COPY,
} from '@/constants/catalog.constant';
import '@/styles/components/product-card.css';
import type { CatalogProductItem } from '@/types/catalog';
import { cn, formatIdr } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface MenuProductCardProps {
  product: CatalogProductItem;
  hasBranchSelected: boolean;
  branchCode: string | null;
  previewImageUrl?: string | null;
  className?: string;
}

export function MenuProductCard({
  product,
  hasBranchSelected,
  branchCode,
  previewImageUrl = null,
  className,
}: MenuProductCardProps) {
  const detailHref = withBranch(
    `${ROUTES.MENU}/${encodeURIComponent(product.slug)}`,
    branchCode,
  );
  const hasPromoDiscount =
    product.baseFromPriceIdr !== null &&
    product.fromPriceIdr !== null &&
    product.fromPriceIdr < product.baseFromPriceIdr;

  const availabilityTone: ProductBadgeItem['tone'] =
    product.availabilityStatus === 'available'
      ? 'success'
      : product.availabilityStatus === 'sold_out'
        ? 'danger'
        : 'accent';

  const badges: ProductBadgeItem[] = [
    ...(product.isFeatured
      ? [
          {
            id: 'featured',
            label: CATALOG_COPY.BADGE_FEATURED,
            tone: 'accent' as const,
          },
        ]
      : []),
    ...(product.isBestSeller
      ? [
          {
            id: 'best-seller',
            label: CATALOG_COPY.BADGE_BEST_SELLER,
            tone: 'success' as const,
          },
        ]
      : []),
    ...(product.isNew
      ? [
          {
            id: 'new',
            label: CATALOG_COPY.BADGE_NEW,
            tone: 'neutral' as const,
          },
        ]
      : []),
    ...(product.productType === 'bundle'
      ? [
          {
            id: 'bundle',
            label: CATALOG_COPY.BADGE_BUNDLE,
            tone: 'neutral' as const,
          },
        ]
      : []),
    ...(hasBranchSelected && product.availabilityStatus
      ? [
          {
            id: 'availability',
            label: CATALOG_AVAILABILITY_LABELS[product.availabilityStatus],
            tone: availabilityTone,
          },
        ]
      : []),
    ...(product.appliedPromotion
      ? [
          {
            id: 'applied-promo',
            label: `${CATALOG_COPY.BADGE_PROMO_APPLIED}: ${product.appliedPromotion.title}`,
            tone: 'accent' as const,
          },
        ]
      : product.conditionalPromotion
        ? [
            {
              id: 'conditional-promo',
              label: `${CATALOG_COPY.BADGE_PROMO_CONDITIONAL}: ${product.conditionalPromotion.title}`,
              tone: 'neutral' as const,
            },
          ]
        : []),
    ...product.verifiedDietaryTags.map((tag) => ({
      id: `diet-${tag.slug}`,
      label: tag.name,
      tone: 'neutral' as const,
    })),
  ];

  return (
    <Card className={cn('menu-product-card', className)}>
      <MenuProductCardMedia
        previewImageUrl={previewImageUrl}
        imageAlt={product.imageAlt || product.name}
        placeholderCaption={product.imageAlt}
      />

      <ProductBadgeRow items={badges} />

      <div className="menu-product-card-body">
        <p className="home-card-eyebrow" aria-hidden={!product.primaryCategory}>
          {product.primaryCategory?.name ?? ''}
        </p>
        <h3>{product.name}</h3>
        {(product.shortDescription ?? product.description) ? (
          <p className="menu-product-description">
            {product.shortDescription ?? product.description}
          </p>
        ) : null}

        <div className="menu-product-card-pricing">
          <p className="menu-product-meta">
            {hasBranchSelected
              ? product.offeredVariantCount
              : product.activeVariantCount}{' '}
            {CATALOG_COPY.VARIANT_COUNT_SUFFIX}
          </p>

          {hasBranchSelected && product.fromPriceIdr !== null ? (
            <div className="menu-product-price-block">
              <p className="menu-product-price">
                <span>{CATALOG_COPY.PRICE_FROM_PREFIX}</span>{' '}
                <strong>{formatIdr(product.fromPriceIdr)}</strong>
              </p>
              {hasPromoDiscount && product.baseFromPriceIdr !== null ? (
                <p className="menu-product-price-original">
                  {CATALOG_COPY.PRICE_ORIGINAL_PREFIX}{' '}
                  <span>{formatIdr(product.baseFromPriceIdr)}</span>
                </p>
              ) : null}
              {product.availabilityStatus === 'sold_out' ? (
                <p className="menu-product-sold-out-note">
                  {CATALOG_COPY.PRICE_SOLD_OUT_NOTE}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="home-price-note">
              {CATALOG_COPY.PRICE_BRANCH_REQUIRED}
            </p>
          )}
        </div>
      </div>

      <div className="menu-product-card-actions">
        <ActionLink href={detailHref} variant="secondary" prefetch={false}>
          {CATALOG_COPY.CTA_VIEW_OPTIONS}
          <ArrowRight size={16} aria-hidden="true" />
        </ActionLink>
      </div>
    </Card>
  );
}
