import 'server-only';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { PROMOTION_LIMITS } from '@/constants/promotion.constant';
import {
  AdminCatalogConflictError,
  AdminCatalogNotFoundError,
  AdminCatalogUpstreamError,
  AdminCatalogValidationError,
  mapPostgresPromotionError,
} from '@/features/admin-catalog/errors.server';
import {
  cleanupOrphanStorageObjects,
  promoteDraftMediaToPublicBucket,
  resolveAdminMediaPreviewUrl,
} from '@/features/admin-catalog/media.server';
import type { AdminRepoContext } from '@/features/admin-catalog/repository.server';
import { AuthForbiddenError } from '@/features/auth/errors.server';
import { createServerAuthClient } from '@/lib/supabase/server';
import type { AdminSessionProfile } from '@/types/auth';
import type { Json } from '@/types/database';
import type {
  AdminPromotionItem,
  AdminPromotionReferenceOptions,
  AdminPromotionsListResponse,
  AdminShippingBannerItem,
} from '@/types/promotion';
import { ADMIN_MEDIA_BUCKETS } from '@/utils/admin-media';
import { derivePromotionClockState } from '@/utils/admin-promotions';
import { archiveAdminEntitySchema } from '@/validations/admin-catalog.schema';
import {
  adminPromotionItemSchema,
  adminPromotionsListResponseSchema,
  adminShippingBannerItemSchema,
  saveAdminPromotionSchema,
  saveAdminShippingBannerSchema,
} from '@/validations/promotion.schema';

function assertOwnerRole(profile: AdminSessionProfile): void {
  if (profile.role !== 'owner') {
    throw new AuthForbiddenError(
      ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.OWNER_ONLY,
    );
  }
}

interface RawAdminPromotionRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_discount_idr: number | null;
  min_spend_idr: number;
  scope: string;
  starts_at: string;
  ends_at: string;
  priority: number;
  status: string;
  is_enabled: boolean;
  is_stackable: boolean;
  banner_image_path: string | null;
  created_at: string;
  updated_at: string;
  promotion_branches: { branch_id: string }[] | null;
  promotion_categories: { category_id: string }[] | null;
  promotion_products: { product_id: string }[] | null;
  promotion_variants: { variant_id: string }[] | null;
}

const PROMOTION_SELECT =
  'id,title,slug,description,discount_type,discount_value,max_discount_idr,min_spend_idr,scope,starts_at,ends_at,priority,status,is_enabled,is_stackable,banner_image_path,created_at,updated_at,promotion_branches(branch_id),promotion_categories(category_id),promotion_products(product_id),promotion_variants(variant_id)';

