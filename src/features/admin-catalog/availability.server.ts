import 'server-only';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { AuthError, AuthForbiddenError } from '@/features/auth/errors.server';
import { createServerAuthClient } from '@/lib/supabase/server';
import type {
  AdminAvailabilityListResponse,
  AdminAvailabilityOfferItem,
  AdminAvailabilityQuery,
  AdminBulkAvailabilityItemResult,
  AdminBulkAvailabilityResponse,
  AdminCatalogStatus,
  AdminOfferAvailabilityStatus,
  AdminProductType,
  AdminVariantStatus,
  BulkUpdateAvailabilityInput,
  UpsertBranchAvailabilityInput,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { isZeroStockStatusValid } from '@/utils/admin-branches';

import {
  AdminCatalogConflictError,
  AdminCatalogNotFoundError,
  AdminCatalogUpstreamError,
  AdminCatalogValidationError,
} from './errors.server';
import { revalidatePublicLocationAndOfferPaths } from './http.server';
import type { AdminRepoContext } from './repository.server';

interface RawBranchRow {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

interface RawProductJoinRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  product_type: string;
  sort_order: number;
}

interface RawVariantJoinRow {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  size_label: string | null;
  base_price_idr: number;
  status: string;
  sort_order: number;
  updated_at: string;
  products: RawProductJoinRow | RawProductJoinRow[];
}

interface RawOfferRow {
  branch_id: string;
  variant_id: string;
  is_listed: boolean;
  availability_status: string;
  stock_quantity: number | null;
  price_override_idr: number | null;
  updated_at: string;
}

type AdminSupabaseClient = Awaited<ReturnType<typeof createServerAuthClient>>;

function unwrapProduct(
  joined: RawProductJoinRow | RawProductJoinRow[],
): RawProductJoinRow | null {
  if (Array.isArray(joined)) {
    return joined[0] ?? null;
  }
  return joined ?? null;
}

function normalizeOfferStatus(value: string): AdminOfferAvailabilityStatus {
  if (value === 'available' || value === 'sold_out') {
    return value;
  }
  return 'unconfirmed';
}

function buildOfferItem(
  branch: RawBranchRow,
  variant: RawVariantJoinRow,
  product: RawProductJoinRow,
  offer: RawOfferRow | undefined,
): AdminAvailabilityOfferItem {
  const basePriceIdr = variant.base_price_idr;
  const priceOverrideIdr = offer?.price_override_idr ?? null;

  return {
    branchId: branch.id,
    branchCode: branch.code === 'bintaro' ? 'bintaro' : 'surabaya',
    branchName: branch.name,
    variantId: variant.id,
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    productStatus: product.status as AdminCatalogStatus,
    productType: product.product_type as AdminProductType,
    sku: variant.sku,
    variantLabel: variant.size_label
      ? `${variant.name} (${variant.size_label})`
      : variant.name,
    variantStatus: variant.status as AdminVariantStatus,
    basePriceIdr,
    priceOverrideIdr,
    effectivePriceIdr: priceOverrideIdr ?? basePriceIdr,
    isListed: offer ? Boolean(offer.is_listed) : false,
    availabilityStatus: offer
      ? normalizeOfferStatus(offer.availability_status)
      : 'unconfirmed',
    stockQuantity: offer ? offer.stock_quantity : null,
    hasOfferRow: Boolean(offer),
    offerUpdatedAt: offer ? offer.updated_at : null,
    variantUpdatedAt: variant.updated_at,
  };
}

function mapOfferPgError(error: {
  code?: string | null;
  message?: string | null;
}): never {
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();

  if (code === '42501') {
    if (msg.includes('branch_write_denied')) {
      throw new AuthForbiddenError(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.FOREIGN_BRANCH_FORBIDDEN,
      );
    }
    if (
      msg.includes('staff_update_fields_denied') ||
      msg.includes('staff_insert_fields_denied') ||
      msg.includes('owner_required')
    ) {
      throw new AuthForbiddenError(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.STAFF_PRICE_FORBIDDEN,
      );
    }
    throw new AuthForbiddenError();
  }

  if (code === 'P0002') {
    throw new AdminCatalogNotFoundError();
  }

  if (code === '40900' || code === '23505') {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.STALE_CONFLICT,
    );
  }

  if (code === '23514' || code === '22023') {
    if (
      msg.includes('zero_stock_requires_sold_out') ||
      msg.includes('branch_variant_offers_check')
    ) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.ZERO_STOCK_CONTRADICTION,
        {
          availabilityStatus: [
            ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.ZERO_STOCK_CONTRADICTION,
          ],
        },
      );
    }
    if (msg.includes('bundle_component_not_offered')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.BUNDLE_COMPONENT_NOT_OFFERED,
        {
          isListed: [
            ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.BUNDLE_COMPONENT_NOT_OFFERED,
          ],
        },
      );
    }
    if (msg.includes('configured_unit_price_exceeds_cap')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.PRICE_CAP_EXCEEDED,
        {
          priceOverrideIdr: [
            ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.PRICE_CAP_EXCEEDED,
          ],
        },
      );
    }
    throw new AdminCatalogValidationError();
  }

  throw new AdminCatalogUpstreamError();
}

