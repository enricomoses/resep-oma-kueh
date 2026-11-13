import 'server-only';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { AuthForbiddenError } from '@/features/auth/errors.server';
import type {
  AdminCatalogStatus,
  AdminCategoryItem,
  AdminCategoryListResponse,
  AdminOverviewResponse,
  AdminProductItem,
  AdminProductListResponse,
  AdminProductQuery,
  AdminProductType,
  ArchiveAdminEntityInput,
  CreateAdminCategoryInput,
  CreateAdminProductInput,
  UpdateAdminCategoryInput,
  UpdateAdminProductInput,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import type { Database } from '@/types/database';
import {
  hasActiveCategoryChildren,
  wouldCreateCategoryCycle,
} from '@/utils/admin-catalog';

import {
  AdminCatalogConflictError,
  AdminCatalogNotFoundError,
  AdminCatalogUpstreamError,
  AdminCatalogValidationError,
} from './errors.server';
import {
  type AdminRepoContext,
  type RawAdminProductWithRelations,
  countPublishedExclusiveProductsForCategoryRepo,
  insertAdminCategoryRepo,
  insertAdminProductRepo,
  readAdminCategoriesRepo,
  readAdminProductByIdRepo,
  readAdminProductsRepo,
  readOwnerOverviewCountsRepo,
  readStaffOverviewCountsRepo,
  updateAdminCategoryAtomicRepo,
  updateAdminProductAtomicRepo,
} from './repository.server';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

function assertOwnerRole(profile: AdminSessionProfile): void {
  if (profile.role !== 'owner') {
    throw new AuthForbiddenError();
  }
}

function mapCategoriesToDto(
  categories: CategoryRow[],
  productLinks: { category_id: string; product_id: string }[],
): AdminCategoryItem[] {
  const byId = new Map<string, CategoryRow>();
  const childCountById = new Map<string, number>();
  const productRefsById = new Map<string, Set<string>>();

  for (const row of categories) {
    byId.set(row.id, row);
    if (row.parent_id) {
      childCountById.set(
        row.parent_id,
        (childCountById.get(row.parent_id) ?? 0) + 1,
      );
    }
  }

  for (const link of productLinks) {
    const set = productRefsById.get(link.category_id) ?? new Set<string>();
    set.add(link.product_id);
    productRefsById.set(link.category_id, set);
  }

  return categories.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
    parentName: row.parent_id ? (byId.get(row.parent_id)?.name ?? null) : null,
    description: row.description,
    sortOrder: row.sort_order,
    status: row.status as AdminCatalogStatus,
    childCount: childCountById.get(row.id) ?? 0,
    productRefCount: productRefsById.get(row.id)?.size ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function evaluateAdminProductReadiness(row: RawAdminProductWithRelations) {
  const categories = (row.product_categories ?? [])
    .map((pc) => pc.categories)
    .filter((cat): cat is NonNullable<typeof cat> => Boolean(cat));
  const hasPublishedCategory = categories.some(
    (cat) => cat.status === 'published',
  );

  const activeVariants = (row.product_variants ?? []).filter(
    (variant) => variant.status === 'active',
  );
  const activeVariantIds = new Set(activeVariants.map((variant) => variant.id));
  const activeVariantCount = activeVariants.length;

  const hasRequiredVariants =
    row.product_type === 'simple'
      ? activeVariantCount === 1
      : activeVariantCount >= 1;

  const hasActiveBranchOffer = activeVariants.some((variant) =>
    (variant.branch_variant_offers ?? []).some(
      (offer) => offer.is_listed && offer.branches?.is_active === true,
    ),
  );

  const approvedImages = (row.product_images ?? []).filter(
    (img) =>
      img.is_approved &&
      Boolean(img.alt_text && img.alt_text.trim().length > 0) &&
      (img.variant_id === null || activeVariantIds.has(img.variant_id)),
  );
  const approvedImageCount = approvedImages.length;

  const missingReasons: string[] = [];
  if (row.needs_owner_review) {
    missingReasons.push('Review Owner belum ditandai selesai');
  }
  if (!hasPublishedCategory) {
    missingReasons.push('Minimal 1 kategori berstatus terpublikasi');
  }
  if (!hasRequiredVariants) {
    missingReasons.push(
      row.product_type === 'simple'
        ? 'Produk tunggal wajib memiliki tepat 1 varian SKU aktif'
        : 'Minimal 1 varian SKU aktif',
    );
  }
  if (!hasActiveBranchOffer) {
    missingReasons.push('Minimal 1 varian aktif ditawarkan di cabang aktif');
  }
  if (approvedImageCount === 0) {
    missingReasons.push('Minimal 1 foto produk disetujui dengan alt text');
  }

  return {
    hasPublishedCategory,
    activeVariantCount,
    hasActiveBranchOffer,
    approvedImageCount,
    needsOwnerReview: row.needs_owner_review,
    isPublishReady: missingReasons.length === 0,
    missingReasons,
  };
}

function mapProductToDto(row: RawAdminProductWithRelations): AdminProductItem {
  const categories = (row.product_categories ?? [])
    .map((pc) =>
      pc.categories
        ? {
            id: pc.categories.id,
            name: pc.categories.name,
            slug: pc.categories.slug,
            status: pc.categories.status as AdminCatalogStatus,
            isPrimary: pc.is_primary,
          }
        : null,
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    productType: row.product_type as AdminProductType,
    status: row.status as AdminCatalogStatus,
    needsOwnerReview: row.needs_owner_review,
    isFeatured: row.is_featured,
    isBestSeller: row.is_best_seller,
    isNew: row.is_new,
    shortDescription: row.short_description,
    description: row.description,
    ingredientsInfo: row.ingredients_info,
    storageInstructions: row.storage_instructions,
    sortOrder: row.sort_order,
    categories,
    readiness: evaluateAdminProductReadiness(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAdminOverview(
  profile: AdminSessionProfile,
  ctx: AdminRepoContext = {},
): Promise<AdminOverviewResponse> {
  if (profile.role === 'owner') {
    const ownerCounts = await readOwnerOverviewCountsRepo(ctx);
    return {
      role: profile.role,
      branchId: profile.branchId,
      branchName: profile.branchName,
      ownerCounts,
      staffCounts: null,
    };
  }

  const staffCounts = await readStaffOverviewCountsRepo(profile.branchId, ctx);
  return {
    role: profile.role,
    branchId: profile.branchId,
    branchName: profile.branchName,
    ownerCounts: null,
    staffCounts,
  };
}

export async function listAdminCategories(
  profile: AdminSessionProfile,
  ctx: AdminRepoContext = {},
): Promise<AdminCategoryListResponse> {
  assertOwnerRole(profile);
  const { categories, productLinks } = await readAdminCategoriesRepo(ctx);
  return {
    items: mapCategoriesToDto(categories, productLinks),
  };
}

export async function getAdminCategoryById(
  profile: AdminSessionProfile,
  id: string,
  ctx: AdminRepoContext = {},
): Promise<AdminCategoryItem> {
  const { items } = await listAdminCategories(profile, ctx);
  const found = items.find((item) => item.id === id);
  if (!found) {
    throw new AdminCatalogNotFoundError();
  }
  return found;
}

export async function createAdminCategory(
  profile: AdminSessionProfile,
  input: CreateAdminCategoryInput,
  ctx: AdminRepoContext = {},
): Promise<AdminCategoryItem> {
  assertOwnerRole(profile);

  const { categories } = await readAdminCategoriesRepo(ctx);
  if (input.parentId) {
    const parent = categories.find((cat) => cat.id === input.parentId);
    if (!parent) {
      throw new AdminCatalogValidationError(undefined, {
        parentId: ['Kategori induk tidak ditemukan.'],
      });
    }
    if (input.status === 'published' && parent.status !== 'published') {
      const msg = ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.PARENT_UNPUBLISHED;
      throw new AdminCatalogValidationError(msg, { status: [msg] });
    }
  }

  const inserted = await insertAdminCategoryRepo(
    {
      name: input.name,
      slug: input.slug,
      parent_id: input.parentId,
      description: input.description,
      sort_order: input.sortOrder,
      status: input.status,
    },
    ctx,
  );

  return getAdminCategoryById(profile, inserted.id, ctx);
}

export async function updateAdminCategory(
  profile: AdminSessionProfile,
  id: string,
  input: UpdateAdminCategoryInput,
  ctx: AdminRepoContext = {},
): Promise<AdminCategoryItem> {
  assertOwnerRole(profile);

  const { categories } = await readAdminCategoriesRepo(ctx);
  const current = categories.find((cat) => cat.id === id);
  if (!current) {
    throw new AdminCatalogNotFoundError();
  }

  const hierarchyNodes = categories.map((cat) => ({
    id: cat.id,
    parentId: cat.parent_id,
    status: cat.status,
  }));

  if (wouldCreateCategoryCycle(id, input.parentId, hierarchyNodes)) {
    const msg = ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.CYCLE;
    throw new AdminCatalogValidationError(msg, { parentId: [msg] });
  }

  if (input.parentId) {
    const parent = categories.find((cat) => cat.id === input.parentId);
    if (!parent) {
      throw new AdminCatalogValidationError(undefined, {
        parentId: ['Kategori induk tidak ditemukan.'],
      });
    }
    if (input.status === 'published' && parent.status !== 'published') {
      const msg = ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.PARENT_UNPUBLISHED;
      throw new AdminCatalogValidationError(msg, { status: [msg] });
    }
  }

  if (input.status === 'archived') {
    await assertCategorySafeToArchive(id, hierarchyNodes, ctx);
  }

  if (
    current.status === 'published' &&
    input.status !== 'published' &&
    hasActiveCategoryChildren(id, hierarchyNodes)
  ) {
    const publishedChild = hierarchyNodes.some(
      (cat) => cat.parentId === id && cat.status === 'published',
    );
    if (publishedChild) {
      const msg = ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.PARENT_UNPUBLISHED;
      throw new AdminCatalogValidationError(msg, { status: [msg] });
    }
  }

  const outcome = await updateAdminCategoryAtomicRepo(
    id,
    input.expectedUpdatedAt,
    {
      name: input.name,
      parent_id: input.parentId,
      description: input.description,
      sort_order: input.sortOrder,
      status: input.status,
    },
    ctx,
  );

  if (outcome.status === 'not_found') {
    throw new AdminCatalogNotFoundError();
  }
  if (outcome.status === 'conflict') {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.STALE_CONFLICT,
    );
  }

  return getAdminCategoryById(profile, id, ctx);
}

async function assertCategorySafeToArchive(
  categoryId: string,
  hierarchyNodes: ReadonlyArray<{
    id: string;
    parentId: string | null;
    status: string;
  }>,
  ctx: AdminRepoContext,
): Promise<void> {
  if (hasActiveCategoryChildren(categoryId, hierarchyNodes)) {
    const msg = ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.ARCHIVE_BLOCKED_CHILDREN;
    throw new AdminCatalogConflictError(msg, { status: [msg] });
  }

  const blockingProducts = await countPublishedExclusiveProductsForCategoryRepo(
    categoryId,
    ctx,
  );
  if (blockingProducts > 0) {
    const msg = ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.ARCHIVE_BLOCKED_PRODUCTS;
    throw new AdminCatalogConflictError(msg, { status: [msg] });
  }
}

export async function archiveAdminCategory(
  profile: AdminSessionProfile,
  id: string,
  input: ArchiveAdminEntityInput,
  ctx: AdminRepoContext = {},
): Promise<AdminCategoryItem> {
  assertOwnerRole(profile);

  const { categories } = await readAdminCategoriesRepo(ctx);
  const current = categories.find((cat) => cat.id === id);
  if (!current) {
    throw new AdminCatalogNotFoundError();
  }

  const hierarchyNodes = categories.map((cat) => ({
    id: cat.id,
    parentId: cat.parent_id,
    status: cat.status,
  }));

  await assertCategorySafeToArchive(id, hierarchyNodes, ctx);

  const outcome = await updateAdminCategoryAtomicRepo(
    id,
    input.expectedUpdatedAt,
    { status: 'archived' },
    ctx,
  );

  if (outcome.status === 'not_found') {
    throw new AdminCatalogNotFoundError();
  }
  if (outcome.status === 'conflict') {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.STALE_CONFLICT,
    );
  }

  return getAdminCategoryById(profile, id, ctx);
}

export async function listAdminProducts(
  profile: AdminSessionProfile,
  query: AdminProductQuery,
  ctx: AdminRepoContext = {},
): Promise<AdminProductListResponse> {
  assertOwnerRole(profile);

  const rawRows = await readAdminProductsRepo(query.status, ctx);
  const normalizedQ = query.q?.trim().toLowerCase() ?? '';

  const mapped = rawRows.map(mapProductToDto);
  const filtered = mapped.filter((item) => {
    if (query.categoryId) {
      const hasCat = item.categories.some((cat) => cat.id === query.categoryId);
      if (!hasCat) return false;
    }
    if (normalizedQ.length > 0) {
      const inName = item.name.toLowerCase().includes(normalizedQ);
      const inSlug = item.slug.toLowerCase().includes(normalizedQ);
      if (!inName && !inSlug) return false;
    }
    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  const safePage = Math.min(Math.max(1, query.page), totalPages);
  const start = (safePage - 1) * query.limit;
  const items = filtered.slice(start, start + query.limit);

  return {
    items,
    total,
    page: safePage,
    limit: query.limit,
    totalPages,
  };
}

export async function getAdminProductById(
  profile: AdminSessionProfile,
  id: string,
  ctx: AdminRepoContext = {},
): Promise<AdminProductItem> {
  assertOwnerRole(profile);
  const row = await readAdminProductByIdRepo(id, ctx);
  if (!row) {
    throw new AdminCatalogNotFoundError();
  }
  return mapProductToDto(row);
}

export async function createAdminProduct(
  profile: AdminSessionProfile,
  input: CreateAdminProductInput,
  ctx: AdminRepoContext = {},
): Promise<AdminProductItem> {
  assertOwnerRole(profile);

  const newId = await insertAdminProductRepo(
    {
      name: input.name,
      slug: input.slug,
      product_type: input.productType,
      status: 'draft',
      short_description: input.shortDescription,
      description: input.description,
      ingredients_info: input.ingredientsInfo,
      storage_instructions: input.storageInstructions,
      is_featured: input.isFeatured,
      is_best_seller: input.isBestSeller,
      is_new: input.isNew,
      needs_owner_review: input.needsOwnerReview,
      sort_order: input.sortOrder,
    },
    ctx,
  );

  const created = await readAdminProductByIdRepo(newId, ctx);
  if (!created) {
    throw new AdminCatalogUpstreamError();
  }
  return mapProductToDto(created);
}

export async function updateAdminProduct(
  profile: AdminSessionProfile,
  id: string,
  input: UpdateAdminProductInput,
  ctx: AdminRepoContext = {},
): Promise<AdminProductItem> {
  assertOwnerRole(profile);

  const currentRow = await readAdminProductByIdRepo(id, ctx);
  if (!currentRow) {
    throw new AdminCatalogNotFoundError();
  }

  if (input.status === 'published') {
    const simulatedRow: RawAdminProductWithRelations = {
      ...currentRow,
      product_type: input.productType,
      needs_owner_review: input.needsOwnerReview,
    };
    const readiness = evaluateAdminProductReadiness(simulatedRow);
    if (!readiness.isPublishReady) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.PUBLISH_NOT_READY,
        { status: readiness.missingReasons },
      );
    }
  }

  const outcome = await updateAdminProductAtomicRepo(
    id,
    input.expectedUpdatedAt,
    {
      name: input.name,
      product_type: input.productType,
      status: input.status,
      short_description: input.shortDescription,
      description: input.description,
      ingredients_info: input.ingredientsInfo,
      storage_instructions: input.storageInstructions,
      is_featured: input.isFeatured,
      is_best_seller: input.isBestSeller,
      is_new: input.isNew,
      needs_owner_review: input.needsOwnerReview,
      sort_order: input.sortOrder,
    },
    ctx,
  );

  if (outcome.status === 'not_found') {
    throw new AdminCatalogNotFoundError();
  }
  if (outcome.status === 'conflict') {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.STALE_CONFLICT,
    );
  }

  return getAdminProductById(profile, id, ctx);
}

export async function archiveAdminProduct(
  profile: AdminSessionProfile,
  id: string,
  input: ArchiveAdminEntityInput,
  ctx: AdminRepoContext = {},
): Promise<AdminProductItem> {
  assertOwnerRole(profile);

  const outcome = await updateAdminProductAtomicRepo(
    id,
    input.expectedUpdatedAt,
    { status: 'archived' },
    ctx,
  );

  if (outcome.status === 'not_found') {
    throw new AdminCatalogNotFoundError();
  }
  if (outcome.status === 'conflict') {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.STALE_CONFLICT,
    );
  }

  return getAdminProductById(profile, id, ctx);
}
