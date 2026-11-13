import { ArrowRight } from 'lucide-react';
import { MenuProductCardMedia } from '@/components/catalog/menu-product-card-media';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants';
import {
  CATALOG_AVAILABILITY_LABELS,
  CATALOG_COPY,
} from '@/constants/catalog.constant';
import { withBranch } from '@/utils/branch-url';
import { cn, formatIdr } from '@/utils';
import type { CatalogProductItem } from '@/types/catalog';

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

  const availabilityTone =
    product.availabilityStatus === 'available'
      ? 'success'
      : product.availabilityStatus === 'sold_out'
        ? 'danger'
        : 'accent';

  return (
    <Card className={cn('menu-product-card', className)}>
      <MenuProductCardMedia
        previewImageUrl={previewImageUrl}
        imageAlt={product.imageAlt || product.name}
        placeholderCaption={product.imageAlt}
      />

      <div className="home-badge-row">
        {product.isFeatured ? (
          <Badge tone="accent">{CATALOG_COPY.BADGE_FEATURED}</Badge>
        ) : null}
        {product.isBestSeller ? (
          <Badge tone="success">{CATALOG_COPY.BADGE_BEST_SELLER}</Badge>
        ) : null}
        {product.isNew ? (
          <Badge tone="neutral">{CATALOG_COPY.BADGE_NEW}</Badge>
        ) : null}
        {product.productType === 'bundle' ? (
          <Badge tone="neutral">{CATALOG_COPY.BADGE_BUNDLE}</Badge>
        ) : null}
        {hasBranchSelected && product.availabilityStatus ? (
          <Badge tone={availabilityTone}>
            {CATALOG_AVAILABILITY_LABELS[product.availabilityStatus]}
          </Badge>
        ) : null}
        {product.appliedPromotion ? (
          <Badge tone="accent">
            {CATALOG_COPY.BADGE_PROMO_APPLIED}: {product.appliedPromotion.title}
          </Badge>
        ) : product.conditionalPromotion ? (
          <Badge tone="neutral">
            {CATALOG_COPY.BADGE_PROMO_CONDITIONAL}:{' '}
            {product.conditionalPromotion.title}
          </Badge>
        ) : null}
        {product.verifiedDietaryTags.map((tag) => (
          <Badge key={tag.slug} tone="neutral">
            {tag.name}
          </Badge>
        ))}
      </div>

      <div className="menu-product-card-body">
        {product.primaryCategory ? (
          <p className="home-card-eyebrow">{product.primaryCategory.name}</p>
        ) : null}
        <h3>{product.name}</h3>
        {(product.shortDescription ?? product.description) ? (
          <p className="menu-product-description">
            {product.shortDescription ?? product.description}
          </p>
        ) : null}

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

      <div className="menu-product-card-actions">
        <ActionLink href={detailHref} variant="secondary" prefetch={false}>
          {CATALOG_COPY.CTA_VIEW_OPTIONS}
          <ArrowRight size={16} aria-hidden="true" />
        </ActionLink>
      </div>
    </Card>
  );
}
