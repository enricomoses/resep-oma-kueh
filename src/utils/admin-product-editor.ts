import {
  ADMIN_CATALOG_COPY,
  ADMIN_CATALOG_LIMITS,
  ADMIN_MEDIA_LIMITS,
} from '@/constants/admin-catalog.constant';
import { computeVariantEffectivePrice } from '@/utils/catalog-pricing';
import type {
  AdminCategoryItem,
  AdminProductEditorAggregate,
  AdminReferenceComponentVariant,
  AdminReferenceDietaryTag,
  ProductEditorFormState,
  SaveProductConfigurationInput,
} from '@/types/admin-catalog';
import type { CatalogProductItem } from '@/types/catalog';
import {
  ADMIN_MEDIA_BUCKETS,
  isSafeStoragePathForBucket,
} from '@/utils/admin-media';

export interface ProductConfigurationValidationContext {
  productId?: string;
  categoriesById: Map<
    string,
    Pick<AdminCategoryItem, 'id' | 'status' | 'name'>
  >;
  dietaryTagsById: Map<string, AdminReferenceDietaryTag>;
  componentVariantsById: Map<string, AdminReferenceComponentVariant>;
  existingVariantSkusById?: Map<string, string>;
  requireApprovedBucketWhenApproved?: boolean;
}

function addFieldError(
  errors: Record<string, string[]>,
  field: string,
  message: string,
): void {
  const existing = errors[field];
  if (existing) {
    if (!existing.includes(message)) {
      existing.push(message);
    }
    return;
  }
  errors[field] = [message];
}

/**
 * Pure domain validator for F17 product configuration (categories, variants,
 * Chiffon Mix 12-slice bundle constraints, dietary evidence/GF propagation, media, and publish gates).
 * Shared identically by browser validation and the server PUT aggregate route handler.
 */
