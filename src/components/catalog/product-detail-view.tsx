'use client';

import { ArrowLeft, HelpCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ROUTES } from '@/constants';
import {
  CATALOG_COPY,
  CATALOG_QUERY_PARAMS,
  PRODUCT_DETAIL_COPY,
} from '@/constants/catalog.constant';
import { useBranches } from '@/hooks/use-branches';
import { useProductDetail } from '@/hooks/use-catalog';
import type { InitialCatalogSection } from '@/hooks/use-catalog';
import { useCartStore } from '@/stores/cart.store';
import { preparedCartLinePayloadSchema } from '@/validations/catalog.schema';
import { withBranch } from '@/utils/branch-url';
import { cn } from '@/utils';
import type {
  BundleBreakdownItem,
  PreparedCartLinePayload,
  ProductDetail,
  ProductDetailVariant,
} from '@/types/catalog';
import { MenuProductCard } from './menu-product-card';
import { ProductFoodInfo } from './product-food-info';
import { ProductGallery } from './product-gallery';
import { ProductVariantPicker } from './product-variant-picker';

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
    detailQuery.data?.ok && detailQuery.data.data
      ? detailQuery.data.data
      : isInitialBranchMatch && initial.status === 'success'
        ? initial.data
        : null;

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [preparedPayload, setPreparedPayload] =
    useState<PreparedCartLinePayload | null>(null);

  // Derive active selected variant
  const offeredVariants = product?.offeredVariants ?? [];
  const activeVariant: ProductDetailVariant | null =
    offeredVariants.find((v) => v.id === selectedVariantId) ||
    offeredVariants.find((v) => v.isDefault) ||
    offeredVariants[0] ||
    null;

  const handleSelectVariant = (variant: ProductDetailVariant) => {
    setSelectedVariantId(variant.id);
    setPreparedPayload(null);
  };

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
    setPreparedPayload(null);
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
    if (parsed.success) {
      setPreparedPayload(parsed.data);
      useCartStore.getState().addLine({
        branchId: activeBranchId,
        branchCode: activeBranchCode,
        variantId: activeVariant.id,
        choiceIds: bundleData?.choiceIds ?? [],
        quantity,
      });
    }
  };

  if ((initial.status === 'error' || detailQuery.isError) && !product) {
    return (
      <main id="konten" className={cn('product-detail-page', className)}>
        <div className="product-detail-container">
          <Feedback
            tone="error"
            title={PRODUCT_DETAIL_COPY.ERROR_TITLE}
            className="my-10"
          >
            <p className="mb-4">{PRODUCT_DETAIL_COPY.ERROR_BODY}</p>
            <Button
              onClick={() => detailQuery.refetch()}
              variant="secondary"
              size="sm"
            >
              {PRODUCT_DETAIL_COPY.RETRY_CTA}
            </Button>
          </Feedback>
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
        {/* Navigation Breadcrumb / Back Link */}
        <nav
          aria-label="Navigasi ke menu"
          className="product-detail-nav-header"
        >
          <ActionLink
            href={withBranch(ROUTES.MENU, activeBranchCode)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{PRODUCT_DETAIL_COPY.BACK_TO_MENU}</span>
          </ActionLink>
        </nav>

        {/* Product Heading & Badges */}
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

        {/* Main 2-Column Grid: Gallery (Left) & Picker (Right) */}
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
            preparedPayload={preparedPayload}
          />
        </div>

        {/* Food Info, Dietary & Allergen Section */}
        <div className="mt-12">
          <ProductFoodInfo product={product} selectedVariant={activeVariant} />
        </div>

        {/* FAQ Help Banner */}
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

        {/* Related Products Section */}
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

            <div className="menu-product-grid">
              {product.relatedProducts.map((relProduct) => (
                <MenuProductCard
                  key={relProduct.id}
                  product={relProduct}
                  hasBranchSelected={hasBranchSelected}
                  branchCode={activeBranchCode}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
