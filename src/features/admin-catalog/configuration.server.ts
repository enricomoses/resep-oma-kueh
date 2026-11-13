import 'server-only';

import {
  ADMIN_CATALOG_COPY,
  ADMIN_CATALOG_LIMITS,
} from '@/constants/admin-catalog.constant';
import { AuthForbiddenError } from '@/features/auth/errors.server';
import { createServerAuthClient } from '@/lib/supabase/server';
import type {
  AdminAllergenPresence,
  AdminCatalogStatus,
  AdminCategoryItem,
  AdminDietaryVerificationStatus,
  AdminEditorImage,
  AdminEditorVariant,
  AdminProductBootstrapResponse,
  AdminProductEditorAggregate,
  AdminProductItem,
  AdminProductType,
  AdminReferenceAllergen,
  AdminReferenceComponentVariant,
  AdminReferenceDietaryTag,
  AdminSaveConfigurationResponse,
  AdminVariantStatus,
  SaveProductConfigurationInput,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import type { Json } from '@/types/database';
import { ADMIN_MEDIA_BUCKETS } from '@/utils/admin-media';
import { validateProductConfiguration } from '@/utils/admin-product-editor';

import {
  AdminCatalogConflictError,
  AdminCatalogNotFoundError,
  AdminCatalogUpstreamError,
  AdminCatalogValidationError,
} from './errors.server';
import { revalidatePublicCatalogPaths } from './http.server';
import {
  cleanupOrphanStorageObjects,
  promoteDraftMediaToPublicBucket,
  resolveAdminMediaPreviewUrl,
} from './media.server';
import type { AdminRepoContext } from './repository.server';
import { getAdminProductById, listAdminCategories } from './service.server';

interface RawEditorProductRow {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  ingredients_info: string | null;
  storage_instructions: string | null;
  product_type: string;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new: boolean;
  status: string;
  needs_owner_review: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_categories:
    | {
        category_id: string;
        is_primary: boolean;
      }[]
    | null;
  product_images:
    | {
        id: string;
        variant_id: string | null;
        storage_bucket: string;
        storage_path: string;
        alt_text: string | null;
        is_approved: boolean;
        is_primary: boolean;
        sort_order: number;
      }[]
    | null;
  product_variants:
    | {
        id: string;
        sku: string;
        name: string;
        size_label: string | null;
        base_price_idr: number;
        status: string;
        sort_order: number;
        max_quantity_per_order: number;
        is_default: boolean;
        bundle_units_total: number | null;
        bundle_recipe: string | null;
        bundle_rules_verified: boolean;
        branch_variant_offers:
          { branch_id: string; is_listed: boolean }[] | null;
        bundle_fixed_components:
          | {
              id: string;
              component_variant_id: string;
              component_slot: string;
              quantity: number;
              sort_order: number;
            }[]
          | null;
        option_groups:
          | {
              id: string;
              name: string;
              min_select: number;
              max_select: number;
              quantity_per_selection: number;
              sort_order: number;
              is_required: boolean;
              option_choices:
                | {
                    id: string;
                    label: string;
                    component_variant_id: string | null;
                    price_delta_idr: number;
                    is_active: boolean;
                    sort_order: number;
                  }[]
                | null;
            }[]
          | null;
        variant_dietary_tags:
          | {
              dietary_tag_id: string;
              verification_status: string;
              verified_at: string | null;
            }[]
          | null;
        variant_allergens:
          | {
              allergen_id: string;
              presence: string;
              verified_at: string | null;
            }[]
          | null;
      }[]
    | null;
}

interface RawVariantEvidencePayload {
  dietary?: { dietary_tag_id: string; note: string | null }[];
  allergens?: { allergen_id: string; source_note: string | null }[];
}

function assertOwnerRole(profile: AdminSessionProfile): void {
  if (profile.role !== 'owner') {
    throw new AuthForbiddenError();
  }
}

function withDeadline(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(ADMIN_CATALOG_LIMITS.READ_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

export async function readAdminProductEditorBootstrap(
  profile: AdminSessionProfile,
  ctx: AdminRepoContext = {},
): Promise<AdminProductBootstrapResponse> {
  assertOwnerRole(profile);

  const client = await createServerAuthClient(ctx.response);
  const deadline = withDeadline(ctx.signal);

  const [categoriesRes, dietaryRes, allergensRes, componentVariantsRes] =
    await Promise.all([
      listAdminCategories(profile, ctx),
      client
        .from('dietary_tags')
        .select('id,slug,name,description')
        .order('name', { ascending: true })
        .abortSignal(deadline),
      client
        .from('allergens')
        .select('id,slug,name')
        .order('name', { ascending: true })
        .abortSignal(deadline),
      client
        .from('product_variants')
        .select(
          'id,product_id,sku,name,size_label,base_price_idr,status,products!inner(id,name,slug,status,product_type),variant_dietary_tags(verification_status,dietary_tags(slug)),branch_variant_offers(is_listed)',
        )
        .eq('status', 'active')
        .neq('products.product_type', 'bundle')
        .order('sku', { ascending: true })
        .limit(500)
        .abortSignal(deadline),
    ]);

  if (dietaryRes.error || allergensRes.error || componentVariantsRes.error) {
    throw new AdminCatalogUpstreamError();
  }

  const dietaryTags: AdminReferenceDietaryTag[] = (dietaryRes.data ?? []).map(
    (row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
    }),
  );

  const allergens: AdminReferenceAllergen[] = (allergensRes.data ?? []).map(
    (row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
    }),
  );

  const rawCompVariants = (componentVariantsRes.data ?? []) as unknown as {
    id: string;
    product_id: string;
    sku: string;
    name: string;
    size_label: string | null;
    base_price_idr: number;
    status: string;
    products: {
      id: string;
      name: string;
      slug: string;
      status: string;
      product_type: string;
    };
    variant_dietary_tags:
      | {
          verification_status: string;
          dietary_tags: { slug: string } | null;
        }[]
      | null;
    branch_variant_offers: { is_listed: boolean }[] | null;
  }[];

  const componentVariants: AdminReferenceComponentVariant[] =
    rawCompVariants.map((row) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.products.name,
      productSlug: row.products.slug,
      productStatus: row.products.status as AdminCatalogStatus,
      productType: row.products.product_type as AdminProductType,
      sku: row.sku,
      variantName: row.name,
      sizeLabel: row.size_label,
      basePriceIdr: Number(row.base_price_idr),
      status: row.status as AdminVariantStatus,
      isGlutenFreeVerified: (row.variant_dietary_tags ?? []).some(
        (dt) =>
          dt.verification_status === 'verified' &&
          dt.dietary_tags?.slug === 'gluten-free',
      ),
      listedBranchCount: (row.branch_variant_offers ?? []).filter(
        (o) => o.is_listed,
      ).length,
    }));

  return {
    categories: categoriesRes.items,
    dietaryTags,
    allergens,
    componentVariants,
  };
}