function assertStaffScopeAndFields(
  profile: AdminSessionProfile,
  branchId: string,
  input: UpsertBranchAvailabilityInput,
  rawBody: unknown,
): void {
  if (profile.role !== 'branch_admin') {
    return;
  }

  if (!profile.branchId || branchId !== profile.branchId) {
    throw new AuthForbiddenError(
      ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.FOREIGN_BRANCH_FORBIDDEN,
    );
  }

  if (
    input.priceOverrideIdr !== undefined ||
    input.basePriceIdr !== undefined
  ) {
    throw new AuthForbiddenError(
      ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.STAFF_PRICE_FORBIDDEN,
    );
  }

  if (rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)) {
    const obj = rawBody as Record<string, unknown>;
    if (
      'priceOverrideIdr' in obj ||
      'price_override_idr' in obj ||
      'basePriceIdr' in obj ||
      'base_price_idr' in obj
    ) {
      throw new AuthForbiddenError(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.STAFF_PRICE_FORBIDDEN,
      );
    }
    if (
      ('branchId' in obj && obj.branchId !== profile.branchId) ||
      ('branch_id' in obj && obj.branch_id !== profile.branchId)
    ) {
      throw new AuthForbiddenError(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.FOREIGN_BRANCH_FORBIDDEN,
      );
    }
  }
}

async function readSingleOfferItem(
  profile: AdminSessionProfile,
  branchId: string,
  variantId: string,
  supabase: AdminSupabaseClient,
  signal?: AbortSignal,
): Promise<AdminAvailabilityOfferItem> {
  let branchQuery = supabase
    .from('branches')
    .select('id,code,name,sort_order,is_active')
    .eq('id', branchId);

  if (signal) {
    branchQuery = branchQuery.abortSignal(signal);
  }

  const { data: branchData, error: branchError } =
    await branchQuery.maybeSingle();
  if (branchError) {
    mapOfferPgError(branchError);
  }
  if (!branchData) {
    throw new AdminCatalogNotFoundError();
  }

  let variantQuery = supabase
    .from('product_variants')
    .select(
      'id,product_id,sku,name,size_label,base_price_idr,status,sort_order,updated_at,products!inner(id,name,slug,status,product_type,sort_order)',
    )
    .eq('id', variantId)
    .eq('status', 'active')
    .in(
      'products.status',
      profile.role === 'owner' ? ['published', 'draft'] : ['published'],
    );

  if (signal) {
    variantQuery = variantQuery.abortSignal(signal);
  }

  const { data: variantData, error: variantError } =
    await variantQuery.maybeSingle();
  if (variantError) {
    mapOfferPgError(variantError);
  }
  const variant = variantData as RawVariantJoinRow | null;
  const product = variant ? unwrapProduct(variant.products) : null;
  if (!variant || !product) {
    throw new AdminCatalogNotFoundError();
  }

  let offerQuery = supabase
    .from('branch_variant_offers')
    .select(
      'branch_id,variant_id,is_listed,availability_status,stock_quantity,price_override_idr,updated_at',
    )
    .eq('branch_id', branchId)
    .eq('variant_id', variantId);

  if (signal) {
    offerQuery = offerQuery.abortSignal(signal);
  }

  const { data: offerData, error: offerError } = await offerQuery.maybeSingle();
  if (offerError) {
    mapOfferPgError(offerError);
  }

  return buildOfferItem(
    branchData as RawBranchRow,
    variant,
    product,
    (offerData ?? undefined) as RawOfferRow | undefined,
  );
}