async function mapAdminPromotionRow(
  row: RawAdminPromotionRow,
  ctx: AdminRepoContext,
  now: Date = new Date(),
): Promise<AdminPromotionItem> {
  const bannerImageUrl = row.banner_image_path
    ? await resolveAdminMediaPreviewUrl(
        ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES,
        row.banner_image_path,
        ctx,
      )
    : null;

  return adminPromotionItemSchema.parse({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minSpendIdr: row.min_spend_idr,
    maxDiscountIdr: row.max_discount_idr,
    scope: row.scope,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    priority: row.priority,
    status: row.status,
    isEnabled: row.is_enabled,
    isStackable: Boolean(row.is_stackable),
    clockState: derivePromotionClockState(row.starts_at, row.ends_at, now),
    bannerImagePath: row.banner_image_path,
    bannerImageUrl,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function mapAdminShippingBannerRow(
  row: { content_json: unknown; status: string; updated_at: string } | null,
): AdminShippingBannerItem {
  if (!row) {
    return adminShippingBannerItemSchema.parse({
      title: '',
      body: '',
      status: 'draft',
      updatedAt: null,
    });
  }
  const obj =
    row.content_json &&
    typeof row.content_json === 'object' &&
    !Array.isArray(row.content_json)
      ? (row.content_json as Record<string, unknown>)
      : {};
  return adminShippingBannerItemSchema.parse({
    title: typeof obj.title === 'string' ? obj.title : '',
    body: typeof obj.body === 'string' ? obj.body : '',
    status: row.status === 'published' ? 'published' : 'draft',
    updatedAt: row.updated_at,
  });
}

async function fetchReferenceOptions(
  ctx: AdminRepoContext,
): Promise<AdminPromotionReferenceOptions> {
  const client = await createServerAuthClient(ctx.response);
  const [branchesRes, categoriesRes, productsRes, variantsRes] =
    await Promise.all([
      client
        .from('branches')
        .select('id,code,name,is_active')
        .order('code')
        .limit(PROMOTION_LIMITS.MAX_BRANCH_IDS),
      client
        .from('categories')
        .select('id,name,slug,status')
        .order('sort_order')
        .order('name')
        .limit(PROMOTION_LIMITS.MAX_TARGETS),
      client
        .from('products')
        .select('id,name,slug,status')
        .order('sort_order')
        .order('name')
        .limit(PROMOTION_LIMITS.MAX_TARGETS),
      client
        .from('product_variants')
        .select('id,sku,name,status,products(name,status)')
        .order('sku')
        .limit(PROMOTION_LIMITS.MAX_TARGETS),
    ]);

  if (
    branchesRes.error ||
    categoriesRes.error ||
    productsRes.error ||
    variantsRes.error
  ) {
    throw new AdminCatalogUpstreamError();
  }

  return {
    branches: (branchesRes.data ?? []).map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      isActive: b.is_active,
    })),
    categories: (categoriesRes.data ?? []).map((c) => ({
      id: c.id,
      label: c.name,
      secondaryLabel: c.slug,
      isPublishEligible: c.status === 'published',
    })),
    products: (productsRes.data ?? []).map((p) => ({
      id: p.id,
      label: p.name,
      secondaryLabel: p.slug,
      isPublishEligible: p.status === 'published',
    })),
    variants: (variantsRes.data ?? []).map((v) => {
      const parentProduct = v.products as {
        name?: string;
        status?: string;
      } | null;
      return {
        id: v.id,
        label: parentProduct?.name
          ? `${parentProduct.name} — ${v.name}`
          : v.name,
        secondaryLabel: v.sku,
        isPublishEligible:
          v.status === 'active' && parentProduct?.status === 'published',
      };
    }),
  };
}

export async function listAdminPromotions(
  profile: AdminSessionProfile,
  ctx: AdminRepoContext = {},
): Promise<AdminPromotionsListResponse> {
  assertOwnerRole(profile);
  const client = await createServerAuthClient(ctx.response);

  const [promotionsRes, bannerRes, references] = await Promise.all([
    client
      .from('promotions')
      .select(PROMOTION_SELECT)
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false })
      .order('id')
      .limit(PROMOTION_LIMITS.MAX_LIST_LIMIT),
    client
      .from('site_content')
      .select('content_json,status,updated_at')
      .eq('key', 'promo.shipping_banner')
      .maybeSingle(),
    fetchReferenceOptions(ctx),
  ]);

  if (promotionsRes.error || bannerRes.error) {
    throw new AdminCatalogUpstreamError();
  }

  const promotions = await Promise.all(
    (promotionsRes.data ?? []).map((row) =>
      mapAdminPromotionRow(row as unknown as RawAdminPromotionRow, ctx),
    ),
  );

  return adminPromotionsListResponseSchema.parse({
    promotions,
    shippingBanner: mapAdminShippingBannerRow(bannerRes.data),
    references,
  });
}

async function fetchAdminPromotionById(
  promotionId: string,
  ctx: AdminRepoContext,
): Promise<AdminPromotionItem> {
  const client = await createServerAuthClient(ctx.response);
  const { data, error } = await client
    .from('promotions')
    .select(PROMOTION_SELECT)
    .eq('id', promotionId)
    .maybeSingle();

  if (error) {
    throw new AdminCatalogUpstreamError();
  }
  if (!data) {
    throw new AdminCatalogNotFoundError();
  }
  return mapAdminPromotionRow(data as unknown as RawAdminPromotionRow, ctx);
}

