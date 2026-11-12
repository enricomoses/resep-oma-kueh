'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MediaPlaceholder } from '@/app/_components';
import { Badge } from '@/components/ui/badge';
import { PRODUCT_DETAIL_COPY } from '@/constants/catalog.constant';
import { cn } from '@/utils';
import type { ProductDetailImage } from '@/types/catalog';

interface ProductGalleryProps {
  images: ProductDetailImage[];
  selectedVariantId: string | null;
  productName: string;
  className?: string;
}

export function ProductGallery({
  images,
  selectedVariantId,
  productName,
  className,
}: ProductGalleryProps) {
  const [userSelectedIndex, setUserSelectedIndex] = useState<number | null>(
    null,
  );
  const [prevVariantId, setPrevVariantId] = useState<string | null>(
    selectedVariantId,
  );
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(
    () => new Set(),
  );

  // When variant changes, reset user manual selection to let variant image take precedence
  if (prevVariantId !== selectedVariantId) {
    setPrevVariantId(selectedVariantId);
    setUserSelectedIndex(null);
  }

  const variantImageIndex = selectedVariantId
    ? images.findIndex((img) => img.variantId === selectedVariantId)
    : -1;

  const activeIndex =
    userSelectedIndex !== null
      ? userSelectedIndex
      : variantImageIndex !== -1
        ? variantImageIndex
        : 0;

  const currentImage = images[activeIndex] ?? null;
  const isVariantSpecific =
    Boolean(currentImage) &&
    Boolean(selectedVariantId) &&
    currentImage?.variantId === selectedVariantId;

  const handleImageError = (id: string) => {
    setFailedImageIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <section
      aria-label={PRODUCT_DETAIL_COPY.GALLERY_REGION_LABEL}
      className={cn('product-gallery', className)}
    >
      <div className="product-gallery-main">
        {currentImage?.publicUrl && !failedImageIds.has(currentImage.id) ? (
          <div className="product-gallery-image-wrapper">
            <Image
              src={currentImage.publicUrl}
              alt={currentImage.altText || productName}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="product-gallery-img"
              unoptimized
              onError={() => handleImageError(currentImage.id)}
            />
          </div>
        ) : (
          <MediaPlaceholder
            caption={
              currentImage?.altText ||
              `DEMO — ${productName} (foto resmi dalam kurasi)`
            }
            className="product-gallery-placeholder"
          />
        )}

        {isVariantSpecific ? (
          <div className="product-gallery-variant-badge">
            <Badge tone="accent">
              {PRODUCT_DETAIL_COPY.GALLERY_VARIANT_BADGE}
            </Badge>
          </div>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div
          role="group"
          aria-label={PRODUCT_DETAIL_COPY.GALLERY_THUMBNAILS_LABEL}
          className="product-gallery-thumbnails"
        >
          {images.map((img, index) => {
            const isSelected = activeIndex === index;
            const isThumbFailed = failedImageIds.has(img.id);

            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setUserSelectedIndex(index)}
                aria-label={PRODUCT_DETAIL_COPY.GALLERY_THUMBNAIL_ITEM(
                  index + 1,
                  img.altText || productName,
                )}
                aria-current={isSelected ? 'true' : undefined}
                className={cn(
                  'product-gallery-thumb-btn',
                  isSelected && 'product-gallery-thumb-active',
                )}
              >
                {img.publicUrl && !isThumbFailed ? (
                  <div className="product-gallery-thumb-wrapper">
                    <Image
                      src={img.publicUrl}
                      alt=""
                      fill
                      sizes="80px"
                      className="product-gallery-thumb-img"
                      unoptimized
                      onError={() => handleImageError(img.id)}
                    />
                  </div>
                ) : (
                  <div className="product-gallery-thumb-fallback">
                    <span>{index + 1}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