async function executeSingleOfferUpsert(
  profile: AdminSessionProfile,
  branchId: string,
  variantId: string,
  input: UpsertBranchAvailabilityInput,
  rawBody: unknown,
  supabase: AdminSupabaseClient,
  signal?: AbortSignal,
): Promise<AdminAvailabilityOfferItem> {
  assertStaffScopeAndFields(profile, branchId, input, rawBody);

  if (!isZeroStockStatusValid(input.stockQuantity, input.availabilityStatus)) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.ZERO_STOCK_CONTRADICTION,
      {
        availabilityStatus: [
          ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.ZERO_STOCK_CONTRADICTION,
        ],
      },
    );
  }

  const currentOffer = await readSingleOfferItem(
    profile,
    branchId,
    variantId,
    supabase,
    signal,
  );

  if (profile.role === 'owner') {
    const updateBasePrice = input.basePriceIdr !== undefined;
    const targetBasePrice =
      input.basePriceIdr !== undefined
        ? input.basePriceIdr
        : currentOffer.basePriceIdr;
    const targetOverride =
      input.priceOverrideIdr !== undefined
        ? input.priceOverrideIdr
        : currentOffer.priceOverrideIdr;

    let rpcQuery = supabase.rpc('owner_upsert_branch_offer', {
      p_branch_id: branchId,
      p_variant_id: variantId,
      p_expected_offer_updated_at: input.expectedOfferUpdatedAt,
      p_expected_variant_updated_at: updateBasePrice
        ? (input.expectedVariantUpdatedAt ?? currentOffer.variantUpdatedAt)
        : null,
      p_update_base_price: updateBasePrice,
      p_base_price_idr: targetBasePrice,
      p_is_listed: input.isListed,
      p_availability_status: input.availabilityStatus,
      p_stock_quantity: input.stockQuantity,
      p_price_override_idr: targetOverride,
    });

    if (signal) {
      rpcQuery = rpcQuery.abortSignal(signal);
    }

    const { error: rpcError } = await rpcQuery;
    if (rpcError) {
      mapOfferPgError(rpcError);
    }

    return readSingleOfferItem(profile, branchId, variantId, supabase, signal);
  }

  if (input.expectedOfferUpdatedAt === null) {
    if (currentOffer.hasOfferRow) {
      throw new AdminCatalogConflictError(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.STALE_CONFLICT,
      );
    }

    const { error: insertError } = await supabase
      .from('branch_variant_offers')
      .insert({
        branch_id: branchId,
        variant_id: variantId,
        is_listed: input.isListed,
        availability_status: input.availabilityStatus,
        stock_quantity: input.stockQuantity,
      })
      .select('branch_id,variant_id,updated_at')
      .single();

    if (insertError) {
      mapOfferPgError(insertError);
    }

    return readSingleOfferItem(profile, branchId, variantId, supabase, signal);
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from('branch_variant_offers')
    .update({
      is_listed: input.isListed,
      availability_status: input.availabilityStatus,
      stock_quantity: input.stockQuantity,
    })
    .eq('branch_id', branchId)
    .eq('variant_id', variantId)
    .eq('updated_at', input.expectedOfferUpdatedAt)
    .select('branch_id,variant_id,updated_at')
    .maybeSingle();

  if (updateError) {
    mapOfferPgError(updateError);
  }
  if (!updatedRow) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.STALE_CONFLICT,
    );
  }

  return readSingleOfferItem(profile, branchId, variantId, supabase, signal);
}

