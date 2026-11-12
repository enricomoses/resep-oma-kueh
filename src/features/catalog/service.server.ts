import 'server-only';
import { CATALOG_LIMITS } from '@/constants/catalog.constant';
import { FOUNDATION_COPY } from '@/constants/ui.constant';
import { readActiveBranches } from '@/features/branches/repository.server';
import {
  catalogDirectorySchema,
  catalogQuerySchema,
  productDetailQuerySchema,
  productDetailSchema,
  publicCategoryDirectorySchema,
  publicCategorySchema,
} from '@/validations/catalog.schema';
import type {
  CatalogDietaryTag,
  CatalogDirectory,
  CatalogProductItem,
  ProductDetail,
  ProductDetailAllergen,
  ProductDetailImage,
  ProductDetailVariant,
  PublicCategory,
  PublicCategoryDirectory,
} from '@/types/catalog';
import { computeVariantEffectivePrice } from './pricing';
import type {
  PricingPromotionInput,
  VariantEffectivePriceResult,
} from './pricing';
import {
  readActiveCatalogPromotions,
  readComponentVariantsByIds,
  readPublishedCatalogProducts,
  readPublishedCategories,
  readPublishedProductBySlug,
  resolvePublicProductImageUrl,
} from './repository.server';

export interface GetCatalogOptions {
  now?: Date;
}

type AvailabilityStatus = 'available' | 'sold_out' | 'unconfirmed';

function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function normalizeOfferAvailability(
  availabilityStatus: string,
  stockQuantity: number | null,
): AvailabilityStatus {
  if (stockQuantity !== null && stockQuantity <= 0) {
    return 'sold_out';
  }
  if (availabilityStatus === 'sold_out') {
    return 'sold_out';
  }
  if (availabilityStatus === 'unconfirmed') {
    return 'unconfirmed';
  }
  return 'available';
}

export async function getCategories(
  signal?: AbortSignal,
): Promise<PublicCategoryDirectory> {
  const rows = await readPublishedCategories(signal);
  const items: PublicCategory[] = rows
    .filter((row) => row.status === 'published')
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      return a.id.localeCompare(b.id);
    })
    .map((row) =>
      publicCategorySchema.parse({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        sortOrder: row.sort_order,
      }),
    );

  return publicCategoryDirectorySchema.parse({ items });
}