export function validateProductConfiguration(
  input: SaveProductConfigurationInput,
  ctx: ProductConfigurationValidationContext,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  // 1. Categories: no duplicates, single primary when >= 1 category
  const seenCategories = new Set<string>();
  let primaryCategoryCount = 0;
  let hasPublishedCategory = false;

  input.categories.forEach((cat, idx) => {
    if (seenCategories.has(cat.categoryId)) {
      addFieldError(
        errors,
        `categories.${idx}.categoryId`,
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.DUPLICATE_CATEGORY,
      );
    }
    seenCategories.add(cat.categoryId);
    if (cat.isPrimary) {
      primaryCategoryCount += 1;
    }
    const refCat = ctx.categoriesById.get(cat.categoryId);
    if (!refCat) {
      addFieldError(
        errors,
        `categories.${idx}.categoryId`,
        'Kategori tidak ditemukan.',
      );
    } else if (refCat.status === 'published') {
      hasPublishedCategory = true;
    }
  });

  if (input.categories.length > 0 && primaryCategoryCount !== 1) {
    addFieldError(
      errors,
      'categories',
      ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SINGLE_PRIMARY_CATEGORY,
    );
  }

  // 2. Variants: unique SKU, immutable existing SKU, single default non-archived
  if (input.variants.length === 0) {
    addFieldError(
      errors,
      'variants',
      ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.MIN_ONE_VARIANT,
    );
  }

  const seenSkus = new Set<string>();
  const nonArchivedVariants = input.variants.filter(
    (v) => v.status !== 'archived',
  );
  const activeVariants = input.variants.filter((v) => v.status === 'active');
  let defaultVariantCount = 0;

  if (input.product.productType === 'simple' && activeVariants.length > 1) {
    addFieldError(
      errors,
      'variants',
      ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SIMPLE_MAX_ACTIVE_VARIANTS,
    );
  }

  input.variants.forEach((variant, vIdx) => {
    const skuKey = variant.sku.trim().toUpperCase();
    if (seenSkus.has(skuKey)) {
      addFieldError(
        errors,
        `variants.${vIdx}.sku`,
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.DUPLICATE_SKU,
      );
    }
    seenSkus.add(skuKey);

    const oldSku = ctx.existingVariantSkusById?.get(variant.id);
    if (oldSku && oldSku !== variant.sku) {
      addFieldError(
        errors,
        `variants.${vIdx}.sku`,
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SKU_IMMUTABLE,
      );
    }

    if (variant.isDefault) {
      if (variant.status === 'archived') {
        addFieldError(
          errors,
          `variants.${vIdx}.isDefault`,
          'Varian arsip tidak dapat dijadikan default.',
        );
      } else {
        defaultVariantCount += 1;
      }
    }

    // Check bundle rules if productType === 'bundle'
    const referencedComponents: AdminReferenceComponentVariant[] = [];

    if (input.product.productType === 'bundle') {
      const mustVerifyBundle =
        variant.bundleRulesVerified ||
        (input.product.status === 'published' && variant.status === 'active');

      if (variant.bundleRecipe && variant.bundleRecipe !== 'chiffon_mix') {
        addFieldError(
          errors,
          `variants.${vIdx}.bundleRecipe`,
          ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.INVALID_BUNDLE_UNITS,
        );
      }

      if (
        variant.bundleRecipe === 'chiffon_mix' &&
        variant.bundleUnitsTotal !== ADMIN_CATALOG_LIMITS.CHIFFON_TOTAL_UNITS
      ) {
        addFieldError(
          errors,
          `variants.${vIdx}.bundleUnitsTotal`,
          ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.INVALID_BUNDLE_UNITS,
        );
      }

      const fixedProductIds = new Set<string>();
      const fixedVariantIds = new Set<string>();
      const seenSlots = new Set<string>();

      variant.fixedComponents.forEach((fixed, fIdx) => {
        if (seenSlots.has(fixed.componentSlot)) {
          addFieldError(
            errors,
            `variants.${vIdx}.fixedComponents.${fIdx}.componentSlot`,
            'Slot komponen tetap tidak boleh duplikat.',
          );
        }
        seenSlots.add(fixed.componentSlot);

        if (fixedVariantIds.has(fixed.componentVariantId)) {
          addFieldError(
            errors,
            `variants.${vIdx}.fixedComponents.${fIdx}.componentVariantId`,
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS
              .DUPLICATE_COMPONENT_IN_BUNDLE,
          );
        }
        fixedVariantIds.add(fixed.componentVariantId);

        const comp = ctx.componentVariantsById.get(fixed.componentVariantId);
        if (
          !comp ||
          comp.productType === 'bundle' ||
          comp.status !== 'active' ||
          (ctx.productId && comp.productId === ctx.productId)
        ) {
          addFieldError(
            errors,
            `variants.${vIdx}.fixedComponents.${fIdx}.componentVariantId`,
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS
              .FOREIGN_OR_INVALID_COMPONENT,
          );
        } else {
          fixedProductIds.add(comp.productId);
          referencedComponents.push(comp);
        }

        if (
          mustVerifyBundle &&
          fixed.quantity !== ADMIN_CATALOG_LIMITS.CHIFFON_GROUP_SELECTION_QTY
        ) {
          addFieldError(
            errors,
            `variants.${vIdx}.fixedComponents.${fIdx}.quantity`,
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.INVALID_BUNDLE_UNITS,
          );
        }
      });

      const groupChoiceProducts: Set<string>[] = [];

      variant.optionGroups.forEach((group, gIdx) => {
        if (group.isRequired && group.minSelect <= 0) {
          addFieldError(
            errors,
            `variants.${vIdx}.optionGroups.${gIdx}.minSelect`,
            'Grup wajib minimal memiliki 1 pilihan.',
          );
        }
        if (group.maxSelect < group.minSelect) {
          addFieldError(
            errors,
            `variants.${vIdx}.optionGroups.${gIdx}.maxSelect`,
            'Maksimum pilihan tidak boleh kurang dari minimum.',
          );
        }
        if (
          mustVerifyBundle &&
          (group.minSelect !== 1 ||
            group.maxSelect !== 1 ||
            group.quantityPerSelection !==
              ADMIN_CATALOG_LIMITS.CHIFFON_GROUP_SELECTION_QTY ||
            !group.isRequired)
        ) {
          addFieldError(
            errors,
            `variants.${vIdx}.optionGroups.${gIdx}.quantityPerSelection`,
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.INVALID_BUNDLE_UNITS,
          );
        }

        const seenGroupVariants = new Set<string>();
        const activeProductsInGroup = new Set<string>();

        group.choices.forEach((choice, cIdx) => {
          if (seenGroupVariants.has(choice.componentVariantId)) {
            addFieldError(
              errors,
              `variants.${vIdx}.optionGroups.${gIdx}.choices.${cIdx}.componentVariantId`,
              ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS
                .DUPLICATE_COMPONENT_IN_BUNDLE,
            );
          }
          seenGroupVariants.add(choice.componentVariantId);

          const comp = ctx.componentVariantsById.get(choice.componentVariantId);
          if (
            !comp ||
            comp.productType === 'bundle' ||
            (choice.isActive && comp.status !== 'active') ||
            (ctx.productId && comp.productId === ctx.productId)
          ) {
            addFieldError(
              errors,
              `variants.${vIdx}.optionGroups.${gIdx}.choices.${cIdx}.componentVariantId`,
              ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS
                .FOREIGN_OR_INVALID_COMPONENT,
            );
          } else if (choice.isActive) {
            if (fixedProductIds.has(comp.productId)) {
              addFieldError(
                errors,
                `variants.${vIdx}.optionGroups.${gIdx}.choices.${cIdx}.componentVariantId`,
                'Rasa pilihan tidak boleh sama dengan komponen tetap Cheese/Choco.',
              );
            }
            activeProductsInGroup.add(comp.productId);
            referencedComponents.push(comp);
          }
        });

        if (mustVerifyBundle && activeProductsInGroup.size === 0) {
          addFieldError(
            errors,
            `variants.${vIdx}.optionGroups.${gIdx}.choices`,
            'Setiap grup pilihan aktif harus memiliki minimal 1 pilihan aktif.',
          );
        }
        groupChoiceProducts.push(activeProductsInGroup);
      });

      if (mustVerifyBundle) {
        if (
          variant.bundleRecipe !== 'chiffon_mix' ||
          variant.bundleUnitsTotal !==
            ADMIN_CATALOG_LIMITS.CHIFFON_TOTAL_UNITS ||
          !variant.bundleRulesVerified ||
          variant.fixedComponents.length !== 2 ||
          fixedProductIds.size !== 2 ||
          variant.optionGroups.length !== 2
        ) {
          addFieldError(
            errors,
            `variants.${vIdx}.bundleRulesVerified`,
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.INVALID_BUNDLE_UNITS,
          );
        } else if (groupChoiceProducts.length === 2) {
          const g1 = groupChoiceProducts[0];
          const g2 = groupChoiceProducts[1];
          let hasDistinctPair = false;
          for (const p1 of g1) {
            for (const p2 of g2) {
              if (p1 !== p2) {
                hasDistinctPair = true;
                break;
              }
            }
            if (hasDistinctPair) break;
          }
          if (!hasDistinctPair) {
            addFieldError(
              errors,
              `variants.${vIdx}.optionGroups`,
              'Kedua grup pilihan harus menyediakan kombinasi 2 rasa berbeda yang valid.',
            );
          }
        }
      }
    }

    // 3. Dietary evidence + Gluten-Free propagation rule
    variant.dietaryTags.forEach((tag, dIdx) => {
      const refTag = ctx.dietaryTagsById.get(tag.dietaryTagId);
      if (!refTag) {
        addFieldError(
          errors,
          `variants.${vIdx}.dietaryTags.${dIdx}.dietaryTagId`,
          'Label diet tidak dikenali.',
        );
        return;
      }

      if (tag.verificationStatus === 'verified') {
        const trimmedNote = tag.note?.trim() ?? '';
        if (trimmedNote.length < 3) {
          addFieldError(
            errors,
            `variants.${vIdx}.dietaryTags.${dIdx}.note`,
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.DIETARY_EVIDENCE_REQUIRED,
          );
        }

        if (
          refTag.slug === 'gluten-free' &&
          input.product.productType === 'bundle'
        ) {
          const hasUnverifiedComponent = referencedComponents.some(
            (comp) => !comp.isGlutenFreeVerified,
          );
          if (hasUnverifiedComponent) {
            addFieldError(
              errors,
              `variants.${vIdx}.dietaryTags.${dIdx}.verificationStatus`,
              ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.GF_COMPONENT_UNVERIFIED,
            );
          }
        }
      }
    });
  });

  if (nonArchivedVariants.length > 0 && defaultVariantCount !== 1) {
    addFieldError(
      errors,
      'variants',
      ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SINGLE_DEFAULT_VARIANT,
    );
  }

  // 4. Images validation
  let primaryImageCount = 0;
  let hasApprovedImage = false;
  const variantIds = new Set(input.variants.map((v) => v.id));
  const activeVariantIds = new Set(activeVariants.map((v) => v.id));

  input.images.forEach((img, iIdx) => {
    if (img.isPrimary) {
      primaryImageCount += 1;
    }

    if (!isSafeStoragePathForBucket(img.storageBucket, img.storagePath)) {
      addFieldError(
        errors,
        `images.${iIdx}.storagePath`,
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.IMAGE_STORAGE_INVALID,
      );
    }

    if (img.variantId && !variantIds.has(img.variantId)) {
      addFieldError(
        errors,
        `images.${iIdx}.variantId`,
        'Varian yang ditautkan ke foto tidak ditemukan pada produk ini.',
      );
    }

    if (img.isApproved) {
      const alt = img.altText?.trim() ?? '';
      if (alt.length < ADMIN_MEDIA_LIMITS.ALT_TEXT_MIN) {
        addFieldError(
          errors,
          `images.${iIdx}.altText`,
          ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS
            .IMAGE_ALT_REQUIRED_FOR_APPROVAL,
        );
      }

      if (
        ctx.requireApprovedBucketWhenApproved &&
        img.storageBucket !== ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES
      ) {
        addFieldError(
          errors,
          `images.${iIdx}.storageBucket`,
          'Foto berstatus disetujui harus berada pada bucket product-images.',
        );
      }

      if (
        alt.length >= ADMIN_MEDIA_LIMITS.ALT_TEXT_MIN &&
        (!img.variantId || activeVariantIds.has(img.variantId))
      ) {
        hasApprovedImage = true;
      }
    }
  });

  if (primaryImageCount > 1) {
    addFieldError(
      errors,
      'images',
      ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SINGLE_PRIMARY_IMAGE,
    );
  }

  // 5. Publish prerequisites check when target status === 'published'
  if (input.product.status === 'published') {
    if (input.product.needsOwnerReview) {
      addFieldError(
        errors,
        'product.needsOwnerReview',
        'Selesaikan review Owner terlebih dahulu sebelum mempublikasikan produk.',
      );
    }
    if (!hasPublishedCategory) {
      addFieldError(
        errors,
        'categories',
        'Minimal 1 kategori berstatus terpublikasi wajib ditautkan.',
      );
    }
    if (activeVariants.length === 0) {
      addFieldError(
        errors,
        'variants',
        'Minimal 1 varian SKU berstatus aktif diperlukan untuk publikasi.',
      );
    }
    if (!hasApprovedImage) {
      addFieldError(
        errors,
        'images',
        'Minimal 1 foto disetujui dengan teks alt wajib tersedia sebelum publikasi.',
      );
    }
  }

  return errors;
}

