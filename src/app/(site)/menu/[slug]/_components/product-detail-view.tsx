'use client';

import { HelpCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ErrorState } from '@/components/common/feedback/error-state';
import { ToastMessage } from '@/components/common/feedback/toast-message';
import { MenuProductCard } from '@/components/common/commerce/menu-product-card';
import { BackLink } from '@/components/common/layout/back-link';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants';
import { CART_COPY } from '@/constants/cart.constant';
import {
  CATALOG_COPY,
  CATALOG_QUERY_PARAMS,
  PRODUCT_DETAIL_COPY,
} from '@/constants/catalog.constant';
import { useBranches } from '@/hooks/use-branches';
import { useProductDetail } from '@/hooks/queries/use-catalog';
import { dismissToast, notifyError, notifySuccess } from '@/lib/toast';
import { useCartStore } from '@/stores/cart.store';
import type {
  BundleBreakdownItem,
  InitialCatalogSection,
  ProductDetail,
  ProductDetailVariant,
} from '@/types/catalog';
import '@/styles/components/product-card.css';
import '@/styles/features/product-detail.css';
import { cn, formatIdr } from '@/utils';
import { withBranch } from '@/utils/branch-url';
import { preparedCartLinePayloadSchema } from '@/validations/catalog.schema';
import { ProductFoodInfo } from './product-food-info';
import { ProductGallery } from './product-gallery';
import { ProductVariantPicker } from './product-variant-picker';

const CART_ADDED_TOAST_ID = 'cart-item-added';
const CART_LIMIT_TOAST_ID = 'cart-limit-error';

interface ProductDetailViewProps {
  slug: string;
  initial: InitialCatalogSection<ProductDetail>;
  className?: string;
}