export async function getAdminProductEditorAggregate(
  profile: AdminSessionProfile,
  productId: string,
  ctx: AdminRepoContext = {},
): Promise<AdminProductEditorAggregate> {
  assertOwnerRole(profile);

  const client = await createServerAuthClient(ctx.response);
  const deadline = withDeadline(ctx.signal);

  const [productItem, rawResult, bootstrap] = await Promise.all([
    getAdminProductById(profile, productId, ctx),
    client
      .from('products')
      .select(
        'id,name,slug,short_description,description,ingredients_info,storage_instructions,product_type,is_featured,is_best_seller,is_new,status,needs_owner_review,sort_order,created_at,updated_at,product_categories(category_id,is_primary),product_images(id,variant_id,storage_bucket,storage_path,alt_text,is_approved,is_primary,sort_order),product_variants(id,sku,name,size_label,base_price_idr,status,sort_order,max_quantity_per_order,is_default,bundle_units_total,bundle_recipe,bundle_rules_verified,branch_variant_offers(branch_id,is_listed),bundle_fixed_components!bundle_fixed_components_bundle_variant_id_fkey(id,component_variant_id,component_slot,quantity,sort_order),option_groups(id,name,min_select,max_select,quantity_per_selection,sort_order,is_required,option_choices(id,label,component_variant_id,price_delta_idr,is_active,sort_order)),variant_dietary_tags(dietary_tag_id,verification_status,verified_at),variant_allergens(allergen_id,presence,verified_at))',
      )
      .eq('id', productId)
      .abortSignal(deadline)
      .maybeSingle(),
    readAdminProductEditorBootstrap(profile, ctx),
  ]);

  if (rawResult.error) {
    throw new AdminCatalogUpstreamError();
  }
  if (!rawResult.data) {
    throw new AdminCatalogNotFoundError();
  }

  const raw = rawResult.data as unknown as RawEditorProductRow;

  const rawVariants = [...(raw.product_variants ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  // Read private owner evidence (variant_dietary_tags.note & variant_allergens.source_note) via secured RPC
  const evidenceEntries = await Promise.all(
    rawVariants.map(async (v) => {
      const { data, error } = await client.rpc('read_owner_variant_evidence', {
        variant_uuid: v.id,
      });
      if (error) {
        throw new AdminCatalogUpstreamError();
      }
      return [v.id, (data ?? {}) as RawVariantEvidencePayload] as const;
    }),
  );
  const evidenceByVariantId = new Map(evidenceEntries);

  const variants: AdminEditorVariant[] = rawVariants.map((v) => {
    const evidence = evidenceByVariantId.get(v.id);
    const dietaryNoteMap = new Map(
      (evidence?.dietary ?? []).map((d) => [d.dietary_tag_id, d.note]),
    );
    const allergenNoteMap = new Map(
      (evidence?.allergens ?? []).map((a) => [a.allergen_id, a.source_note]),
    );

    return {
      id: v.id,
      sku: v.sku,
      name: v.name,
      sizeLabel: v.size_label,
      basePriceIdr: Number(v.base_price_idr),
      status: v.status as AdminVariantStatus,
      sortOrder: v.sort_order,
      maxQuantityPerOrder: v.max_quantity_per_order,
      isDefault: v.is_default,
      bundleRecipe: v.bundle_recipe === 'chiffon_mix' ? 'chiffon_mix' : null,
      bundleUnitsTotal: v.bundle_units_total,
      bundleRulesVerified: v.bundle_rules_verified,
      branchOfferCount: (v.branch_variant_offers ?? []).filter(
        (o) => o.is_listed,
      ).length,
      fixedComponents: [...(v.bundle_fixed_components ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((fc) => ({
          id: fc.id,
          componentVariantId: fc.component_variant_id,
          componentSlot: fc.component_slot as 'cheese' | 'choco',
          quantity: fc.quantity,
          sortOrder: fc.sort_order,
        })),
      optionGroups: [...(v.option_groups ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((og) => ({
          id: og.id,
          name: og.name,
          minSelect: og.min_select,
          maxSelect: og.max_select,
          quantityPerSelection: og.quantity_per_selection,
          sortOrder: og.sort_order,
          isRequired: og.is_required,
          choices: [...(og.option_choices ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .filter((ch) => Boolean(ch.component_variant_id))
            .map((ch) => ({
              id: ch.id,
              label: ch.label,
              componentVariantId: ch.component_variant_id as string,
              priceDeltaIdr: Number(ch.price_delta_idr),
              isActive: ch.is_active,
              sortOrder: ch.sort_order,
            })),
        })),
      dietaryTags: (v.variant_dietary_tags ?? []).map((dt) => ({
        dietaryTagId: dt.dietary_tag_id,
        verificationStatus:
          dt.verification_status as AdminDietaryVerificationStatus,
        verifiedAt: dt.verified_at,
        note: dietaryNoteMap.get(dt.dietary_tag_id) ?? null,
      })),
      allergens: (v.variant_allergens ?? []).map((al) => ({
        allergenId: al.allergen_id,
        presence: al.presence as AdminAllergenPresence,
        sourceNote: allergenNoteMap.get(al.allergen_id) ?? null,
        verifiedAt: al.verified_at,
      })),
    };
  });

  const sortedRawImages = [...(raw.product_images ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });

  const images: AdminEditorImage[] = await Promise.all(
    sortedRawImages.map(async (img) => ({
      id: img.id,
      variantId: img.variant_id,
      storageBucket:
        img.storage_bucket === ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES
          ? ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES
          : ADMIN_MEDIA_BUCKETS.DRAFTS,
      storagePath: img.storage_path,
      altText: img.alt_text,
      isApproved: img.is_approved,
      isPrimary: img.is_primary,
      sortOrder: img.sort_order,
      previewUrl: await resolveAdminMediaPreviewUrl(
        img.storage_bucket,
        img.storage_path,
        ctx,
      ),
    })),
  );

  return {
    product: {
      ...productItem,
      shortDescription: raw.short_description,
      description: raw.description,
      ingredientsInfo: raw.ingredients_info,
      storageInstructions: raw.storage_instructions,
    },
    categories: (raw.product_categories ?? []).map((pc) => ({
      categoryId: pc.category_id,
      isPrimary: pc.is_primary,
    })),
    variants,
    images,
    referenceData: bootstrap,
  };
}

function mapRpcConfigurationError(error: {
  code?: string | null;
  message?: string | null;
}): never {
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (code === 'P0002' || message.includes('product_not_found')) {
    throw new AdminCatalogNotFoundError();
  }
  if (code === '40900' || message.includes('stale_conflict')) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.STALE_CONFLICT,
      {
        expectedUpdatedAt: [ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.STALE_CONFLICT],
      },
    );
  }
  if (code === '42501') {
    throw new AuthForbiddenError();
  }
  if (code === '23505') {
    if (message.includes('sku')) {
      throw new AdminCatalogConflictError(
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.DUPLICATE_SKU,
        { variants: [ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.DUPLICATE_SKU] },
      );
    }
    if (message.includes('default_variant')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SINGLE_DEFAULT_VARIANT,
        {
          variants: [
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SINGLE_DEFAULT_VARIANT,
          ],
        },
      );
    }
    if (message.includes('primary_category')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SINGLE_PRIMARY_CATEGORY,
        {
          categories: [
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SINGLE_PRIMARY_CATEGORY,
          ],
        },
      );
    }
    if (message.includes('primary_image')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SINGLE_PRIMARY_IMAGE,
        {
          images: [
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SINGLE_PRIMARY_IMAGE,
          ],
        },
      );
    }
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.SLUG_COLLISION,
    );
  }
  if (code === '23514' || code === '22023') {
    if (message.includes('identity_is_immutable')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SKU_IMMUTABLE,
        { variants: [ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.SKU_IMMUTABLE] },
      );
    }
    if (message.includes('variant_referenced_by_bundle')) {
      throw new AdminCatalogConflictError(
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.VARIANT_REFERENCED_BY_BUNDLE,
        {
          variants: [
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS
              .VARIANT_REFERENCED_BY_BUNDLE,
          ],
        },
      );
    }
    if (message.includes('variant_archive_required')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.VARIANT_ARCHIVE_REQUIRED,
        {
          variants: [
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.VARIANT_ARCHIVE_REQUIRED,
          ],
        },
      );
    }
    if (message.includes('bundle_component_gf_unverified')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.GF_COMPONENT_UNVERIFIED,
        {
          variants: [
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.GF_COMPONENT_UNVERIFIED,
          ],
        },
      );
    }
    if (
      message.includes('invalid_chiffon_recipe') ||
      message.includes('invalid_bundle_component') ||
      message.includes('variant_bundle_shape') ||
      message.includes('option_parent_not_bundle')
    ) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.INVALID_BUNDLE_UNITS,
        {
          variants: [
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.INVALID_BUNDLE_UNITS,
          ],
        },
      );
    }
    if (message.includes('dietary_verified_requires_evidence')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.DIETARY_EVIDENCE_REQUIRED,
        {
          variants: [
            ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.DIETARY_EVIDENCE_REQUIRED,
          ],
        },
      );
    }
    if (message.includes('bundle_component_not_offered')) {
      throw new AdminCatalogValidationError(
        'Komponen paket harus berstatus aktif pada produk terpublikasi dan tersedia di seluruh cabang paket.',
        {
          variants: [
            'Komponen paket harus berstatus aktif pada produk terpublikasi dan tersedia di seluruh cabang paket.',
          ],
        },
      );
    }
    if (message.includes('product_not_publish_ready')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.PUBLISH_NOT_READY,
        {
          'product.status': [
            ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.PUBLISH_NOT_READY,
          ],
        },
      );
    }
    throw new AdminCatalogValidationError();
  }
  if (code === '23503') {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.FOREIGN_OR_INVALID_COMPONENT,
      {
        variants: [
          ADMIN_CATALOG_COPY.PRODUCT_EDITOR.ERRORS.FOREIGN_OR_INVALID_COMPONENT,
        ],
      },
    );
  }

  throw new AdminCatalogUpstreamError();
}