/**
 * Projects current editor configuration into CatalogProductItem DTO for live MenuProductCard preview.
 * Uses shared pure pricing calculator (`computeVariantEffectivePrice`) — zero duplicated pricing rules.
 */
export function buildPublicPreviewProductDto(params: {
  productId: string;
  slug: string;
  createdAt?: string;
  config: SaveProductConfigurationInput;
  categoriesById: Map<string, AdminCategoryItem>;
  dietaryTagsById: Map<string, AdminReferenceDietaryTag>;
  previewImages: ReadonlyArray<{
    id: string;
    isPrimary: boolean;
    isApproved: boolean;
    sortOrder: number;
    altText: string | null;
    previewUrl: string | null;
  }>;
}): { cardProduct: CatalogProductItem; previewImageUrl: string | null } {
  const {
    productId,
    slug,
    createdAt,
    config,
    categoriesById,
    dietaryTagsById,
    previewImages,
  } = params;
  const activeVariants = config.variants.filter((v) => v.status === 'active');

  const categoryIds = config.categories.map((c) => c.categoryId);
  const primaryCatLink =
    config.categories.find((c) => c.isPrimary) ?? config.categories[0] ?? null;
  const primaryCat = primaryCatLink
    ? categoriesById.get(primaryCatLink.categoryId)
    : null;

  let minEffective: number | null = null;
  let minGross: number | null = null;
  const now = new Date();

  const verifiedTagsMap = new Map<string, { slug: string; name: string }>();

  for (const variant of activeVariants) {
    const priced = computeVariantEffectivePrice(
      {
        basePriceIdr: variant.basePriceIdr,
        priceOverrideIdr: null,
        optionGroups: variant.optionGroups.map((g) => ({
          id: g.id,
          minSelect: g.minSelect,
          maxSelect: g.maxSelect,
          isRequired: g.isRequired,
          choices: g.choices.map((c) => ({
            id: c.id,
            priceDeltaIdr: c.priceDeltaIdr,
            isActive: c.isActive,
          })),
        })),
      },
      {
        branchId: 'preview-branch',
        productId,
        variantId: variant.id,
        categoryIds,
      },
      [],
      now,
    );

    if (priced) {
      if (minEffective === null || priced.effectivePriceIdr < minEffective) {
        minEffective = priced.effectivePriceIdr;
        minGross = priced.unitGrossIdr;
      }
    }

    for (const dt of variant.dietaryTags) {
      if (dt.verificationStatus === 'verified') {
        const ref = dietaryTagsById.get(dt.dietaryTagId);
        if (ref) {
          verifiedTagsMap.set(ref.slug, { slug: ref.slug, name: ref.name });
        }
      }
    }
  }

  const orderedImages = [...previewImages].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    if (a.isApproved !== b.isApproved) return a.isApproved ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
  const heroImage =
    orderedImages.find((img) => img.isApproved && img.previewUrl) ??
    orderedImages[0] ??
    null;

  return {
    previewImageUrl: heroImage?.previewUrl ?? null,
    cardProduct: {
      id: productId,
      name: config.product.name || 'Pratinjau Produk',
      slug,
      shortDescription: config.product.shortDescription,
      description: config.product.description,
      productType: config.product.productType,
      isFeatured: config.product.isFeatured,
      isBestSeller: config.product.isBestSeller,
      isNew: config.product.isNew,
      sortOrder: config.product.sortOrder,
      createdAt: createdAt ?? '2026-11-12T00:00:00.000Z',
      primaryCategory: primaryCat
        ? {
            id: primaryCat.id,
            name: primaryCat.name,
            slug: primaryCat.slug,
          }
        : null,
      imageAlt: heroImage?.altText ?? config.product.name ?? 'Pratinjau Produk',
      activeVariantCount: activeVariants.length,
      offeredVariantCount: activeVariants.length,
      availabilityStatus: activeVariants.length > 0 ? 'available' : null,
      fromPriceIdr: minEffective,
      baseFromPriceIdr: minGross,
      appliedPromotion: null,
      conditionalPromotion: null,
      verifiedDietaryTags: Array.from(verifiedTagsMap.values()),
    },
  };
}

