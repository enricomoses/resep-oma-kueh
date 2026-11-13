import 'server-only';

import { readActiveBranches } from '@/features/branches/repository.server';
import {
  readPublicActivePromotions,
  readPublishedShippingBanner,
  resolvePublicBannerUrl,
} from '@/features/promotions/repository.server';
import type {
  PublicPromotionItem,
  PublicPromotionsQuery,
  PublicPromotionsResponse,
  PublicShippingBanner,
} from '@/types/promotion';
import {
  publicPromotionsResponseSchema,
  publicShippingBannerSchema,
} from '@/validations/promotion.schema';

function hasValidTargetPivots(row: {
  scope: string;
  promotion_categories?: { category_id: string }[] | null;
  promotion_products?: { product_id: string }[] | null;
  promotion_variants?: { variant_id: string }[] | null;
}): boolean {
  if (row.scope === 'all') return true;
  if (row.scope === 'category') {
    return Array.isArray(row.promotion_categories)
      ? row.promotion_categories.length > 0
      : true;
  }
  if (row.scope === 'product') {
    return Array.isArray(row.promotion_products)
      ? row.promotion_products.length > 0
      : true;
  }
  if (row.scope === 'variant') {
    return Array.isArray(row.promotion_variants)
      ? row.promotion_variants.length > 0
      : true;
  }
  return false;
}

export function mapPublishedShippingBannerRow(
  row:
    | {
        content_json: unknown;
        status: string;
        updated_at: string;
      }
    | null
    | undefined,
): PublicShippingBanner | null {
  if (!row || row.status !== 'published') {
    return null;
  }
  if (
    !row.content_json ||
    typeof row.content_json !== 'object' ||
    Array.isArray(row.content_json)
  ) {
    return null;
  }
  const obj = row.content_json as Record<string, unknown>;
  const parsed = publicShippingBannerSchema.safeParse({
    title: obj.title,
    body: obj.body,
    updatedAt: row.updated_at,
  });
  return parsed.success ? parsed.data : null;
}

export async function getPublicPromotions(
  query: PublicPromotionsQuery = {},
  now: Date = new Date(),
  signal?: AbortSignal,
): Promise<PublicPromotionsResponse> {
  const [branches, rows, bannerRow] = await Promise.all([
    readActiveBranches(signal),
    readPublicActivePromotions(signal),
    readPublishedShippingBanner(signal),
  ]);

  const resolvedBranch = query.branch
    ? (branches.find((b) => b.code === query.branch) ?? null)
    : null;
  const resolvedBranchId = resolvedBranch?.id ?? null;
  const activeBranchIdSet = new Set(branches.map((b) => b.id));
  const nowMs = now.getTime();

  const promotions: PublicPromotionItem[] = rows
    .filter((row) => {
      if (row.status !== 'published' || !row.is_enabled || row.is_stackable) {
        return false;
      }
      const startsMs = Date.parse(row.starts_at);
      const endsMs = Date.parse(row.ends_at);
      if (Number.isNaN(startsMs) || Number.isNaN(endsMs)) return false;
      if (!(startsMs <= nowMs && nowMs < endsMs)) return false;
      if (!hasValidTargetPivots(row)) return false;

      const branchIds = Array.isArray(row.promotion_branches)
        ? row.promotion_branches.map((b) => b.branch_id)
        : [];
      if (
        branchIds.length > 0 &&
        !branchIds.some((id) => activeBranchIdSet.has(id))
      ) {
        return false;
      }
      if (query.branch) {
        if (!resolvedBranchId) return false;
        if (branchIds.length > 0 && !branchIds.includes(resolvedBranchId)) {
          return false;
        }
      }
      return true;
    })
    .map((row) => {
      const branchIds = Array.isArray(row.promotion_branches)
        ? row.promotion_branches.map((b) => b.branch_id)
        : [];
      const targetCategoryIds = Array.isArray(row.promotion_categories)
        ? row.promotion_categories.map((c) => c.category_id)
        : [];
      const targetProductIds = Array.isArray(row.promotion_products)
        ? row.promotion_products.map((p) => p.product_id)
        : [];
      const targetVariantIds = Array.isArray(row.promotion_variants)
        ? row.promotion_variants.map((v) => v.variant_id)
        : [];

      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        discountType: row.discount_type as 'percentage' | 'fixed',
        discountValue: Number(row.discount_value),
        minSpendIdr: row.min_spend_idr,
        maxDiscountIdr: row.max_discount_idr,
        scope: row.scope as 'all' | 'category' | 'product' | 'variant',
        priority: row.priority,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        bannerImagePath:
          row.banner_image_path && row.banner_image_path.startsWith('approved/')
            ? row.banner_image_path
            : null,
        bannerImageUrl: resolvePublicBannerUrl(row.banner_image_path),
        branchIds,
        targetCategoryIds,
        targetProductIds,
        targetVariantIds,
      };
    });

  return publicPromotionsResponseSchema.parse({
    resolvedBranchId,
    promotions,
    shippingBanner: mapPublishedShippingBannerRow(bannerRow),
  });
}