export async function listAdminAvailability(
  profile: AdminSessionProfile,
  query: AdminAvailabilityQuery,
  ctx: AdminRepoContext = {},
): Promise<AdminAvailabilityListResponse> {
  if (profile.role === 'branch_admin') {
    if (!profile.branchId) {
      throw new AuthForbiddenError(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.FOREIGN_BRANCH_FORBIDDEN,
      );
    }
    if (query.branchId && query.branchId !== profile.branchId) {
      throw new AuthForbiddenError(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.FOREIGN_BRANCH_FORBIDDEN,
      );
    }
  }

  const supabase = await createServerAuthClient(ctx.response);

  let branchQuery = supabase
    .from('branches')
    .select('id,code,name,sort_order,is_active')
    .eq('is_active', true)
    .order('sort_order')
    .order('name')
    .order('id');

  if (profile.role === 'branch_admin' && profile.branchId) {
    branchQuery = branchQuery.eq('id', profile.branchId);
  }
  if (ctx.signal) {
    branchQuery = branchQuery.abortSignal(ctx.signal);
  }

  const { data: branchRows, error: branchError } = await branchQuery;
  if (branchError) {
    mapOfferPgError(branchError);
  }

  const availableBranches = (branchRows ?? []) as RawBranchRow[];
  const targetBranches =
    profile.role === 'branch_admin'
      ? availableBranches
      : query.branchId
        ? availableBranches.filter((branch) => branch.id === query.branchId)
        : availableBranches;

  const allowedProductStatuses =
    profile.role === 'owner' ? ['published', 'draft'] : ['published'];

  let variantQuery = supabase
    .from('product_variants')
    .select(
      'id,product_id,sku,name,size_label,base_price_idr,status,sort_order,updated_at,products!inner(id,name,slug,status,product_type,sort_order)',
    )
    .eq('status', 'active')
    .in('products.status', allowedProductStatuses)
    .order('sort_order')
    .order('id');

  if (ctx.signal) {
    variantQuery = variantQuery.abortSignal(ctx.signal);
  }

  const { data: variantRows, error: variantError } = await variantQuery;
  if (variantError) {
    mapOfferPgError(variantError);
  }

  const variantsWithProducts = ((variantRows ?? []) as RawVariantJoinRow[])
    .map((variant) => ({
      variant,
      product: unwrapProduct(variant.products),
    }))
    .filter(
      (
        entry,
      ): entry is { variant: RawVariantJoinRow; product: RawProductJoinRow } =>
        entry.product !== null,
    )
    .sort((a, b) => {
      if (a.product.sort_order !== b.product.sort_order) {
        return a.product.sort_order - b.product.sort_order;
      }
      const nameDiff = a.product.name.localeCompare(b.product.name);
      if (nameDiff !== 0) {
        return nameDiff;
      }
      if (a.variant.sort_order !== b.variant.sort_order) {
        return a.variant.sort_order - b.variant.sort_order;
      }
      return a.variant.sku.localeCompare(b.variant.sku);
    });

  const targetBranchIds = targetBranches.map((item) => item.id);
  const offersMap = new Map<string, RawOfferRow>();

  if (targetBranchIds.length > 0 && variantsWithProducts.length > 0) {
    let offerQuery = supabase
      .from('branch_variant_offers')
      .select(
        'branch_id,variant_id,is_listed,availability_status,stock_quantity,price_override_idr,updated_at',
      )
      .in('branch_id', targetBranchIds);

    if (ctx.signal) {
      offerQuery = offerQuery.abortSignal(ctx.signal);
    }

    const { data: offerRows, error: offerError } = await offerQuery;
    if (offerError) {
      mapOfferPgError(offerError);
    }

    for (const offer of (offerRows ?? []) as RawOfferRow[]) {
      offersMap.set(`${offer.branch_id}:${offer.variant_id}`, offer);
    }
  }

  const normalizedSearch = query.search?.toLowerCase();
  const combined: AdminAvailabilityOfferItem[] = [];

  for (const branch of targetBranches) {
    for (const { variant, product } of variantsWithProducts) {
      const item = buildOfferItem(
        branch,
        variant,
        product,
        offersMap.get(`${branch.id}:${variant.id}`),
      );

      if (query.listed === 'listed' && !item.isListed) {
        continue;
      }
      if (query.listed === 'unlisted' && item.isListed) {
        continue;
      }
      if (
        query.availabilityStatus &&
        item.availabilityStatus !== query.availabilityStatus
      ) {
        continue;
      }
      if (normalizedSearch) {
        const hay =
          `${item.productName} ${item.productSlug} ${item.sku} ${item.variantLabel}`.toLowerCase();
        if (!hay.includes(normalizedSearch)) {
          continue;
        }
      }

      combined.push(item);
    }
  }

  const totalCount = combined.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / query.pageSize));
  const safePage = Math.min(query.page, totalPages);
  const offset = (safePage - 1) * query.pageSize;

  return {
    items: combined.slice(offset, offset + query.pageSize),
    branches: availableBranches.map((item) => ({
      id: item.id,
      code: item.code === 'bintaro' ? 'bintaro' : 'surabaya',
      name: item.name,
      isActive: Boolean(item.is_active),
    })),
    pagination: {
      page: safePage,
      pageSize: query.pageSize,
      totalCount,
      totalPages,
    },
  };
}

