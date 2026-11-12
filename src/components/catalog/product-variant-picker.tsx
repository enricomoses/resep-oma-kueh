import { Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { Quantity } from '@/components/ui/quantity';
import {
  CATALOG_AVAILABILITY_LABELS,
  CATALOG_COPY,
  PRODUCT_DETAIL_COPY,
} from '@/constants/catalog.constant';
import { formatIdr } from '@/features/catalog/pricing';
import { useProductConfigurator } from '@/hooks/use-product-configurator';
import { cn } from '@/utils';
import type {
  BundleBreakdownItem,
  PreparedCartLinePayload,
  ProductDetail,
  ProductDetailVariant,
} from '@/types/catalog';
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
  preparedPayload: PreparedCartLinePayload | null;
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
  preparedPayload,
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
            size={20}
            className="text-burgundy mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h3 className="text-burgundy text-sm font-semibold">
              {PRODUCT_DETAIL_COPY.VARIANT_BRANCH_REQUIRED_TITLE}
            </h3>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {PRODUCT_DETAIL_COPY.VARIANT_BRANCH_REQUIRED_BODY}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Button disabled className="w-full">
            {PRODUCT_DETAIL_COPY.CTA_BRANCH_REQUIRED}
          </Button>
        </div>
      </Card>
    );
  }

  if (product.offeredVariants.length === 0) {
    return (
      <Card className={cn('product-picker-card', className)}>
        <div className="product-picker-notice" role="alert">
          <Info
            size={20}
            className="text-burgundy mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h3 className="text-burgundy text-sm font-semibold">
              {PRODUCT_DETAIL_COPY.VARIANT_NONE_OFFERED_TITLE}
            </h3>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
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
          <p className="text-muted-foreground mt-1 text-xs">
            {PRODUCT_DETAIL_COPY.VARIANT_SINGLE_NOTE}
          </p>
        ) : null}
      </div>

      {/* Variant Selection Buttons */}
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
              <span className="text-sm font-semibold">{sizeText}</span>
              <span className="mt-0.5 text-xs">
                {isVariantSoldOut
                  ? CATALOG_AVAILABILITY_LABELS.sold_out
                  : formatIdr(variant.effectivePriceIdr)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Variant Pricing & Availability */}
      {selectedVariant ? (
        <div className="product-price-section">
          {/* Bundle Customizer (R11) */}
          {isBundle ? (
            <div className="border-burgundy/10 my-5 border-y py-5">
              <BundleCustomizer
                variant={selectedVariant}
                selectedChoiceIds={configurator.selectedChoiceIds}
                onSelectChoice={configurator.selectChoice}
                validationResult={configurator.validationResult}
              />
            </div>
          ) : null}

          <div className="product-price-row">
            <div>
              <span className="text-muted-foreground block text-xs">
                {PRODUCT_DETAIL_COPY.PRICE_UNIT_LABEL}
              </span>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-burgundy font-serif text-2xl font-bold">
                  {formatIdr(currentUnitPriceIdr)}
                </span>
                {hasPromoDiscount ? (
                  <span className="text-muted-foreground text-sm line-through">
                    {formatIdr(selectedVariant.unitGrossIdr)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
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
                <Badge tone="accent">{CATALOG_COPY.BADGE_PROMO_APPLIED}</Badge>
              ) : null}
            </div>
          </div>

          {/* Unconfirmed stock warning */}
          {isUnconfirmed ? (
            <div className="product-warning-banner" role="note">
              <p className="text-burgundy text-xs leading-relaxed">
                {PRODUCT_DETAIL_COPY.UNCONFIRMED_STOCK_WARNING}
              </p>
            </div>
          ) : null}

          {/* Sold out notice */}
          {isSoldOut ? (
            <div className="product-warning-banner" role="alert">
              <p className="text-xs leading-relaxed text-danger">
                {PRODUCT_DETAIL_COPY.SOLD_OUT_WARNING}
              </p>
            </div>
          ) : null}

          {/* Quantity Controls & Subtotal */}
          <div className="product-qty-subtotal-grid">
            <div>
              <span className="text-foreground/80 mb-1.5 block text-xs font-medium">
                {PRODUCT_DETAIL_COPY.QUANTITY_LABEL}
              </span>
              <Quantity
                value={quantity}
                min={1}
                max={selectedVariant.maxQuantityPerOrder}
                onChange={onChangeQuantity}
                label={PRODUCT_DETAIL_COPY.QUANTITY_LABEL}
                disabled={isSoldOut}
              />
            </div>

            <div className="text-right">
              <span className="text-muted-foreground block text-xs">
                {PRODUCT_DETAIL_COPY.PRICE_SUBTOTAL_LABEL}
              </span>
              <span className="text-burgundy mt-1 block font-serif text-lg font-bold">
                {formatIdr(subtotalIdr)}
              </span>
            </div>
          </div>

          {/* Stock Caveat Note */}
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            {PRODUCT_DETAIL_COPY.STOCK_CAVEAT_NOTE}
          </p>

          {/* CTA & Feedback */}
          <div className="mt-5 space-y-3">
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
                className="w-full"
              >
                {PRODUCT_DETAIL_COPY.CTA_PREPARE_CART}
              </Button>
            ) : isSoldOut ? (
              <Button disabled variant="secondary" className="w-full">
                {PRODUCT_DETAIL_COPY.CTA_SOLD_OUT}
              </Button>
            ) : (
              <Button onClick={() => onPrepareCart()} className="w-full">
                {PRODUCT_DETAIL_COPY.CTA_PREPARE_CART}
              </Button>
            )}

            {/* Prepared Cart Payload Feedback (Wiring to F12) */}
            {preparedPayload &&
            preparedPayload.variantId === selectedVariant.id &&
            preparedPayload.quantity === quantity ? (
              <Feedback
                tone="success"
                title={PRODUCT_DETAIL_COPY.CTA_PREPARED_TITLE}
                className="mt-3"
              >
                <div className="space-y-1 text-xs">
                  <p>{PRODUCT_DETAIL_COPY.CTA_PREPARED_BODY}</p>
                  <div className="border-burgundy/10 text-burgundy/90 mt-2 border-t pt-2 font-mono text-[11px]">
                    <div>
                      <strong>SKU:</strong> {preparedPayload.sku}
                    </div>
                    <div>
                      <strong>Ukuran:</strong>{' '}
                      {preparedPayload.sizeLabel || preparedPayload.variantName}
                    </div>
                    <div>
                      <strong>Jumlah:</strong> {preparedPayload.quantity} unit
                    </div>
                    {preparedPayload.bundleSignature ? (
                      <div>
                        <strong>Signature:</strong>{' '}
                        {preparedPayload.bundleSignature}
                      </div>
                    ) : null}
                    <div>
                      <strong>Subtotal:</strong>{' '}
                      {formatIdr(preparedPayload.estimatedSubtotalIdr)}
                    </div>
                    {preparedPayload.bundleBreakdown &&
                    preparedPayload.bundleBreakdown.length > 0 ? (
                      <div className="mt-2 space-y-1 font-sans">
                        <strong className="text-burgundy block font-semibold">
                          Komposisi 12 Potong:
                        </strong>
                        <ul className="text-burgundy/90 list-inside list-disc space-y-0.5 text-[11px]">
                          {preparedPayload.bundleBreakdown.map((item, idx) => (
                            <li key={idx}>
                              {item.slotOrGroup}: {item.label} ({item.quantity}{' '}
                              potong)
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Feedback>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
