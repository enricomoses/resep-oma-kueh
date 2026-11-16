import { AlertCircle, Check, Info, ShoppingBag } from 'lucide-react';
import { PriceDisplay } from '@/components/common/commerce/price-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Quantity } from '@/components/ui/quantity';
import {
  CATALOG_AVAILABILITY_LABELS,
  CATALOG_COPY,
  PRODUCT_DETAIL_COPY,
} from '@/constants/catalog.constant';
import { useProductConfigurator } from '@/hooks/use-product-configurator';
import type {
  BundleBreakdownItem,
  ProductDetail,
  ProductDetailVariant,
} from '@/types/catalog';
import { cn, formatIdr } from '@/utils';
import { BundleCustomizer } from './bundle-customizer';

interface PrepareCartBundleData {
  choiceIds: string[];
  bundleSignature: string | null;
  bundleBreakdown: BundleBreakdownItem[];
  unitPriceIdr: number;
}

interface ProductVariantPickerProps {
  product: ProductDetail;
  selectedVariant: ProductDetailVariant | null;
  onSelectVariant: (variant: ProductDetailVariant) => void;
  quantity: number;
  onChangeQuantity: (qty: number) => void;
  hasBranchSelected: boolean;
  onPrepareCart: (bundleData?: PrepareCartBundleData) => void;
  className?: string;
}