export async function upsertAdminAvailabilityOffer(
  profile: AdminSessionProfile,
  branchId: string,
  variantId: string,
  input: UpsertBranchAvailabilityInput,
  rawBody: unknown,
  ctx: AdminRepoContext,
): Promise<AdminAvailabilityOfferItem> {
  assertStaffScopeAndFields(profile, branchId, input, rawBody);
  const supabase = await createServerAuthClient(ctx.response);
  const offer = await executeSingleOfferUpsert(
    profile,
    branchId,
    variantId,
    input,
    rawBody,
    supabase,
    ctx.signal,
  );
  revalidatePublicLocationAndOfferPaths();
  return offer;
}

export async function bulkUpdateAdminAvailability(
  profile: AdminSessionProfile,
  input: BulkUpdateAvailabilityInput,
  rawBody: unknown,
  ctx: AdminRepoContext,
): Promise<AdminBulkAvailabilityResponse> {
  const supabase = await createServerAuthClient(ctx.response);
  const rawItems =
    rawBody &&
    typeof rawBody === 'object' &&
    'items' in rawBody &&
    Array.isArray((rawBody as { items?: unknown }).items)
      ? (rawBody as { items: unknown[] }).items
      : [];

  const results: AdminBulkAvailabilityItemResult[] = [];
  let succeededCount = 0;

  for (let index = 0; index < input.items.length; index += 1) {
    const item = input.items[index];
    const rawItem = rawItems[index];

    try {
      const offer = await executeSingleOfferUpsert(
        profile,
        item.branchId,
        item.variantId,
        {
          expectedOfferUpdatedAt: item.expectedOfferUpdatedAt,
          expectedVariantUpdatedAt: item.expectedVariantUpdatedAt,
          isListed: item.isListed,
          availabilityStatus: item.availabilityStatus,
          stockQuantity: item.stockQuantity,
          priceOverrideIdr: item.priceOverrideIdr,
          basePriceIdr: item.basePriceIdr,
        },
        rawItem,
        supabase,
        ctx.signal,
      );
      succeededCount += 1;
      results.push({
        branchId: item.branchId,
        variantId: item.variantId,
        ok: true,
        status: 200,
        errorCode: null,
        message: null,
        offer,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        results.push({
          branchId: item.branchId,
          variantId: item.variantId,
          ok: false,
          status: error.status,
          errorCode: error.code,
          message: error.message,
          offer: null,
        });
      } else {
        results.push({
          branchId: item.branchId,
          variantId: item.variantId,
          ok: false,
          status: 503,
          errorCode: 'UPSTREAM_ERROR',
          message: 'Pembaruan baris ini gagal sementara.',
          offer: null,
        });
      }
    }
  }

  if (succeededCount > 0) {
    revalidatePublicLocationAndOfferPaths();
  }

  return {
    totalCount: input.items.length,
    succeededCount,
    failedCount: input.items.length - succeededCount,
    results,
  };
}