export function ProductDetailView({
  slug,
  initial,
  className,
}: ProductDetailViewProps) {
  const searchParams = useSearchParams();
  const urlBranch =
    searchParams?.get(CATALOG_QUERY_PARAMS.BRANCH)?.trim() || null;

  const branchState = useBranches();
  const matchedUrlBranch = urlBranch
    ? (branchState.items.find((b) => b.code === urlBranch) ?? null)
    : null;
  const activeBranch = branchState.selected ?? matchedUrlBranch;

  const isInitialBranchMatch =
    initial.status === 'success' &&
    (initial.data.resolvedBranchCode ?? null) ===
      (activeBranch?.code ?? urlBranch ?? null);

  const activeBranchId =
    activeBranch?.id ??
    (isInitialBranchMatch && initial.status === 'success'
      ? initial.data.resolvedBranchId
      : null);
  const activeBranchCode =
    activeBranch?.code ??
    urlBranch ??
    (isInitialBranchMatch && initial.status === 'success'
      ? initial.data.resolvedBranchCode
      : null);

  const hasBranchSelected = activeBranchCode !== null;

  const detailQuery = useProductDetail(slug, activeBranchCode, initial);

  const product =
    detailQuery.data ??
    (isInitialBranchMatch && initial.status === 'success'
      ? initial.data
      : null);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState<number>(1);

  const offeredVariants = product?.offeredVariants ?? [];
  const activeVariant: ProductDetailVariant | null =
    offeredVariants.find((v) => v.id === selectedVariantId) ||
    offeredVariants.find((v) => v.isDefault) ||
    offeredVariants[0] ||
    null;

  const handleSelectVariant = (variant: ProductDetailVariant) => {
    setSelectedVariantId(variant.id);
  };

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
  };

  const handlePrepareCart = (bundleData?: {
    choiceIds: string[];
    bundleSignature: string | null;
    bundleBreakdown: BundleBreakdownItem[];
    unitPriceIdr: number;
  }) => {
    if (!product || !activeVariant || !activeBranchId || !activeBranchCode)
      return;

    const unitPrice =
      bundleData?.unitPriceIdr ?? activeVariant.effectivePriceIdr;

    const rawPayload = {
      branchId: activeBranchId,
      branchCode: activeBranchCode,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productType: product.productType,
      variantId: activeVariant.id,
      sku: activeVariant.sku,
      variantName: activeVariant.name,
      sizeLabel: activeVariant.sizeLabel,
      quantity,
      choiceIds: bundleData?.choiceIds ?? [],
      bundleSignature: bundleData?.bundleSignature ?? null,
      bundleBreakdown: bundleData?.bundleBreakdown ?? [],
      estimatedUnitPriceIdr: unitPrice,
      estimatedSubtotalIdr: unitPrice * quantity,
    };

    const parsed = preparedCartLinePayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      notifyError(
        'Pilihan produk tidak valid. Periksa kembali varian dan jumlah pesanan.',
        { toastId: CART_LIMIT_TOAST_ID },
      );
      return;
    }

    const result = useCartStore.getState().addLine({
      branchId: activeBranchId,
      branchCode: activeBranchCode,
      variantId: activeVariant.id,
      choiceIds: bundleData?.choiceIds ?? [],
      quantity,
    });

    if (!result.success) {
      const errorMessage =
        result.reason === 'max_lines_exceeded'
          ? CART_COPY.LIMIT_LINES_EXCEEDED
          : result.reason === 'max_quantity_exceeded'
            ? CART_COPY.LIMIT_QTY_EXCEEDED
            : 'Pilihan produk tidak valid. Periksa kembali varian dan jumlah pesanan.';
      notifyError(errorMessage, { toastId: CART_LIMIT_TOAST_ID });
      return;
    }

    const payload = parsed.data;
    const bundleSummary =
      payload.bundleBreakdown && payload.bundleBreakdown.length > 0
        ? `Komposisi 12 Potong: ${payload.bundleBreakdown
            .map(
              (item) =>
                `${item.slotOrGroup}: ${item.label} (${item.quantity} potong)`,
            )
            .join(', ')}`
        : null;

    notifySuccess(
      <ToastMessage
        title={PRODUCT_DETAIL_COPY.CTA_PREPARED_TITLE}
        description={`${payload.productName} · ${payload.sizeLabel || payload.variantName} (${payload.quantity} unit) · ${formatIdr(payload.estimatedSubtotalIdr)}`}
        meta={`SKU: ${payload.sku}${bundleSummary ? ` · ${bundleSummary}` : ''}`}
        actionHref={withBranch(ROUTES.CART, payload.branchCode)}
        actionLabel={CART_COPY.VIEW_CART}
        onAction={() => dismissToast(CART_ADDED_TOAST_ID)}
      />,
      { toastId: CART_ADDED_TOAST_ID, autoClose: 6000 },
    );
  };

  if ((initial.status === 'error' || detailQuery.isError) && !product) {
    return (
      <main id="konten" className={cn('product-detail-page', className)}>
        <div className="product-detail-container">
          <ErrorState
            className="my-10"
            title={PRODUCT_DETAIL_COPY.ERROR_TITLE}
            message={PRODUCT_DETAIL_COPY.ERROR_BODY}
            onRetry={() => void detailQuery.refetch()}
            retryLabel={PRODUCT_DETAIL_COPY.RETRY_CTA}
            announce={false}
          />
        </div>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <main id="konten" className={cn('product-detail-page', className)}>
      <div className="product-detail-container">
        <nav
          aria-label="Navigasi ke menu"
          className="product-detail-nav-header"
        >
          <BackLink
            href={withBranch(ROUTES.MENU, activeBranchCode)}
            label={PRODUCT_DETAIL_COPY.BACK_TO_MENU}
          />
        </nav>

        <div className="product-detail-header">
          <span className="product-detail-category">
            {product.primaryCategory.name}
          </span>
          <h1 className="product-detail-title">{product.name}</h1>

          <div className="home-badge-row mt-2">
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
              <Badge tone="accent">{CATALOG_COPY.BADGE_BUNDLE}</Badge>
            ) : null}
          </div>

          {product.shortDescription || product.description ? (
            <p className="product-detail-desc">
              {product.shortDescription || product.description}
            </p>
          ) : null}
        </div>

        <div className="product-detail-main-grid">
          <ProductGallery
            images={product.images}
            selectedVariantId={activeVariant?.id ?? null}
            productName={product.name}
          />

          <ProductVariantPicker
            product={product}
            selectedVariant={activeVariant}
            onSelectVariant={handleSelectVariant}
            quantity={quantity}
            onChangeQuantity={handleQuantityChange}
            hasBranchSelected={hasBranchSelected}
            onPrepareCart={handlePrepareCart}
          />
        </div>

        <div className="product-detail-food-section">
          <ProductFoodInfo product={product} selectedVariant={activeVariant} />
        </div>

        <Card className="product-detail-faq-banner">
          <div className="flex items-center gap-3">
            <HelpCircle
              size={20}
              className="text-burgundy shrink-0"
              aria-hidden="true"
            />
            <p className="text-foreground/90 text-xs font-medium md:text-sm">
              {PRODUCT_DETAIL_COPY.FAQ_HELP_TEXT}
            </p>
          </div>
          <ActionLink
            href={withBranch(ROUTES.FAQ, activeBranchCode)}
            className="shrink-0 text-xs font-semibold tracking-wider uppercase"
          >
            {PRODUCT_DETAIL_COPY.FAQ_HELP_CTA}
          </ActionLink>
        </Card>

        {product.relatedProducts.length > 0 ? (
          <section
            aria-label={PRODUCT_DETAIL_COPY.RELATED_TITLE}
            className="product-detail-related"
          >
            <div className="product-detail-related-header">
              <h2 className="product-detail-related-title font-serif">
                {PRODUCT_DETAIL_COPY.RELATED_TITLE}
              </h2>
              <p className="product-detail-related-subtitle">
                {PRODUCT_DETAIL_COPY.RELATED_SUBTITLE}
              </p>
            </div>

            <div className="product-grid">
              {product.relatedProducts.map((relProduct) => (
                <MenuProductCard
                  key={relProduct.id}
                  product={relProduct}
                  hasBranchSelected={hasBranchSelected}
                  branchCode={activeBranchCode}
                  previewImageUrl={relProduct.previewImageUrl ?? null}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