export function ProductVariantPicker({
  product,
  selectedVariant,
  onSelectVariant,
  quantity,
  onChangeQuantity,
  hasBranchSelected,
  onPrepareCart,
  className,
}: ProductVariantPickerProps) {
  const isBundle = product.productType === 'bundle';

  const configurator = useProductConfigurator({
    bundleVariant: isBundle ? selectedVariant : null,
    branchId: product.resolvedBranchId,
  });

  if (!hasBranchSelected) {
    return (
      <Card className={cn('product-picker-card', className)}>
        <div className="product-picker-notice" role="alert">
          <Info
            size={18}
            className="product-picker-notice-icon"
            aria-hidden="true"
          />
          <div className="product-picker-notice-body">
            <h3 className="product-picker-notice-title">
              {PRODUCT_DETAIL_COPY.VARIANT_BRANCH_REQUIRED_TITLE}
            </h3>
            <p className="product-picker-notice-text">
              {PRODUCT_DETAIL_COPY.VARIANT_BRANCH_REQUIRED_BODY}
            </p>
          </div>
        </div>

        <Button disabled className="product-picker-cta">
          {PRODUCT_DETAIL_COPY.CTA_BRANCH_REQUIRED}
        </Button>
      </Card>
    );
  }

  if (product.offeredVariants.length === 0) {
    return (
      <Card className={cn('product-picker-card', className)}>
        <div className="product-picker-notice" role="alert">
          <Info
            size={18}
            className="product-picker-notice-icon"
            aria-hidden="true"
          />
          <div className="product-picker-notice-body">
            <h3 className="product-picker-notice-title">
              {PRODUCT_DETAIL_COPY.VARIANT_NONE_OFFERED_TITLE}
            </h3>
            <p className="product-picker-notice-text">
              {PRODUCT_DETAIL_COPY.VARIANT_NONE_OFFERED_BODY}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const isSoldOut = selectedVariant?.availabilityStatus === 'sold_out';
  const isUnconfirmed = selectedVariant?.availabilityStatus === 'unconfirmed';

  const currentUnitPriceIdr =
    isBundle && configurator.validationResult
      ? configurator.effectivePriceIdr
      : (selectedVariant?.effectivePriceIdr ?? 0);

  const subtotalIdr = currentUnitPriceIdr * quantity;

  const hasPromoDiscount =
    selectedVariant &&
    selectedVariant.unitGrossIdr > selectedVariant.effectivePriceIdr;

  const handleVariantClick = (variant: ProductDetailVariant) => {
    configurator.resetSelections();
    onSelectVariant(variant);
  };

  return (
    <Card className={cn('product-picker-card', className)}>
      <div className="product-picker-header">
        <h2 className="product-picker-title">
          {PRODUCT_DETAIL_COPY.VARIANT_SECTION_TITLE}
        </h2>
        {product.offeredVariants.length === 1 ? (
          <p className="product-picker-single-note">
            {PRODUCT_DETAIL_COPY.VARIANT_SINGLE_NOTE}
          </p>
        ) : null}
      </div>

      <div
        role="radiogroup"
        aria-label={PRODUCT_DETAIL_COPY.VARIANT_PICKER_LABEL}
        className="product-variant-grid"
      >
        {product.offeredVariants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id;
          const isVariantSoldOut = variant.availabilityStatus === 'sold_out';
          const sizeText = variant.sizeLabel || variant.name;

          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isVariantSoldOut}
              onClick={() => handleVariantClick(variant)}
              className={cn(
                'product-variant-btn',
                isSelected && 'product-variant-btn-active',
                isVariantSoldOut && 'product-variant-btn-disabled',
              )}
            >
              <span className="product-variant-btn-top">
                <span className="product-variant-btn-label">{sizeText}</span>
                {isSelected && !isVariantSoldOut ? (
                  <Check
                    size={14}
                    aria-hidden="true"
                    className="product-variant-btn-check"
                  />
                ) : null}
              </span>
              <span className="product-variant-btn-price">
                {isVariantSoldOut
                  ? CATALOG_AVAILABILITY_LABELS.sold_out
                  : formatIdr(variant.effectivePriceIdr)}
              </span>
            </button>
          );
        })}
      </div>

      {selectedVariant ? (
        <div className="product-price-section">
          {isBundle ? (
            <div className="product-bundle-section">
              <BundleCustomizer
                variant={selectedVariant}
                selectedChoiceIds={configurator.selectedChoiceIds}
                onSelectChoice={configurator.selectChoice}
                validationResult={configurator.validationResult}
              />
            </div>
          ) : null}

          <div className="product-price-row">
            <div className="product-price-unit">
              <span className="product-price-label">
                {PRODUCT_DETAIL_COPY.PRICE_UNIT_LABEL}
              </span>
              <PriceDisplay
                effectivePriceIdr={currentUnitPriceIdr}
                grossPriceIdr={
                  hasPromoDiscount ? selectedVariant.unitGrossIdr : null
                }
                priceClassName="product-price-value"
                grossClassName="product-price-gross"
              />
            </div>

            <div className="product-price-badges">
              <Badge
                tone={
                  selectedVariant.availabilityStatus === 'available'
                    ? 'success'
                    : selectedVariant.availabilityStatus === 'sold_out'
                      ? 'danger'
                      : 'accent'
                }
              >
                {
                  CATALOG_AVAILABILITY_LABELS[
                    selectedVariant.availabilityStatus
                  ]
                }
              </Badge>
              {selectedVariant.appliedPromotion ? (
                <Badge tone="accent">
                  {CATALOG_COPY.BADGE_PROMO_APPLIED}:{' '}
                  {selectedVariant.appliedPromotion.title}
                </Badge>
              ) : selectedVariant.conditionalPromotion ? (
                <Badge tone="neutral">
                  {CATALOG_COPY.BADGE_PROMO_CONDITIONAL}:{' '}
                  {selectedVariant.conditionalPromotion.title} (min.{' '}
                  {formatIdr(selectedVariant.conditionalPromotion.minSpendIdr)})
                </Badge>
              ) : null}
            </div>
          </div>

          {isUnconfirmed ? (
            <div className="product-warning-banner" role="note">
              <Info
                size={16}
                aria-hidden="true"
                className="product-warning-icon"
              />
              <p className="product-warning-text">
                {PRODUCT_DETAIL_COPY.UNCONFIRMED_STOCK_WARNING}
              </p>
            </div>
          ) : null}

          {isSoldOut ? (
            <div
              className="product-warning-banner product-warning-banner--danger"
              role="alert"
            >
              <AlertCircle
                size={16}
                aria-hidden="true"
                className="product-warning-icon"
              />
              <p className="product-warning-text">
                {PRODUCT_DETAIL_COPY.SOLD_OUT_WARNING}
              </p>
            </div>
          ) : null}

          <div className="product-qty-subtotal-grid">
            <div className="product-qty-block">
              <span className="product-qty-label">
                {PRODUCT_DETAIL_COPY.QUANTITY_LABEL}
              </span>
              <Quantity
                value={quantity}
                min={1}
                max={selectedVariant.maxQuantityPerOrder}
                onChange={onChangeQuantity}
                label={PRODUCT_DETAIL_COPY.QUANTITY_LABEL}
                disabled={isSoldOut}
                className="product-qty-control"
              />
            </div>

            <div className="product-subtotal-block">
              <span className="product-subtotal-label">
                {PRODUCT_DETAIL_COPY.PRICE_SUBTOTAL_LABEL}
              </span>
              <span className="product-subtotal-value">
                {formatIdr(subtotalIdr)}
              </span>
            </div>
          </div>

          <p className="product-stock-caveat">
            {PRODUCT_DETAIL_COPY.STOCK_CAVEAT_NOTE}
          </p>

          <div className="product-picker-actions">
            {isBundle ? (
              <Button
                disabled={!configurator.isComplete || isSoldOut}
                onClick={() =>
                  onPrepareCart({
                    choiceIds: configurator.selectedChoiceIds,
                    bundleSignature: configurator.bundleSignature,
                    bundleBreakdown: configurator.breakdown,
                    unitPriceIdr: configurator.effectivePriceIdr,
                  })
                }
                size="lg"
                className="product-picker-cta"
              >
                <ShoppingBag size={18} aria-hidden="true" />
                {PRODUCT_DETAIL_COPY.CTA_PREPARE_CART}
              </Button>
            ) : isSoldOut ? (
              <Button
                disabled
                variant="secondary"
                size="lg"
                className="product-picker-cta"
              >
                {PRODUCT_DETAIL_COPY.CTA_SOLD_OUT}
              </Button>
            ) : (
              <Button
                onClick={() => onPrepareCart()}
                size="lg"
                className="product-picker-cta"
              >
                <ShoppingBag size={18} aria-hidden="true" />
                {PRODUCT_DETAIL_COPY.CTA_PREPARE_CART}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