export async function saveAdminProductConfiguration(
  profile: AdminSessionProfile,
  productId: string,
  input: SaveProductConfigurationInput,
  ctx: AdminRepoContext = {},
): Promise<AdminSaveConfigurationResponse> {
  assertOwnerRole(profile);

  const client = await createServerAuthClient(ctx.response);
  const deadline = withDeadline(ctx.signal);

  const [bootstrap, existingProductResult] = await Promise.all([
    readAdminProductEditorBootstrap(profile, ctx),
    client
      .from('products')
      .select(
        'id,updated_at,product_variants(id,sku),product_images(storage_bucket,storage_path)',
      )
      .eq('id', productId)
      .abortSignal(deadline)
      .maybeSingle(),
  ]);

  if (existingProductResult.error) {
    throw new AdminCatalogUpstreamError();
  }
  if (!existingProductResult.data) {
    throw new AdminCatalogNotFoundError();
  }

  const existingRow = existingProductResult.data as {
    id: string;
    updated_at: string;
    product_variants: { id: string; sku: string }[] | null;
    product_images: { storage_bucket: string; storage_path: string }[] | null;
  };

  if (existingRow.updated_at !== input.expectedUpdatedAt) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.STALE_CONFLICT,
      {
        expectedUpdatedAt: [ADMIN_CATALOG_COPY.PRODUCTS.ERRORS.STALE_CONFLICT],
      },
    );
  }

  const categoriesById = new Map<
    string,
    Pick<AdminCategoryItem, 'id' | 'status' | 'name'>
  >(bootstrap.categories.map((c) => [c.id, c]));
  const dietaryTagsById = new Map(
    bootstrap.dietaryTags.map((dt) => [dt.id, dt]),
  );
  const componentVariantsById = new Map(
    bootstrap.componentVariants.map((cv) => [cv.id, cv]),
  );
  const existingVariantSkusById = new Map(
    (existingRow.product_variants ?? []).map((v) => [v.id, v.sku]),
  );

  // Step 1: Validate logical & domain configuration BEFORE any media promotion or RPC call
  const preFieldErrors = validateProductConfiguration(input, {
    productId,
    categoriesById,
    dietaryTagsById,
    componentVariantsById,
    existingVariantSkusById,
    requireApprovedBucketWhenApproved: false,
  });

  if (Object.keys(preFieldErrors).length > 0) {
    throw new AdminCatalogValidationError(
      'Periksa kembali konfigurasi produk sebelum menyimpan.',
      preFieldErrors,
    );
  }

  // Step 2: Promote newly approved draft images to public `product-images` bucket,
  // tracking every created public path for controlled rollback cleanup if RPC fails.
  const newlyPromotedTargets: {
    storageBucket: string;
    storagePath: string;
  }[] = [];

  let promotedImages: SaveProductConfigurationInput['images'];
  try {
    promotedImages = await Promise.all(
      input.images.map(async (img) => {
        if (
          img.isApproved &&
          img.storageBucket === ADMIN_MEDIA_BUCKETS.DRAFTS
        ) {
          const promoted = await promoteDraftMediaToPublicBucket(
            profile,
            img.storagePath,
            ctx,
          );
          newlyPromotedTargets.push(promoted);
          return {
            ...img,
            storageBucket: promoted.storageBucket,
            storagePath: promoted.storagePath,
          };
        }
        return img;
      }),
    );
  } catch (err) {
    await cleanupOrphanStorageObjects(
      profile,
      newlyPromotedTargets,
      'config_save_rollback',
      ctx,
    );
    throw err;
  }

  const promotedPayload: SaveProductConfigurationInput = {
    ...input,
    images: promotedImages,
  };

  // Re-verify post-promotion invariants (approved images must now target product-images)
  const postFieldErrors = validateProductConfiguration(promotedPayload, {
    productId,
    categoriesById,
    dietaryTagsById,
    componentVariantsById,
    existingVariantSkusById,
    requireApprovedBucketWhenApproved: true,
  });
  if (Object.keys(postFieldErrors).length > 0) {
    await cleanupOrphanStorageObjects(
      profile,
      newlyPromotedTargets,
      'config_save_rollback',
      ctx,
    );
    throw new AdminCatalogValidationError(
      'Konfigurasi foto tidak valid setelah promosi media.',
      postFieldErrors,
    );
  }

  // Step 3: Execute transactional aggregate RPC
  const { data: rpcData, error: rpcError } = await client.rpc(
    'save_product_configuration',
    {
      p_product_id: productId,
      p_expected_updated_at: input.expectedUpdatedAt,
      p_payload: {
        product: promotedPayload.product,
        categories: promotedPayload.categories,
        variants: promotedPayload.variants,
        images: promotedPayload.images,
      } as unknown as Json,
    },
  );

  if (rpcError || !rpcData) {
    await cleanupOrphanStorageObjects(
      profile,
      newlyPromotedTargets,
      'config_save_rollback',
      ctx,
    );
    mapRpcConfigurationError(rpcError ?? {});
  }

  // Step 4: Cleanup any previously linked draft/public images removed in this configuration save
  const remainingPaths = new Set(
    promotedPayload.images.map((i) => `${i.storageBucket}:${i.storagePath}`),
  );
  const removedTargets = (existingRow.product_images ?? [])
    .filter(
      (oldImg) =>
        !remainingPaths.has(`${oldImg.storage_bucket}:${oldImg.storage_path}`),
    )
    .map((oldImg) => ({
      storageBucket: oldImg.storage_bucket,
      storagePath: oldImg.storage_path,
    }));

  if (removedTargets.length > 0) {
    await cleanupOrphanStorageObjects(
      profile,
      removedTargets,
      'removed_from_product',
      ctx,
    );
  }

  revalidatePublicCatalogPaths();

  const saved = rpcData as { productId?: string; updatedAt?: string };
  const freshEditor = await getAdminProductEditorAggregate(
    profile,
    productId,
    ctx,
  );

  return {
    productId: saved.productId ?? productId,
    updatedAt: saved.updatedAt ?? freshEditor.product.updatedAt,
    editor: freshEditor,
  };
}

export async function getAdminProductWithOptionalEditor(
  profile: AdminSessionProfile,
  productId: string,
  includeEditor: boolean,
  ctx: AdminRepoContext = {},
): Promise<{
  product: AdminProductItem;
  editor?: AdminProductEditorAggregate;
}> {
  if (!includeEditor) {
    const product = await getAdminProductById(profile, productId, ctx);
    return { product };
  }
  const editor = await getAdminProductEditorAggregate(profile, productId, ctx);
  return {
    product: editor.product,
    editor,
  };
}