export async function saveAdminPromotion(
  profile: AdminSessionProfile,
  promotionId: string | null,
  rawInput: unknown,
  ctx: AdminRepoContext = {},
): Promise<AdminPromotionItem> {
  assertOwnerRole(profile);

  const parsed = saveAdminPromotionSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.map(String).join('.') || 'root';
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    throw new AdminCatalogValidationError(
      ERROR_COPY.VALIDATION_ERROR,
      fieldErrors,
    );
  }

  const input = parsed.data;
  if (promotionId === null && input.expectedUpdatedAt !== null) {
    throw new AdminCatalogValidationError(ERROR_COPY.VALIDATION_ERROR, {
      expectedUpdatedAt: [
        'expectedUpdatedAt harus null saat membuat promo baru.',
      ],
    });
  }
  if (promotionId !== null && input.expectedUpdatedAt === null) {
    throw new AdminCatalogValidationError(ERROR_COPY.VALIDATION_ERROR, {
      expectedUpdatedAt: [
        'expectedUpdatedAt wajib dikirim saat memperbarui promo.',
      ],
    });
  }

  const client = await createServerAuthClient(ctx.response);
  let previousBannerPath: string | null = null;

  if (promotionId !== null) {
    const { data: existing, error: fetchError } = await client
      .from('promotions')
      .select('id,slug,banner_image_path,updated_at')
      .eq('id', promotionId)
      .maybeSingle();

    if (fetchError) {
      throw new AdminCatalogUpstreamError();
    }
    if (!existing) {
      throw new AdminCatalogNotFoundError();
    }
    if (existing.slug !== input.slug) {
      const msg = ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.SLUG_IMMUTABLE;
      throw new AdminCatalogValidationError(msg, { slug: [msg] });
    }
    if (existing.updated_at !== input.expectedUpdatedAt) {
      throw new AdminCatalogConflictError(
        ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.STALE_CONFLICT,
      );
    }
    previousBannerPath = existing.banner_image_path;
  }

  let promotedBannerPath: string | null = null;
  let finalBannerPath: string | null = input.bannerImagePath;

  if (input.bannerDraftPath) {
    const promoted = await promoteDraftMediaToPublicBucket(
      profile,
      input.bannerDraftPath,
      ctx,
    );
    promotedBannerPath = promoted.storagePath;
    finalBannerPath = promoted.storagePath;
  }

  const rpcPayload: Json = {
    title: input.title,
    slug: input.slug,
    description: input.description,
    discountType: input.discountType,
    discountValue: input.discountValue,
    maxDiscountIdr: input.maxDiscountIdr,
    minSpendIdr: input.minSpendIdr,
    scope: input.scope,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    priority: input.priority,
    status: input.status,
    isEnabled: input.isEnabled,
    isStackable: false,
    bannerImagePath: finalBannerPath,
    branchIds: input.branchIds,
    categoryIds: input.categoryIds,
    productIds: input.productIds,
    variantIds: input.variantIds,
  };

  const { data: rpcData, error: rpcError } = await client.rpc(
    'save_admin_promotion',
    {
      p_promotion_id: promotionId,
      p_expected_updated_at: input.expectedUpdatedAt,
      p_payload: rpcPayload,
    },
  );

  if (rpcError || !rpcData) {
    if (promotedBannerPath) {
      await cleanupOrphanStorageObjects(
        profile,
        [
          {
            storageBucket: ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES,
            storagePath: promotedBannerPath,
          },
        ],
        'removed_from_promotion',
        ctx,
      );
    }
    if (rpcError) {
      mapPostgresPromotionError(rpcError);
    }
    throw new AdminCatalogUpstreamError();
  }

  const savedId =
    typeof rpcData === 'object' &&
    !Array.isArray(rpcData) &&
    typeof (rpcData as { id?: unknown }).id === 'string'
      ? (rpcData as { id: string }).id
      : promotionId;

  if (
    previousBannerPath &&
    previousBannerPath !== finalBannerPath &&
    previousBannerPath.startsWith('approved/')
  ) {
    await cleanupOrphanStorageObjects(
      profile,
      [
        {
          storageBucket: ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES,
          storagePath: previousBannerPath,
        },
      ],
      'removed_from_promotion',
      ctx,
    );
  }

  if (!savedId) {
    throw new AdminCatalogUpstreamError();
  }

  return fetchAdminPromotionById(savedId, ctx);
}

