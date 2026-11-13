import 'server-only';

import type { NextResponse } from 'next/server';

import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import { createServerAuthClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

import {
  AdminCatalogUpstreamError,
  mapPostgresCatalogError,
} from './errors.server';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];

export interface RawAdminProductWithRelations extends ProductRow {
  product_categories:
    | {
        is_primary: boolean;
        categories: {
          id: string;
          name: string;
          slug: string;
          status: string;
        } | null;
      }[]
    | null;
  product_variants:
    | {
        id: string;
        status: string;
        branch_variant_offers:
          | {
              is_listed: boolean;
              branches: { is_active: boolean } | null;
            }[]
          | null;
      }[]
    | null;
  product_images:
    | {
        id: string;
        variant_id: string | null;
        is_approved: boolean;
        alt_text: string | null;
      }[]
    | null;
}

const ADMIN_PRODUCT_SELECT =
  'id,name,slug,short_description,description,ingredients_info,storage_instructions,product_type,is_featured,is_best_seller,is_new,status,needs_owner_review,sort_order,created_at,updated_at,product_categories(is_primary,categories(id,name,slug,status)),product_variants(id,status,branch_variant_offers(is_listed,branches(is_active))),product_images(id,variant_id,is_approved,alt_text)';

function withDeadline(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(ADMIN_CATALOG_LIMITS.READ_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

export interface AdminRepoContext {
  response?: NextResponse;
  signal?: AbortSignal;
}

async function countRows(
  query: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number> {
  const { count, error } = await query;
  if (error) {
    throw new AdminCatalogUpstreamError();
  }
  return count ?? 0;
}

export async function readOwnerOverviewCountsRepo(ctx: AdminRepoContext = {}) {
  const client = await createServerAuthClient(ctx.response);
  const deadline = withDeadline(ctx.signal);
  const nowIso = new Date().toISOString();

  const [
    categoriesPublished,
    categoriesDraft,
    categoriesArchived,
    productsPublished,
    productsDraft,
    productsArchived,
    productsNeedsReview,
    activeBranches,
    soldOutOffers,
    activePromotions,
    upcomingSessions,
  ] = await Promise.all([
    countRows(
      client
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .abortSignal(deadline),
    ),
    countRows(
      client
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft')
        .abortSignal(deadline),
    ),
    countRows(
      client
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'archived')
        .abortSignal(deadline),
    ),
    countRows(
      client
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .abortSignal(deadline),
    ),
    countRows(
      client
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft')
        .abortSignal(deadline),
    ),
    countRows(
      client
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'archived')
        .abortSignal(deadline),
    ),
    countRows(
      client
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('needs_owner_review', true)
        .neq('status', 'archived')
        .abortSignal(deadline),
    ),
    countRows(
      client
        .from('branches')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .abortSignal(deadline),
    ),
    countRows(
      client
        .from('branch_variant_offers')
        .select('variant_id', { count: 'exact', head: true })
        .eq('availability_status', 'sold_out')
        .abortSignal(deadline),
    ),
    countRows(
      client
        .from('promotions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .eq('is_enabled', true)
        .lte('starts_at', nowIso)
        .gt('ends_at', nowIso)
        .abortSignal(deadline),
    ),
    countRows(
      client
        .from('class_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gt('starts_at', nowIso)
        .abortSignal(deadline),
    ),
  ]);

  return {
    categoriesPublished,
    categoriesDraft,
    categoriesArchived,
    productsPublished,
    productsDraft,
    productsArchived,
    productsNeedsReview,
    activeBranches,
    soldOutOffers,
    activePromotions,
    upcomingSessions,
  };
}

export async function readStaffOverviewCountsRepo(
  branchId: string | null,
  ctx: AdminRepoContext = {},
) {
  if (!branchId) {
    return {
      availableOffers: 0,
      soldOutOffers: 0,
      upcomingSessions: 0,
    };
  }

  const client = await createServerAuthClient(ctx.response);
  const deadline = withDeadline(ctx.signal);
  const nowIso = new Date().toISOString();

  const [availableOffers, soldOutOffers, upcomingSessions] = await Promise.all([
    countRows(
      client
        .from('branch_variant_offers')
        .select('variant_id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .eq('is_listed', true)
        .eq('availability_status', 'available')
        .abortSignal(deadline),
    ),
    countRows(
      client
        .from('branch_variant_offers')
        .select('variant_id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .eq('availability_status', 'sold_out')
        .abortSignal(deadline),
    ),
    countRows(
      client
        .from('class_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .eq('status', 'scheduled')
        .gt('starts_at', nowIso)
        .abortSignal(deadline),
    ),
  ]);

  return {
    availableOffers,
    soldOutOffers,
    upcomingSessions,
  };
}

export async function readAdminCategoriesRepo(
  ctx: AdminRepoContext = {},
): Promise<{
  categories: CategoryRow[];
  productLinks: { category_id: string; product_id: string }[];
}> {
  const client = await createServerAuthClient(ctx.response);
  const deadline = withDeadline(ctx.signal);

  const [categoriesResult, linksResult] = await Promise.all([
    client
      .from('categories')
      .select(
        'id,name,slug,parent_id,description,cover_image_path,sort_order,status,created_at,updated_at',
      )
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .order('id', { ascending: true })
      .limit(ADMIN_CATALOG_LIMITS.MAX_CATEGORIES_LIST)
      .abortSignal(deadline),
    client
      .from('product_categories')
      .select('category_id,product_id')
      .limit(2000)
      .abortSignal(deadline),
  ]);

  if (categoriesResult.error || linksResult.error) {
    throw new AdminCatalogUpstreamError();
  }

  return {
    categories: (categoriesResult.data ?? []) as CategoryRow[],
    productLinks: (linksResult.data ?? []) as {
      category_id: string;
      product_id: string;
    }[],
  };
}

export async function insertAdminCategoryRepo(
  payload: Database['public']['Tables']['categories']['Insert'],
  ctx: AdminRepoContext = {},
): Promise<CategoryRow> {
  const client = await createServerAuthClient(ctx.response);
  const { data, error } = await client
    .from('categories')
    .insert(payload)
    .select(
      'id,name,slug,parent_id,description,cover_image_path,sort_order,status,created_at,updated_at',
    )
    .single();

  if (error || !data) {
    mapPostgresCatalogError(error ?? {}, 'category');
  }

  return data as CategoryRow;
}

export async function updateAdminCategoryAtomicRepo(
  id: string,
  expectedUpdatedAt: string,
  payload: Database['public']['Tables']['categories']['Update'],
  ctx: AdminRepoContext = {},
): Promise<
  | { status: 'updated'; row: CategoryRow }
  | { status: 'not_found' }
  | { status: 'conflict' }
> {
  const client = await createServerAuthClient(ctx.response);
  const { data, error } = await client
    .from('categories')
    .update(payload)
    .eq('id', id)
    .eq('updated_at', expectedUpdatedAt)
    .select(
      'id,name,slug,parent_id,description,cover_image_path,sort_order,status,created_at,updated_at',
    )
    .maybeSingle();

  if (error) {
    mapPostgresCatalogError(error, 'category');
  }

  if (data) {
    return { status: 'updated', row: data as CategoryRow };
  }

  const { data: existsRow, error: existsError } = await client
    .from('categories')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (existsError) {
    throw new AdminCatalogUpstreamError();
  }

  return existsRow ? { status: 'conflict' } : { status: 'not_found' };
}

export async function countPublishedExclusiveProductsForCategoryRepo(
  categoryId: string,
  ctx: AdminRepoContext = {},
): Promise<number> {
  const client = await createServerAuthClient(ctx.response);
  const deadline = withDeadline(ctx.signal);

  const { data, error } = await client
    .from('product_categories')
    .select('product_id,products!inner(id,status)')
    .eq('category_id', categoryId)
    .eq('products.status', 'published')
    .abortSignal(deadline);

  if (error) {
    throw new AdminCatalogUpstreamError();
  }

  const candidateProductIds = (data ?? []).map((row) => row.product_id);
  if (candidateProductIds.length === 0) {
    return 0;
  }

  const { data: allLinks, error: linksError } = await client
    .from('product_categories')
    .select('product_id,category_id,categories!inner(id,status)')
    .in('product_id', candidateProductIds)
    .eq('categories.status', 'published')
    .abortSignal(deadline);

  if (linksError) {
    throw new AdminCatalogUpstreamError();
  }

  const otherPublishedByProduct = new Map<string, number>();
  for (const link of allLinks ?? []) {
    if (link.category_id === categoryId) continue;
    otherPublishedByProduct.set(
      link.product_id,
      (otherPublishedByProduct.get(link.product_id) ?? 0) + 1,
    );
  }

  return candidateProductIds.filter(
    (productId) => (otherPublishedByProduct.get(productId) ?? 0) === 0,
  ).length;
}

export async function readAdminProductsRepo(
  statusFilter: string | undefined,
  ctx: AdminRepoContext = {},
): Promise<RawAdminProductWithRelations[]> {
  const client = await createServerAuthClient(ctx.response);
  const deadline = withDeadline(ctx.signal);

  let builder = client
    .from('products')
    .select(ADMIN_PRODUCT_SELECT)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })
    .limit(ADMIN_CATALOG_LIMITS.MAX_PRODUCTS_SCAN)
    .abortSignal(deadline);

  if (statusFilter) {
    builder = builder.eq('status', statusFilter);
  }

  const { data, error } = await builder;
  if (error) {
    throw new AdminCatalogUpstreamError();
  }

  return (data ?? []) as unknown as RawAdminProductWithRelations[];
}

export async function readAdminProductByIdRepo(
  id: string,
  ctx: AdminRepoContext = {},
): Promise<RawAdminProductWithRelations | null> {
  const client = await createServerAuthClient(ctx.response);
  const deadline = withDeadline(ctx.signal);

  const { data, error } = await client
    .from('products')
    .select(ADMIN_PRODUCT_SELECT)
    .eq('id', id)
    .abortSignal(deadline)
    .maybeSingle();

  if (error) {
    throw new AdminCatalogUpstreamError();
  }

  return (data ?? null) as unknown as RawAdminProductWithRelations | null;
}

export async function insertAdminProductRepo(
  payload: Database['public']['Tables']['products']['Insert'],
  ctx: AdminRepoContext = {},
): Promise<string> {
  const client = await createServerAuthClient(ctx.response);
  const { data, error } = await client
    .from('products')
    .insert(payload)
    .select('id')
    .single();

  if (error || !data) {
    mapPostgresCatalogError(error ?? {}, 'product');
  }

  return data.id;
}

export async function updateAdminProductAtomicRepo(
  id: string,
  expectedUpdatedAt: string,
  payload: Database['public']['Tables']['products']['Update'],
  ctx: AdminRepoContext = {},
): Promise<
  | { status: 'updated'; id: string }
  | { status: 'not_found' }
  | { status: 'conflict' }
> {
  const client = await createServerAuthClient(ctx.response);
  const { data, error } = await client
    .from('products')
    .update(payload)
    .eq('id', id)
    .eq('updated_at', expectedUpdatedAt)
    .select('id')
    .maybeSingle();

  if (error) {
    mapPostgresCatalogError(error, 'product');
  }

  if (data) {
    return { status: 'updated', id: data.id };
  }

  const { data: existsRow, error: existsError } = await client
    .from('products')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (existsError) {
    throw new AdminCatalogUpstreamError();
  }

  return existsRow ? { status: 'conflict' } : { status: 'not_found' };
}