export async function getCatalog(
  input: unknown = {},
  options: GetCatalogOptions = {},
  signal?: AbortSignal,
): Promise<CatalogDirectory> {
  const query = catalogQuerySchema.parse(input);
  const now = options.now ?? new Date();

  const [branches, categories, productRows, promotionRows] = await Promise.all([
    readActiveBranches(signal),
    readPublishedCategories(signal),
    readPublishedCatalogProducts(signal),
    readActiveCatalogPromotions(signal),
  ]);

  const resolvedBranch = query.branch
    ? (branches.find((b) => b.code === query.branch) ?? null)
    : null;
  const resolvedBranchId = resolvedBranch?.id ?? null;

  const publishedCategoryMap = new Map(
    categories
      .filter((c) => c.status === 'published')
      .map((c) => [c.slug, c] as const),
  );

  // If branch code was provided in query but does not resolve to an active branch,
  // or if category slug was provided but is not a published category in DB,
  // or if branch-dependent filters (availability / price range) are requested without a valid branch,
  // return empty HTTP 200 catalog result.
  const hasInvalidBranchQuery =
    query.branch !== undefined && resolvedBranchId === null;
  const matchedCategory = query.category
    ? (publishedCategoryMap.get(query.category) ?? null)
    : null;
  const hasUnknownCategoryQuery =
    query.category !== undefined && matchedCategory === null;
  const hasBranchFilterWithoutBranch =
    resolvedBranchId === null &&
    (query.availability !== undefined ||
      query.minPriceIdr !== undefined ||
      query.maxPriceIdr !== undefined);

  const appliedFilters = {
    branch: resolvedBranch?.code ?? null,
    category: query.category ?? null,
    q: query.q ?? null,
    tag: query.tag ?? null,
    availability: query.availability ?? null,
    minPriceIdr: query.minPriceIdr ?? null,
    maxPriceIdr: query.maxPriceIdr ?? null,
    sort: query.sort,
  };

  if (
    hasInvalidBranchQuery ||
    hasUnknownCategoryQuery ||
    hasBranchFilterWithoutBranch
  ) {
    return catalogDirectorySchema.parse({
      items: [],
      total: 0,
      page: query.page,
      limit: query.limit,
      totalPages: 0,
      resolvedBranchId,
      appliedFilters,
    });
  }

  const normalizedQueryTokens = query.q
    ? normalizeSearchText(query.q).split(/\s+/).filter(Boolean)
    : [];

  const promotions: PricingPromotionInput[] = promotionRows
    .filter(
      (row) =>
        (row.discount_type === 'percentage' || row.discount_type === 'fixed') &&
        (row.scope === 'all' ||
          row.scope === 'category' ||
          row.scope === 'product' ||
          row.scope === 'variant') &&
        (row.status === 'draft' ||
          row.status === 'published' ||
          row.status === 'archived'),
    )
    .map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      discountType: row.discount_type as 'percentage' | 'fixed',
      discountValue: Number(row.discount_value),
      minSpendIdr: row.min_spend_idr,
      maxDiscountIdr: row.max_discount_idr,
      scope: row.scope as 'all' | 'category' | 'product' | 'variant',
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status as 'draft' | 'published' | 'archived',
      isEnabled: row.is_enabled,
      isStackable: row.is_stackable,
      priority: row.priority,
      branchIds: Array.isArray(row.promotion_branches)
        ? row.promotion_branches.map((item) => item.branch_id)
        : [],
      categoryIds: Array.isArray(row.promotion_categories)
        ? row.promotion_categories.map((item) => item.category_id)
        : [],
      productIds: Array.isArray(row.promotion_products)
        ? row.promotion_products.map((item) => item.product_id)
        : [],
      variantIds: Array.isArray(row.promotion_variants)
        ? row.promotion_variants.map((item) => item.variant_id)
        : [],
    }));

  const matchedProducts: CatalogProductItem[] = [];

  for (const row of productRows) {
    if (row.status !== 'published') continue;
    if (
      row.product_type !== 'simple' &&
      row.product_type !== 'variants' &&
      row.product_type !== 'bundle'
    ) {
      continue;
    }

    const categoryLinks = Array.isArray(row.product_categories)
      ? row.product_categories
      : [];
    const publishedProductCategories = categoryLinks
      .filter((link) => link.categories?.status === 'published')
      .map((link) => ({
        isPrimary: link.is_primary,
        id: link.categories!.id,
        name: link.categories!.name,
        slug: link.categories!.slug,
      }));

    if (publishedProductCategories.length === 0) continue;

    if (
      matchedCategory &&
      !publishedProductCategories.some((cat) => cat.id === matchedCategory.id)
    ) {
      continue;
    }

    const primaryCat =
      publishedProductCategories.find((cat) => cat.isPrimary) ??
      publishedProductCategories[0];

    const categoryIds = publishedProductCategories.map((cat) => cat.id);

    const variantRows = Array.isArray(row.product_variants)
      ? row.product_variants.filter((v) => v.status === 'active')
      : [];
    if (variantRows.length === 0) continue;

    if (normalizedQueryTokens.length > 0) {
      const searchableParts = [
        row.name,
        row.slug,
        row.short_description ?? '',
        row.description ?? '',
        ...publishedProductCategories.map((cat) => cat.name),
        ...variantRows.flatMap((v) => [v.name, v.sku, v.size_label ?? '']),
      ];
      const normalizedCorpus = normalizeSearchText(searchableParts.join(' '));
      const matchesAllTokens = normalizedQueryTokens.every((token) =>
        normalizedCorpus.includes(token),
      );
      if (!matchesAllTokens) continue;
    }

    // Collect verified dietary tags per variant
    const variantVerifiedTags = new Map<string, CatalogDietaryTag[]>();
    for (const variant of variantRows) {
      const tagRows = Array.isArray(variant.variant_dietary_tags)
        ? variant.variant_dietary_tags
        : [];
      const verified: CatalogDietaryTag[] = [];
      for (const tagRow of tagRows) {
        if (
          tagRow.verification_status === 'verified' &&
          Boolean(tagRow.verified_at) &&
          tagRow.dietary_tags
        ) {
          verified.push({
            slug: tagRow.dietary_tags.slug,
            name: tagRow.dietary_tags.name,
          });
        }
      }
      variantVerifiedTags.set(variant.id, verified);
    }

    const images = Array.isArray(row.product_images) ? row.product_images : [];
    const primaryImage =
      images.find((img) => img.is_primary && img.alt_text) ??
      images.find((img) => Boolean(img.alt_text));
    const imageAlt = primaryImage?.alt_text ?? FOUNDATION_COPY.MEDIA_CAPTION;

    if (resolvedBranchId === null) {
      // No branch selected: filter variants by verified tag if requested, no branch price or offer status.
      const eligibleVariantsNoBranch = variantRows.filter((variant) => {
        if (!query.tag) return true;
        const tags = variantVerifiedTags.get(variant.id) ?? [];
        return tags.some((t) => t.slug === query.tag);
      });

      if (eligibleVariantsNoBranch.length === 0) continue;

      const dedupedTags = new Map<string, CatalogDietaryTag>();
      for (const variant of variantRows) {
        for (const tag of variantVerifiedTags.get(variant.id) ?? []) {
          dedupedTags.set(tag.slug, tag);
        }
      }

      matchedProducts.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        shortDescription: row.short_description,
        description: row.description,
        productType: row.product_type,
        isFeatured: row.is_featured,
        isBestSeller: row.is_best_seller,
        isNew: row.is_new,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        primaryCategory: {
          id: primaryCat.id,
          name: primaryCat.name,
          slug: primaryCat.slug,
        },
        imageAlt,
        verifiedDietaryTags: [...dedupedTags.values()].sort((a, b) =>
          a.slug.localeCompare(b.slug),
        ),
        activeVariantCount: variantRows.length,
        offeredVariantCount: 0,
        availabilityStatus: null,
        baseFromPriceIdr: null,
        fromPriceIdr: null,
        appliedPromotion: null,
        conditionalPromotion: null,
      });
      continue;
    }

    // Branch is selected: evaluate offered variants in resolvedBranchId
    interface EvaluatedBranchVariant {
      variantId: string;
      sortOrder: number;
      availability: AvailabilityStatus;
      pricing: VariantEffectivePriceResult;
      verifiedTags: CatalogDietaryTag[];
    }

    const offeredVariants: EvaluatedBranchVariant[] = [];

    for (const variant of variantRows) {
      const offerRows = Array.isArray(variant.branch_variant_offers)
        ? variant.branch_variant_offers
        : [];
      const branchOffer = offerRows.find(
        (o) => o.branch_id === resolvedBranchId && o.is_listed,
      );
      if (!branchOffer) continue;

      const optionGroupRows = Array.isArray(variant.option_groups)
        ? variant.option_groups
        : [];
      const optionGroups = optionGroupRows.map((group) => ({
        id: group.id,
        minSelect: group.min_select,
        maxSelect: group.max_select,
        isRequired: group.is_required,
        choices: Array.isArray(group.option_choices)
          ? group.option_choices.map((choice) => ({
              id: choice.id,
              priceDeltaIdr: choice.price_delta_idr,
              isActive: choice.is_active,
            }))
          : [],
      }));

      const pricing = computeVariantEffectivePrice(
        {
          basePriceIdr: variant.base_price_idr,
          priceOverrideIdr: branchOffer.price_override_idr,
          optionGroups,
        },
        {
          branchId: resolvedBranchId,
          productId: row.id,
          variantId: variant.id,
          categoryIds,
        },
        promotions,
        now,
      );

      if (!pricing) continue;

      const availability = normalizeOfferAvailability(
        branchOffer.availability_status,
        branchOffer.stock_quantity,
      );

      offeredVariants.push({
        variantId: variant.id,
        sortOrder: variant.sort_order,
        availability,
        pricing,
        verifiedTags: variantVerifiedTags.get(variant.id) ?? [],
      });
    }

    if (offeredVariants.length === 0) continue;

    // Filter offered variants by SKU-level filters: tag, availability, minPriceIdr, maxPriceIdr
    const eligibleSkus = offeredVariants.filter((sku) => {
      if (
        query.tag &&
        !sku.verifiedTags.some((tag) => tag.slug === query.tag)
      ) {
        return false;
      }
      if (query.availability && sku.availability !== query.availability) {
        return false;
      }
      if (
        query.minPriceIdr !== undefined &&
        sku.pricing.effectivePriceIdr < query.minPriceIdr
      ) {
        return false;
      }
      if (
        query.maxPriceIdr !== undefined &&
        sku.pricing.effectivePriceIdr > query.maxPriceIdr
      ) {
        return false;
      }
      return true;
    });

    if (eligibleSkus.length === 0) continue;

    // Minimum eligible SKU for this filter set (§27.5):
    const sortedEligibleSkus = [...eligibleSkus].sort((a, b) => {
      if (a.pricing.effectivePriceIdr !== b.pricing.effectivePriceIdr) {
        return a.pricing.effectivePriceIdr - b.pricing.effectivePriceIdr;
      }
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.variantId.localeCompare(b.variantId);
    });

    const representativeSku = sortedEligibleSkus[0];

    const overallAvailability: AvailabilityStatus = eligibleSkus.some(
      (sku) => sku.availability === 'available',
    )
      ? 'available'
      : eligibleSkus.some((sku) => sku.availability === 'unconfirmed')
        ? 'unconfirmed'
        : 'sold_out';

    const dedupedTags = new Map<string, CatalogDietaryTag>();
    for (const sku of offeredVariants) {
      for (const tag of sku.verifiedTags) {
        dedupedTags.set(tag.slug, tag);
      }
    }

    matchedProducts.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortDescription: row.short_description,
      description: row.description,
      productType: row.product_type,
      isFeatured: row.is_featured,
      isBestSeller: row.is_best_seller,
      isNew: row.is_new,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      primaryCategory: {
        id: primaryCat.id,
        name: primaryCat.name,
        slug: primaryCat.slug,
      },
      imageAlt,
      verifiedDietaryTags: [...dedupedTags.values()].sort((a, b) =>
        a.slug.localeCompare(b.slug),
      ),
      activeVariantCount: variantRows.length,
      offeredVariantCount: offeredVariants.length,
      availabilityStatus: overallAvailability,
      baseFromPriceIdr: representativeSku.pricing.unitGrossIdr,
      fromPriceIdr: representativeSku.pricing.effectivePriceIdr,
      appliedPromotion: representativeSku.pricing.appliedPromotion,
      conditionalPromotion: representativeSku.pricing.conditionalPromotion,
    });
  }

  // Sort before pagination with deterministic tie-breakers (§27.5):
  matchedProducts.sort((a, b) => {
    switch (query.sort) {
      case 'featured': {
        if (a.isFeatured !== b.isFeatured) {
          return a.isFeatured ? -1 : 1;
        }
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.id.localeCompare(b.id);
      }
      case 'newest': {
        const aTime = Date.parse(a.createdAt);
        const bTime = Date.parse(b.createdAt);
        if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && bTime !== aTime) {
          return bTime - aTime;
        }
        if (b.createdAt !== a.createdAt) {
          return b.createdAt.localeCompare(a.createdAt);
        }
        return a.id.localeCompare(b.id);
      }
      case 'price_asc': {
        if (a.fromPriceIdr === null && b.fromPriceIdr !== null) return 1;
        if (a.fromPriceIdr !== null && b.fromPriceIdr === null) return -1;
        if (
          a.fromPriceIdr !== null &&
          b.fromPriceIdr !== null &&
          a.fromPriceIdr !== b.fromPriceIdr
        ) {
          return a.fromPriceIdr - b.fromPriceIdr;
        }
        const nameCmp = a.name.localeCompare(b.name);
        if (nameCmp !== 0) return nameCmp;
        return a.id.localeCompare(b.id);
      }
      case 'price_desc': {
        if (a.fromPriceIdr === null && b.fromPriceIdr !== null) return 1;
        if (a.fromPriceIdr !== null && b.fromPriceIdr === null) return -1;
        if (
          a.fromPriceIdr !== null &&
          b.fromPriceIdr !== null &&
          b.fromPriceIdr !== a.fromPriceIdr
        ) {
          return b.fromPriceIdr - a.fromPriceIdr;
        }
        const nameCmp = a.name.localeCompare(b.name);
        if (nameCmp !== 0) return nameCmp;
        return a.id.localeCompare(b.id);
      }
      case 'name_asc': {
        const nameCmp = a.name.localeCompare(b.name);
        if (nameCmp !== 0) return nameCmp;
        return a.id.localeCompare(b.id);
      }
    }
  });

  const total = matchedProducts.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);
  const offset = (query.page - 1) * query.limit;
  const items =
    offset >= total ? [] : matchedProducts.slice(offset, offset + query.limit);

  return catalogDirectorySchema.parse({
    items,
    total,
    page: query.page,
    limit: query.limit,
    totalPages,
    resolvedBranchId,
    appliedFilters,
  });
}