export async function archiveAdminPromotion(
  profile: AdminSessionProfile,
  promotionId: string,
  rawInput: unknown,
  ctx: AdminRepoContext = {},
): Promise<AdminPromotionItem> {
  assertOwnerRole(profile);

  const parsed = archiveAdminEntitySchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AdminCatalogValidationError(ERROR_COPY.VALIDATION_ERROR, {
      expectedUpdatedAt: ['Timestamp pembaruan terakhir wajib valid.'],
    });
  }

  const client = await createServerAuthClient(ctx.response);
  const { data, error } = await client.rpc('archive_admin_promotion', {
    p_promotion_id: promotionId,
    p_expected_updated_at: parsed.data.expectedUpdatedAt,
  });

  if (error) {
    mapPostgresPromotionError(error);
  }
  if (!data) {
    throw new AdminCatalogUpstreamError();
  }

  return fetchAdminPromotionById(promotionId, ctx);
}

export async function saveAdminShippingBanner(
  profile: AdminSessionProfile,
  rawInput: unknown,
  ctx: AdminRepoContext = {},
): Promise<AdminShippingBannerItem> {
  assertOwnerRole(profile);

  const parsed = saveAdminShippingBannerSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.map(String).join('.') || 'root';
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    throw new AdminCatalogValidationError(
      ERROR_COPY.VALIDATION_ERROR,
      fieldErrors,
    );
  }

  const input = parsed.data;
  const client = await createServerAuthClient(ctx.response);
  const { data: existing, error: fetchError } = await client
    .from('site_content')
    .select('content_json,status,updated_at')
    .eq('key', 'promo.shipping_banner')
    .maybeSingle();

  if (fetchError) {
    throw new AdminCatalogUpstreamError();
  }

  if (existing) {
    if (
      input.expectedUpdatedAt === null ||
      existing.updated_at !== input.expectedUpdatedAt
    ) {
      throw new AdminCatalogConflictError(
        ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.STALE_CONFLICT,
      );
    }

    const { data: updated, error: updateError } = await client
      .from('site_content')
      .update({
        content_json: {
          title: input.title,
          body: input.body,
        },
        status: input.status,
        updated_by: profile.userId,
      })
      .eq('key', 'promo.shipping_banner')
      .eq('updated_at', input.expectedUpdatedAt)
      .select('content_json,status,updated_at')
      .maybeSingle();

    if (updateError) {
      throw new AdminCatalogUpstreamError();
    }
    if (!updated) {
      throw new AdminCatalogConflictError(
        ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.STALE_CONFLICT,
      );
    }
    return mapAdminShippingBannerRow(updated);
  }

  if (input.expectedUpdatedAt !== null) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.PROMOTIONS.ERRORS.STALE_CONFLICT,
    );
  }

  const { data: inserted, error: insertError } = await client
    .from('site_content')
    .insert({
      key: 'promo.shipping_banner',
      content_json: {
        title: input.title,
        body: input.body,
      },
      status: input.status,
      updated_by: profile.userId,
    })
    .select('content_json,status,updated_at')
    .single();

  if (insertError || !inserted) {
    throw new AdminCatalogUpstreamError();
  }

  return mapAdminShippingBannerRow(inserted);
}