export function toProductEditorFormState(
  aggregate: AdminProductEditorAggregate,
): ProductEditorFormState {
  return {
    expectedUpdatedAt: aggregate.product.updatedAt,
    name: aggregate.product.name,
    productType: aggregate.product.productType,
    status: aggregate.product.status,
    shortDescription: aggregate.product.shortDescription ?? '',
    description: aggregate.product.description ?? '',
    ingredientsInfo: aggregate.product.ingredientsInfo ?? '',
    storageInstructions: aggregate.product.storageInstructions ?? '',
    sortOrder: String(aggregate.product.sortOrder),
    needsOwnerReview: aggregate.product.needsOwnerReview,
    isFeatured: aggregate.product.isFeatured,
    isBestSeller: aggregate.product.isBestSeller,
    isNew: aggregate.product.isNew,
    categories: aggregate.categories,
    variants: aggregate.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      sizeLabel: v.sizeLabel,
      basePriceIdr: v.basePriceIdr,
      status: v.status,
      sortOrder: v.sortOrder,
      maxQuantityPerOrder: v.maxQuantityPerOrder,
      isDefault: v.isDefault,
      bundleRecipe: v.bundleRecipe,
      bundleUnitsTotal: v.bundleUnitsTotal,
      bundleRulesVerified: v.bundleRulesVerified,
      fixedComponents: v.fixedComponents,
      optionGroups: v.optionGroups,
      dietaryTags: v.dietaryTags,
      allergens: v.allergens,
    })),
    images: aggregate.images.map((img) => ({
      id: img.id,
      variantId: img.variantId,
      storageBucket: img.storageBucket,
      storagePath: img.storagePath,
      altText: img.altText,
      isApproved: img.isApproved,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
  };
}

export function buildInitialProductPreviewUrls(
  aggregate: AdminProductEditorAggregate,
): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  for (const img of aggregate.images) {
    map[img.id] = img.previewUrl;
  }
  return map;
}