export async function getProductDetail(
  input: unknown,
  options: GetCatalogOptions = {},
  signal?: AbortSignal,
): Promise<ProductDetail | null> {
  const query = productDetailQuerySchema.parse(input);
  const now = options.now ?? new Date();

  const [branches, productRow, promotionRows] = await Promise.all([
    readActiveBranches(signal),
    readPublishedProductBySlug(query.slug, signal),
    readActiveCatalogPromotions(signal),
  ]);

  if (!productRow) return null;
  if (productRow.status !== 'published' || productRow.needs_owner_review) {
    return null;
  }
  if (
    productRow.product_type !== 'simple' &&
    productRow.product_type !== 'variants' &&
    productRow.product_type !== 'bundle'
  ) {
    return null;
  }

  const categoryLinks = Array.isArray(productRow.product_categories)
    ? productRow.product_categories
    : [];
  const publishedCategories = categoryLinks
    .filter((link) => link.categories?.status === 'published')
    .map((link) => ({
      id: link.categories!.id,
      name: link.categories!.name,
      slug: link.categories!.slug,
      isPrimary: link.is_primary,
    }))
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      return a.id.localeCompare(b.id);
    });

  if (publishedCategories.length === 0) return null;

  const primaryCategory = publishedCategories[0];
  const categoryIds = publishedCategories.map((c) => c.id);

  const activeVariants = Array.isArray(productRow.product_variants)
    ? productRow.product_variants
        .filter((v) => v.status === 'active')
        .sort((a, b) => {
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
          if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
          return a.id.localeCompare(b.id);
        })
    : [];

  if (activeVariants.length === 0) return null;

  // For bundle products, collect all referenced component variant IDs to resolve their branch availability & dietary claims
  const referencedComponentIds: string[] = [];
  if (productRow.product_type === 'bundle') {
    for (const v of activeVariants) {
      if (Array.isArray(v.bundle_fixed_components)) {
        for (const fc of v.bundle_fixed_components) {
          if (fc.component_variant_id) {
            referencedComponentIds.push(fc.component_variant_id);
          }
        }
      }
      if (Array.isArray(v.option_groups)) {
        for (const g of v.option_groups) {
          if (Array.isArray(g.option_choices)) {
            for (const c of g.option_choices) {
              if (c.component_variant_id) {
                referencedComponentIds.push(c.component_variant_id);
              }
            }
          }
        }
      }
    }
  }

  const uniqueComponentIds = Array.from(new Set(referencedComponentIds));
  const componentVariantRows =
    uniqueComponentIds.length > 0
      ? await readComponentVariantsByIds(uniqueComponentIds, signal)
      : [];
  const componentVariantMap = new Map(
    componentVariantRows.map((row) => [row.id, row]),
  );

  const activeVariantIdSet = new Set(activeVariants.map((v) => v.id));

  const resolvedBranch = query.branch
    ? (branches.find((b) => b.code === query.branch) ?? null)
    : null;
  const resolvedBranchId = resolvedBranch?.id ?? null;
  const resolvedBranchCode = resolvedBranch?.code ?? null;

  const promotions: PricingPromotionInput[] = promotionRows
    .filter(
      (row) =>
        (row.discount_type === 'percentage' || row.discount_type === 'fixed') &&
        (row.scope === 'all' ||
          row.scope === 'category' ||
          row.scope === 'product' ||
          row.scope === 'variant') &&
        (row.status === 'draft' ||
          row.status === 'published' ||
          row.status === 'archived'),
    )
    .map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      discountType: row.discount_type as 'percentage' | 'fixed',
      discountValue: Number(row.discount_value),
      minSpendIdr: row.min_spend_idr,
      maxDiscountIdr: row.max_discount_idr,
      scope: row.scope as 'all' | 'category' | 'product' | 'variant',
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status as 'draft' | 'published' | 'archived',
      isEnabled: row.is_enabled,
      isStackable: row.is_stackable,
      priority: row.priority,
      branchIds: Array.isArray(row.promotion_branches)
        ? row.promotion_branches.map((item) => item.branch_id)
        : [],
      categoryIds: Array.isArray(row.promotion_categories)
        ? row.promotion_categories.map((item) => item.category_id)
        : [],
      productIds: Array.isArray(row.promotion_products)
        ? row.promotion_products.map((item) => item.product_id)
        : [],
      variantIds: Array.isArray(row.promotion_variants)
        ? row.promotion_variants.map((item) => item.variant_id)
        : [],
    }));

  const rawImages = Array.isArray(productRow.product_images)
    ? productRow.product_images
    : [];
  const images: ProductDetailImage[] = rawImages
    .filter(
      (img) =>
        img.is_approved &&
        img.storage_bucket === 'product-images' &&
        Boolean(img.alt_text?.trim()) &&
        (img.variant_id === null || activeVariantIdSet.has(img.variant_id)),
    )
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id.localeCompare(b.id);
    })
    .map((img) => ({
      id: img.id,
      variantId: img.variant_id,
      altText: img.alt_text!.trim(),
      isPrimary: img.is_primary,
      sortOrder: img.sort_order,
      publicUrl: resolvePublicProductImageUrl(
        img.storage_bucket,
        img.storage_path,
      ),
    }));

  const offeredVariants: ProductDetailVariant[] = [];

  if (resolvedBranchId !== null) {
    for (const variant of activeVariants) {
      const offerRows = Array.isArray(variant.branch_variant_offers)
        ? variant.branch_variant_offers
        : [];
      const branchOffer = offerRows.find(
        (o) => o.branch_id === resolvedBranchId && o.is_listed,
      );
      if (!branchOffer) continue;

      const rawGroups = Array.isArray(variant.option_groups)
        ? variant.option_groups
        : [];
      const optionGroupsForPricing = rawGroups.map((group) => ({
        id: group.id,
        minSelect: group.min_select,
        maxSelect: group.max_select,
        isRequired: group.is_required,
        choices: Array.isArray(group.option_choices)
          ? group.option_choices.map((choice) => ({
              id: choice.id,
              priceDeltaIdr: choice.price_delta_idr,
              isActive: choice.is_active,
            }))
          : [],
      }));

      const pricing = computeVariantEffectivePrice(
        {
          basePriceIdr: variant.base_price_idr,
          priceOverrideIdr: branchOffer.price_override_idr,
          optionGroups: optionGroupsForPricing,
        },
        {
          branchId: resolvedBranchId,
          productId: productRow.id,
          variantId: variant.id,
          categoryIds,
        },
        promotions,
        now,
      );

      if (!pricing) continue;

      const availabilityStatus = normalizeOfferAvailability(
        branchOffer.availability_status,
        branchOffer.stock_quantity,
      );

      const tagRows = Array.isArray(variant.variant_dietary_tags)
        ? variant.variant_dietary_tags
        : [];
      const verifiedDietaryTags: CatalogDietaryTag[] = tagRows
        .filter(
          (t) =>
            t.verification_status === 'verified' &&
            Boolean(t.verified_at) &&
            Boolean(t.dietary_tags),
        )
        .map((t) => ({
          slug: t.dietary_tags!.slug,
          name: t.dietary_tags!.name,
        }))
        .sort((a, b) => a.slug.localeCompare(b.slug));

      const allergenRows = Array.isArray(variant.variant_allergens)
        ? variant.variant_allergens
        : [];
      const verifiedAllergens: ProductDetailAllergen[] = allergenRows
        .filter(
          (a) =>
            Boolean(a.verified_at) &&
            Boolean(a.allergens) &&
            (a.presence === 'contains' ||
              a.presence === 'may_contain' ||
              a.presence === 'not_declared'),
        )
        .map((a) => ({
          slug: a.allergens!.slug,
          name: a.allergens!.name,
          presence: a.presence as 'contains' | 'may_contain' | 'not_declared',
        }))
        .sort((a, b) => a.slug.localeCompare(b.slug));

      const resolveComponentSummary = (compVariantId: string | null) => {
        if (!compVariantId) return null;
        const comp = componentVariantMap.get(compVariantId);
        if (!comp) return null;
        const offers = Array.isArray(comp.branch_variant_offers)
          ? comp.branch_variant_offers
          : [];
        const compOffer = offers.find((o) => o.branch_id === resolvedBranchId);
        const isOfferedInBranch = Boolean(compOffer?.is_listed);
        const availabilityStatus = normalizeOfferAvailability(
          compOffer?.availability_status ?? 'available',
          compOffer?.stock_quantity ?? null,
        );
        const compTagRows = Array.isArray(comp.variant_dietary_tags)
          ? comp.variant_dietary_tags
          : [];
        const compDietaryTags: CatalogDietaryTag[] = compTagRows
          .filter(
            (t) =>
              t.verification_status === 'verified' &&
              Boolean(t.verified_at) &&
              Boolean(t.dietary_tags),
          )
          .map((t) => ({
            slug: t.dietary_tags!.slug,
            name: t.dietary_tags!.name,
          }))
          .sort((a, b) => a.slug.localeCompare(b.slug));

        return {
          id: comp.id,
          sku: comp.sku,
          name: comp.name,
          productId: comp.product_id ?? null,
          availabilityStatus,
          stockQuantity: compOffer?.stock_quantity ?? null,
          isOfferedInBranch,
          verifiedDietaryTags: compDietaryTags,
        };
      };

      const optionGroups = rawGroups
        .slice()
        .sort((a, b) => {
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
          return a.id.localeCompare(b.id);
        })
        .map((group) => ({
          id: group.id,
          name: group.name,
          minSelect: group.min_select,
          maxSelect: group.max_select,
          quantityPerSelection: group.quantity_per_selection,
          isRequired: group.is_required,
          sortOrder: group.sort_order,
          choices: (Array.isArray(group.option_choices)
            ? group.option_choices
            : []
          )
            .filter((choice) => choice.is_active)
            .sort((a, b) => {
              if (a.sort_order !== b.sort_order) {
                return a.sort_order - b.sort_order;
              }
              return a.id.localeCompare(b.id);
            })
            .map((choice) => ({
              id: choice.id,
              groupId: group.id,
              label: choice.label,
              priceDeltaIdr: choice.price_delta_idr,
              componentVariantId: choice.component_variant_id,
              isActive: choice.is_active,
              sortOrder: choice.sort_order,
              componentVariant: resolveComponentSummary(
                choice.component_variant_id,
              ),
            })),
        }));

      const rawFixed = Array.isArray(variant.bundle_fixed_components)
        ? variant.bundle_fixed_components
        : [];
      const fixedComponents = rawFixed
        .slice()
        .sort((a, b) => {
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
          return a.id.localeCompare(b.id);
        })
        .map((fixed) => ({
          id: fixed.id,
          componentSlot: fixed.component_slot,
          componentVariantId: fixed.component_variant_id,
          quantity: fixed.quantity,
          sortOrder: fixed.sort_order,
          componentVariant: resolveComponentSummary(fixed.component_variant_id),
        }));

      const clampedMaxQty = Math.max(
        1,
        Math.min(
          variant.max_quantity_per_order,
          CATALOG_LIMITS.MAX_QUANTITY_PER_LINE,
        ),
      );

      offeredVariants.push({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        sizeLabel: variant.size_label,
        isDefault: variant.is_default,
        sortOrder: variant.sort_order,
        maxQuantityPerOrder: clampedMaxQty,
        bundleRecipe: variant.bundle_recipe,
        bundleUnitsTotal: variant.bundle_units_total,
        bundleRulesVerified: variant.bundle_rules_verified,
        availabilityStatus,
        stockQuantity: branchOffer.stock_quantity,
        baseOrOverrideIdr: pricing.baseOrOverrideIdr,
        minOptionDeltaIdr: pricing.minOptionDeltaIdr,
        unitGrossIdr: pricing.unitGrossIdr,
        unconditionalDiscountIdr: pricing.unconditionalDiscountIdr,
        effectivePriceIdr: pricing.effectivePriceIdr,
        appliedPromotion: pricing.appliedPromotion,
        conditionalPromotion: pricing.conditionalPromotion,
        verifiedDietaryTags,
        verifiedAllergens,
        optionGroups,
        fixedComponents,
      });
    }
  }

  // Fetch related products from the same primary category (excluding current product)
  const relatedCatalog = await getCatalog(
    {
      branch: resolvedBranchCode ?? undefined,
      category: primaryCategory.slug,
      sort: 'featured',
      page: 1,
      limit: CATALOG_LIMITS.MAX_RELATED_PRODUCTS + 2,
    },
    options,
    signal,
  );

  const relatedProducts = relatedCatalog.items
    .filter((item) => item.id !== productRow.id)
    .slice(0, CATALOG_LIMITS.MAX_RELATED_PRODUCTS);

  return productDetailSchema.parse({
    id: productRow.id,
    name: productRow.name,
    slug: productRow.slug,
    shortDescription: productRow.short_description,
    description: productRow.description,
    ingredientsInfo: productRow.ingredients_info,
    storageInstructions: productRow.storage_instructions,
    productType: productRow.product_type,
    isFeatured: productRow.is_featured,
    isBestSeller: productRow.is_best_seller,
    isNew: productRow.is_new,
    primaryCategory: {
      id: primaryCategory.id,
      name: primaryCategory.name,
      slug: primaryCategory.slug,
    },
    categories: publishedCategories,
    images,
    resolvedBranchId,
    resolvedBranchCode,
    activeVariantCount: activeVariants.length,
    offeredVariants,
    relatedProducts,
  });
}
