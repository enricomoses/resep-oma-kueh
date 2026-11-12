import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  PRODUCT_ALLERGEN_PRESENCE_LABELS,
  PRODUCT_DETAIL_COPY,
} from '@/constants/catalog.constant';
import { cn } from '@/utils';
import type { ProductDetail, ProductDetailVariant } from '@/types/catalog';

interface ProductFoodInfoProps {
  product: ProductDetail;
  selectedVariant: ProductDetailVariant | null;
  className?: string;
}

export function ProductFoodInfo({
  product,
  selectedVariant,
  className,
}: ProductFoodInfoProps) {
  const dietaryTags = selectedVariant?.verifiedDietaryTags ?? [];
  const allergens = selectedVariant?.verifiedAllergens ?? [];

  return (
    <Card className={cn('product-food-info-card', className)}>
      <h2 className="product-food-info-title">
        {PRODUCT_DETAIL_COPY.FOOD_INFO_TITLE}
      </h2>

      {/* Dietary claims per SKU */}
      <div className="product-food-info-section">
        <h3 className="product-food-info-subtitle">
          {PRODUCT_DETAIL_COPY.DIETARY_TITLE}
        </h3>
        {dietaryTags.length > 0 ? (
          <ul
            className="product-food-dietary-list"
            aria-label={PRODUCT_DETAIL_COPY.DIETARY_TITLE}
          >
            {dietaryTags.map((tag) => (
              <li key={tag.slug}>
                <Badge tone="accent">{tag.name}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="product-food-info-empty">
            {PRODUCT_DETAIL_COPY.DIETARY_EMPTY}
          </p>
        )}
      </div>

      {/* Allergens per SKU */}
      <div className="product-food-info-section">
        <h3 className="product-food-info-subtitle">
          {PRODUCT_DETAIL_COPY.ALLERGEN_TITLE}
        </h3>
        {allergens.length > 0 ? (
          <ul
            className="product-food-allergen-list"
            aria-label={PRODUCT_DETAIL_COPY.ALLERGEN_TITLE}
          >
            {allergens.map((allergen) => (
              <li key={allergen.slug} className="product-food-allergen-item">
                <span className="text-burgundy font-semibold">
                  {allergen.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  (
                  {PRODUCT_ALLERGEN_PRESENCE_LABELS[allergen.presence] ??
                    allergen.presence}
                  )
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="product-food-info-empty">
            {PRODUCT_DETAIL_COPY.ALLERGEN_EMPTY}
          </p>
        )}

        <div
          role="note"
          aria-label="Peringatan Alergen"
          className="product-food-allergen-caveat"
        >
          <p className="text-burgundy/90 text-xs leading-relaxed">
            {PRODUCT_DETAIL_COPY.ALLERGEN_CAVEAT}
          </p>
        </div>
      </div>

      {/* Bundle Recipe if applicable */}
      {selectedVariant?.bundleRecipe ? (
        <div className="product-food-info-section">
          <h3 className="product-food-info-subtitle">
            {PRODUCT_DETAIL_COPY.BUNDLE_OVERVIEW_TITLE}
          </h3>
          <p className="text-foreground/90 text-sm">
            {selectedVariant.bundleRecipe}
          </p>
          {selectedVariant.fixedComponents.length > 0 ? (
            <div className="text-muted-foreground mt-2 text-xs">
              <span className="text-burgundy font-medium">
                {PRODUCT_DETAIL_COPY.BUNDLE_FIXED_LABEL}
              </span>{' '}
              {selectedVariant.fixedComponents
                .map((f) => `${f.componentSlot} (×${f.quantity})`)
                .join(', ')}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Ingredients & Storage Instructions */}
      <div className="product-food-info-grid">
        <div className="product-food-info-section">
          <h3 className="product-food-info-subtitle">
            {PRODUCT_DETAIL_COPY.INGREDIENTS_TITLE}
          </h3>
          <p className="text-foreground/80 text-sm leading-relaxed">
            {product.ingredientsInfo || PRODUCT_DETAIL_COPY.INGREDIENTS_PENDING}
          </p>
        </div>

        <div className="product-food-info-section">
          <h3 className="product-food-info-subtitle">
            {PRODUCT_DETAIL_COPY.STORAGE_TITLE}
          </h3>
          <p className="text-foreground/80 text-sm leading-relaxed">
            {product.storageInstructions || PRODUCT_DETAIL_COPY.STORAGE_PENDING}
          </p>
        </div>
      </div>
    </Card>
  );
}
