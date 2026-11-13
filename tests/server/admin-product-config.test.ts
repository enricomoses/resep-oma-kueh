import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST as uploadMediaRoute } from '@/app/api/admin/media/upload/route';
import { PUT as saveConfigurationRoute } from '@/app/api/admin/products/[id]/configuration/route';
import { GET as getProductRoute } from '@/app/api/admin/products/[id]/route';
import { GET as bootstrapRoute } from '@/app/api/admin/products/editor-bootstrap/route';

const OWNER_ID = 'f1700000-0000-4000-8000-000000000001';
const STAFF_ID = 'f1700000-0000-4000-8000-000000000002';
const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const CAT_PUB_ID = 'c1700000-0000-4000-8000-000000000001';
const PROD_SIMPLE_ID = 'a1700000-0000-4000-8000-000000000001';
const PROD_BUNDLE_ID = 'a1700000-0000-4000-8000-000000000002';
const PROD_SHARED_REF_ID = 'a1700000-0000-4000-8000-000000000003';
const VAR_SIMPLE_ID = 'b1700000-0000-4000-8000-000000000001';
const VAR_COMP_CHEESE = 'b1700000-0000-4000-8000-000000000101';
const VAR_COMP_CHOCO = 'b1700000-0000-4000-8000-000000000102';
const VAR_COMP_PANDAN_NOGF = 'b1700000-0000-4000-8000-000000000103';
const VAR_COMP_MOCHA = 'b1700000-0000-4000-8000-000000000104';
const GF_TAG_ID = 'd1700000-0000-4000-8000-000000000001';
const EGG_ALLERGEN_ID = 'e1700000-0000-4000-8000-000000000001';
const EXISTING_APPROVED_PATH =
  'approved/f1700000-0000-4000-8000-000000000999.png';

interface StoredProductRecord {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  ingredients_info: string | null;
  storage_instructions: string | null;
  product_type: 'simple' | 'variants' | 'bundle';
  is_featured: boolean;
  is_best_seller: boolean;
  is_new: boolean;
  status: 'draft' | 'published' | 'archived';
  needs_owner_review: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  categories: { category_id: string; is_primary: boolean }[];
  variants: {
    id: string;
    sku: string;
    name: string;
    size_label: string | null;
    base_price_idr: number;
    status: 'draft' | 'active' | 'archived';
    sort_order: number;
    max_quantity_per_order: number;
    is_default: boolean;
    bundle_units_total: number | null;
    bundle_recipe: 'chiffon_mix' | null;
    bundle_rules_verified: boolean;
    fixedComponents: {
      id: string;
      component_variant_id: string;
      component_slot: 'cheese' | 'choco';
      quantity: number;
      sort_order: number;
    }[];
    optionGroups: {
      id: string;
      name: string;
      min_select: number;
      max_select: number;
      quantity_per_selection: number;
      sort_order: number;
      is_required: boolean;
      choices: {
        id: string;
        label: string;
        component_variant_id: string;
        price_delta_idr: number;
        is_active: boolean;
        sort_order: number;
      }[];
    }[];
    dietaryTags: {
      dietary_tag_id: string;
      verification_status: 'pending' | 'verified';
      verified_at: string | null;
      note: string | null;
    }[];
    allergens: {
      allergen_id: string;
      presence: 'contains' | 'may_contain' | 'not_declared';
      source_note: string | null;
      verified_at: string | null;
    }[];
    offers: { branch_id: string; is_listed: boolean }[];
  }[];
  images: {
    id: string;
    variant_id: string | null;
    storage_bucket: 'media-drafts' | 'product-images';
    storage_path: string;
    alt_text: string | null;
    is_approved: boolean;
    is_primary: boolean;
    sort_order: number;
  }[];
}

const dbState = {
  userId: OWNER_ID as string | null,
  role: 'owner' as 'owner' | 'branch_admin' | null,
  forceRpcError: null as { code: string; message: string } | null,
  products: new Map<string, StoredProductRecord>(),
  storageBuckets: {
    'media-drafts': new Map<string, Uint8Array>(),
    'product-images': new Map<string, Uint8Array>(),
  },
  removedStorageLog: [] as { bucket: string; path: string }[],
};

function resetDbState() {
  dbState.userId = OWNER_ID;
  dbState.role = 'owner';
  dbState.forceRpcError = null;
  dbState.removedStorageLog = [];
  dbState.storageBuckets['media-drafts'].clear();
  dbState.storageBuckets['product-images'].clear();
  dbState.storageBuckets['product-images'].set(
    EXISTING_APPROVED_PATH,
    Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );

  dbState.products.clear();
  dbState.products.set(PROD_SIMPLE_ID, {
    id: PROD_SIMPLE_ID,
    name: 'Chiffon Cheese Original',
    slug: 'chiffon-cheese-original',
    short_description: 'Ringkasan keju.',
    description: 'Kue keju panggang.',
    ingredients_info: null,
    storage_instructions: null,
    product_type: 'simple',
    is_featured: false,
    is_best_seller: false,
    is_new: false,
    status: 'draft',
    needs_owner_review: true,
    sort_order: 10,
    created_at: '2026-11-11T00:00:00.000Z',
    updated_at: '2026-11-12T00:00:00.000Z',
    categories: [{ category_id: CAT_PUB_ID, is_primary: true }],
    variants: [
      {
        id: VAR_SIMPLE_ID,
        sku: 'ROK-CHS-20',
        name: '20 cm',
        size_label: '20 cm',
        base_price_idr: 135_000,
        status: 'active',
        sort_order: 10,
        max_quantity_per_order: 99,
        is_default: true,
        bundle_units_total: null,
        bundle_recipe: null,
        bundle_rules_verified: false,
        fixedComponents: [],
        optionGroups: [],
        dietaryTags: [],
        allergens: [],
        offers: [{ branch_id: SURABAYA_ID, is_listed: true }],
      },
    ],
    images: [
      {
        id: 'e2700000-0000-4000-8000-000000000001',
        variant_id: null,
        storage_bucket: 'product-images',
        storage_path: EXISTING_APPROVED_PATH,
        alt_text: 'Foto existing keju',
        is_approved: true,
        is_primary: true,
        sort_order: 10,
      },
    ],
  });

  dbState.products.set(PROD_SHARED_REF_ID, {
    id: PROD_SHARED_REF_ID,
    name: 'Produk Pembanding',
    slug: 'produk-pembanding',
    short_description: null,
    description: null,
    ingredients_info: null,
    storage_instructions: null,
    product_type: 'simple',
    is_featured: false,
    is_best_seller: false,
    is_new: false,
    status: 'published',
    needs_owner_review: false,
    sort_order: 20,
    created_at: '2026-11-11T00:00:00.000Z',
    updated_at: '2026-11-12T00:00:00.000Z',
    categories: [{ category_id: CAT_PUB_ID, is_primary: true }],
    variants: [],
    images: [
      {
        id: 'e2700000-0000-4000-8000-000000000002',
        variant_id: null,
        storage_bucket: 'product-images',
        storage_path: EXISTING_APPROVED_PATH,
        alt_text: 'Shared reference photo',
        is_approved: true,
        is_primary: true,
        sort_order: 10,
      },
    ],
  });

  dbState.products.set(PROD_BUNDLE_ID, {
    id: PROD_BUNDLE_ID,
    name: 'Mix 12 Slice Paket',
    slug: 'mix-12-slice-paket',
    short_description: null,
    description: null,
    ingredients_info: null,
    storage_instructions: null,
    product_type: 'bundle',
    is_featured: false,
    is_best_seller: false,
    is_new: false,
    status: 'draft',
    needs_owner_review: true,
    sort_order: 30,
    created_at: '2026-11-11T00:00:00.000Z',
    updated_at: '2026-11-12T00:00:00.000Z',
    categories: [{ category_id: CAT_PUB_ID, is_primary: true }],
    variants: [
      {
        id: 'b1700000-0000-4000-8000-000000000002',
        sku: 'ROK-MIX-12',
        name: 'Box 12 Slice',
        size_label: '12 potong',
        base_price_idr: 195_000,
        status: 'active',
        sort_order: 10,
        max_quantity_per_order: 20,
        is_default: true,
        bundle_units_total: 12,
        bundle_recipe: 'chiffon_mix',
        bundle_rules_verified: true,
        fixedComponents: [],
        optionGroups: [],
        dietaryTags: [],
        allergens: [],
        offers: [{ branch_id: SURABAYA_ID, is_listed: true }],
      },
    ],
    images: [],
  });
}

function projectAdminProductRow(p: StoredProductRecord) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    short_description: p.short_description,
    description: p.description,
    ingredients_info: p.ingredients_info,
    storage_instructions: p.storage_instructions,
    product_type: p.product_type,
    is_featured: p.is_featured,
    is_best_seller: p.is_best_seller,
    is_new: p.is_new,
    status: p.status,
    needs_owner_review: p.needs_owner_review,
    sort_order: p.sort_order,
    created_at: p.created_at,
    updated_at: p.updated_at,
    product_categories: p.categories.map((c) => ({
      category_id: c.category_id,
      is_primary: c.is_primary,
      categories: {
        id: CAT_PUB_ID,
        name: 'Chiffon Cake',
        slug: 'chiffon-cake',
        status: 'published',
      },
    })),
    product_images: p.images.map((img) => ({
      id: img.id,
      variant_id: img.variant_id,
      storage_bucket: img.storage_bucket,
      storage_path: img.storage_path,
      alt_text: img.alt_text,
      is_approved: img.is_approved,
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    })),
    product_variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      size_label: v.size_label,
      base_price_idr: v.base_price_idr,
      status: v.status,
      sort_order: v.sort_order,
      max_quantity_per_order: v.max_quantity_per_order,
      is_default: v.is_default,
      bundle_units_total: v.bundle_units_total,
      bundle_recipe: v.bundle_recipe,
      bundle_rules_verified: v.bundle_rules_verified,
      branch_variant_offers: v.offers.map((o) => ({
        branch_id: o.branch_id,
        is_listed: o.is_listed,
        branches: { is_active: true },
      })),
      bundle_fixed_components: v.fixedComponents,
      option_groups: v.optionGroups.map((g) => ({
        ...g,
        option_choices: g.choices,
      })),
      variant_dietary_tags: v.dietaryTags.map((t) => ({
        dietary_tag_id: t.dietary_tag_id,
        verification_status: t.verification_status,
        verified_at: t.verified_at,
      })),
      variant_allergens: v.allergens.map((a) => ({
        allergen_id: a.allergen_id,
        presence: a.presence,
        verified_at: a.verified_at,
      })),
    })),
  };
}

vi.mock('@/lib/supabase/server', () => {
  return {
    createServerAuthClient: vi.fn(async () => ({
      auth: {
        getClaims: async () => ({
          data: dbState.userId ? { claims: { sub: dbState.userId } } : null,
          error: null,
        }),
        getUser: async () => ({
          data: {
            user: dbState.userId
              ? { id: dbState.userId, email: 'owner@resepomakueh.id' }
              : null,
          },
          error: null,
        }),
      },
      storage: {
        from: (bucket: 'media-drafts' | 'product-images') => ({
          upload: async (path: string, body: Uint8Array) => {
            const store = dbState.storageBuckets[bucket];
            if (store.has(path)) {
              return { data: null, error: { message: 'already_exists' } };
            }
            store.set(path, body);
            return { data: { path }, error: null };
          },
          createSignedUrl: async (path: string) => ({
            data: {
              signedUrl: `https://storage.local/signed/${bucket}/${path}`,
            },
            error: null,
          }),
          getPublicUrl: (path: string) => ({
            data: {
              publicUrl: `https://storage.local/public/${bucket}/${path}`,
            },
          }),
          download: async (path: string) => {
            const bytes = dbState.storageBuckets[bucket].get(path);
            if (!bytes) {
              return { data: null, error: { message: 'not_found' } };
            }
            return {
              data: new Blob([new Uint8Array(bytes)]),
              error: null,
            };
          },
          remove: async (paths: string[]) => {
            const store = dbState.storageBuckets[bucket];
            for (const p of paths) {
              store.delete(p);
              dbState.removedStorageLog.push({ bucket, path: p });
            }
            return { data: paths, error: null };
          },
        }),
      },
      rpc: async (fnName: string, args: Record<string, unknown>) => {
        if (fnName === 'read_owner_variant_evidence') {
          const variantUuid = args.variant_uuid as string;
          for (const product of dbState.products.values()) {
            const v = product.variants.find((item) => item.id === variantUuid);
            if (v) {
              return {
                data: {
                  dietary: v.dietaryTags.map((t) => ({
                    dietary_tag_id: t.dietary_tag_id,
                    note: t.note,
                  })),
                  allergens: v.allergens.map((a) => ({
                    allergen_id: a.allergen_id,
                    source_note: a.source_note,
                  })),
                },
                error: null,
              };
            }
          }
          return { data: { dietary: [], allergens: [] }, error: null };
        }

        if (fnName === 'save_product_configuration') {
          if (dbState.forceRpcError) {
            return { data: null, error: dbState.forceRpcError };
          }
          const productId = args.p_product_id as string;
          const expectedUpdatedAt = args.p_expected_updated_at as string;
          const payload = args.p_payload as {
            product: {
              name: string;
              productType: 'simple' | 'variants' | 'bundle';
              status: 'draft' | 'published' | 'archived';
              shortDescription: string | null;
              description: string | null;
              ingredientsInfo: string | null;
              storageInstructions: string | null;
              isFeatured: boolean;
              isBestSeller: boolean;
              isNew: boolean;
              needsOwnerReview: boolean;
              sortOrder: number;
            };
            categories: { categoryId: string; isPrimary: boolean }[];
            variants: {
              id: string;
              sku: string;
              name: string;
              sizeLabel: string | null;
              basePriceIdr: number;
              status: 'draft' | 'active' | 'archived';
              sortOrder: number;
              maxQuantityPerOrder: number;
              isDefault: boolean;
              bundleRecipe: 'chiffon_mix' | null;
              bundleUnitsTotal: number | null;
              bundleRulesVerified: boolean;
              fixedComponents: {
                id: string;
                componentVariantId: string;
                componentSlot: 'cheese' | 'choco';
                quantity: number;
                sortOrder: number;
              }[];
              optionGroups: {
                id: string;
                name: string;
                minSelect: number;
                maxSelect: number;
                quantityPerSelection: number;
                sortOrder: number;
                isRequired: boolean;
                choices: {
                  id: string;
                  label: string;
                  componentVariantId: string;
                  priceDeltaIdr: number;
                  isActive: boolean;
                  sortOrder: number;
                }[];
              }[];
              dietaryTags: {
                dietaryTagId: string;
                verificationStatus: 'pending' | 'verified';
                verifiedAt: string | null;
                note: string | null;
              }[];
              allergens: {
                allergenId: string;
                presence: 'contains' | 'may_contain' | 'not_declared';
                sourceNote: string | null;
                verifiedAt: string | null;
              }[];
            }[];
            images: {
              id: string;
              variantId: string | null;
              storageBucket: 'media-drafts' | 'product-images';
              storagePath: string;
              altText: string | null;
              isApproved: boolean;
              isPrimary: boolean;
              sortOrder: number;
            }[];
          };

          const current = dbState.products.get(productId);
          if (!current) {
            return {
              data: null,
              error: { code: 'P0002', message: 'product_not_found' },
            };
          }
          if (current.updated_at !== expectedUpdatedAt) {
            return {
              data: null,
              error: { code: '40900', message: 'stale_conflict' },
            };
          }

          const newUpdatedAt = '2026-11-13T10:00:00.000Z';
          current.name = payload.product.name;
          current.product_type = payload.product.productType;
          current.status = payload.product.status;
          current.short_description = payload.product.shortDescription;
          current.description = payload.product.description;
          current.ingredients_info = payload.product.ingredientsInfo;
          current.storage_instructions = payload.product.storageInstructions;
          current.is_featured = payload.product.isFeatured;
          current.is_best_seller = payload.product.isBestSeller;
          current.is_new = payload.product.isNew;
          current.needs_owner_review = payload.product.needsOwnerReview;
          current.sort_order = payload.product.sortOrder;
          current.updated_at = newUpdatedAt;
          current.categories = payload.categories.map((c) => ({
            category_id: c.categoryId,
            is_primary: c.isPrimary,
          }));
          current.variants = payload.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            name: v.name,
            size_label: v.sizeLabel,
            base_price_idr: v.basePriceIdr,
            status: v.status,
            sort_order: v.sortOrder,
            max_quantity_per_order: v.maxQuantityPerOrder,
            is_default: v.isDefault,
            bundle_units_total: v.bundleUnitsTotal,
            bundle_recipe: v.bundleRecipe,
            bundle_rules_verified: v.bundleRulesVerified,
            fixedComponents: v.fixedComponents.map((f) => ({
              id: f.id,
              component_variant_id: f.componentVariantId,
              component_slot: f.componentSlot,
              quantity: f.quantity,
              sort_order: f.sortOrder,
            })),
            optionGroups: v.optionGroups.map((g) => ({
              id: g.id,
              name: g.name,
              min_select: g.minSelect,
              max_select: g.maxSelect,
              quantity_per_selection: g.quantityPerSelection,
              sort_order: g.sortOrder,
              is_required: g.isRequired,
              choices: g.choices.map((ch) => ({
                id: ch.id,
                label: ch.label,
                component_variant_id: ch.componentVariantId,
                price_delta_idr: ch.priceDeltaIdr,
                is_active: ch.isActive,
                sort_order: ch.sortOrder,
              })),
            })),
            dietaryTags: v.dietaryTags.map((t) => ({
              dietary_tag_id: t.dietaryTagId,
              verification_status: t.verificationStatus,
              verified_at: t.verifiedAt,
              note: t.note,
            })),
            allergens: v.allergens.map((a) => ({
              allergen_id: a.allergenId,
              presence: a.presence,
              source_note: a.sourceNote,
              verified_at: a.verifiedAt,
            })),
            offers: current.variants.find((old) => old.id === v.id)?.offers ?? [
              { branch_id: SURABAYA_ID, is_listed: true },
            ],
          }));
          current.images = payload.images.map((i) => ({
            id: i.id,
            variant_id: i.variantId,
            storage_bucket: i.storageBucket,
            storage_path: i.storagePath,
            alt_text: i.altText,
            is_approved: i.isApproved,
            is_primary: i.isPrimary,
            sort_order: i.sortOrder,
          }));

          return {
            data: { productId, updatedAt: newUpdatedAt },
            error: null,
          };
        }

        return { data: null, error: null };
      },
      from: (table: string) => {
        const filters: Record<string, unknown> = {};
        let isHeadCount = false;

        const builder = {
          select: (
            _cols?: string,
            opts?: { count?: string; head?: boolean },
          ) => {
            if (opts?.head) isHeadCount = true;
            return builder;
          },
          eq: (col: string, val: unknown) => {
            filters[col] = val;
            return builder;
          },
          neq: () => builder,
          order: () => builder,
          limit: () => builder,
          abortSignal: () => builder,
          then: (
            resolve: (val: {
              data?: unknown;
              count?: number;
              error: unknown;
            }) => void,
          ) => {
            if (isHeadCount && table === 'product_images') {
              const targetBucket = filters.storage_bucket as string;
              const targetPath = filters.storage_path as string;
              let count = 0;
              for (const p of dbState.products.values()) {
                for (const img of p.images) {
                  if (
                    img.storage_bucket === targetBucket &&
                    img.storage_path === targetPath
                  ) {
                    count += 1;
                  }
                }
              }
              return resolve({ count, error: null });
            }

            if (table === 'categories') {
              return resolve({
                data: [
                  {
                    id: CAT_PUB_ID,
                    name: 'Chiffon Cake',
                    slug: 'chiffon-cake',
                    parent_id: null,
                    description: null,
                    cover_image_path: null,
                    sort_order: 10,
                    status: 'published',
                    created_at: '2026-11-11T00:00:00Z',
                    updated_at: '2026-11-11T00:00:00Z',
                  },
                ],
                error: null,
              });
            }

            if (table === 'product_categories') {
              return resolve({
                data: [{ category_id: CAT_PUB_ID, product_id: PROD_SIMPLE_ID }],
                error: null,
              });
            }

            if (table === 'dietary_tags') {
              return resolve({
                data: [
                  {
                    id: GF_TAG_ID,
                    slug: 'gluten-free',
                    name: 'Gluten-Free',
                    description: 'Teruji bebas gluten',
                  },
                ],
                error: null,
              });
            }

            if (table === 'allergens') {
              return resolve({
                data: [{ id: EGG_ALLERGEN_ID, slug: 'egg', name: 'Telur' }],
                error: null,
              });
            }

            if (table === 'product_variants') {
              return resolve({
                data: [
                  {
                    id: VAR_COMP_CHEESE,
                    product_id: 'c0000000-0000-4000-8000-000000000101',
                    sku: 'COMP-CHEESE',
                    name: 'Cheese Slice',
                    size_label: '3 pcs',
                    base_price_idr: 30_000,
                    status: 'active',
                    products: {
                      id: 'c0000000-0000-4000-8000-000000000101',
                      name: 'Chiffon Cheese',
                      slug: 'chiffon-cheese',
                      status: 'published',
                      product_type: 'simple',
                    },
                    variant_dietary_tags: [
                      {
                        verification_status: 'verified',
                        dietary_tags: { slug: 'gluten-free' },
                      },
                    ],
                    branch_variant_offers: [{ is_listed: true }],
                  },
                  {
                    id: VAR_COMP_CHOCO,
                    product_id: 'c0000000-0000-4000-8000-000000000102',
                    sku: 'COMP-CHOCO',
                    name: 'Choco Slice',
                    size_label: '3 pcs',
                    base_price_idr: 30_000,
                    status: 'active',
                    products: {
                      id: 'c0000000-0000-4000-8000-000000000102',
                      name: 'Chiffon Choco',
                      slug: 'chiffon-choco',
                      status: 'published',
                      product_type: 'simple',
                    },
                    variant_dietary_tags: [
                      {
                        verification_status: 'verified',
                        dietary_tags: { slug: 'gluten-free' },
                      },
                    ],
                    branch_variant_offers: [{ is_listed: true }],
                  },
                  {
                    id: VAR_COMP_PANDAN_NOGF,
                    product_id: 'c0000000-0000-4000-8000-000000000103',
                    sku: 'COMP-PANDAN',
                    name: 'Pandan Regular',
                    size_label: '3 pcs',
                    base_price_idr: 30_000,
                    status: 'active',
                    products: {
                      id: 'c0000000-0000-4000-8000-000000000103',
                      name: 'Chiffon Pandan',
                      slug: 'chiffon-pandan',
                      status: 'published',
                      product_type: 'simple',
                    },
                    variant_dietary_tags: [],
                    branch_variant_offers: [{ is_listed: true }],
                  },
                  {
                    id: VAR_COMP_MOCHA,
                    product_id: 'c0000000-0000-4000-8000-000000000104',
                    sku: 'COMP-MOCHA',
                    name: 'Mocha GF',
                    size_label: '3 pcs',
                    base_price_idr: 32_000,
                    status: 'active',
                    products: {
                      id: 'c0000000-0000-4000-8000-000000000104',
                      name: 'Chiffon Mocha',
                      slug: 'chiffon-mocha',
                      status: 'published',
                      product_type: 'simple',
                    },
                    variant_dietary_tags: [
                      {
                        verification_status: 'verified',
                        dietary_tags: { slug: 'gluten-free' },
                      },
                    ],
                    branch_variant_offers: [{ is_listed: true }],
                  },
                ],
                error: null,
              });
            }

            return resolve({ data: [], error: null });
          },
          maybeSingle: async () => {
            if (table === 'admin_profiles') {
              if (!dbState.userId || !dbState.role) {
                return { data: null, error: null };
              }
              return {
                data: {
                  user_id: dbState.userId,
                  display_name:
                    dbState.role === 'owner' ? 'Owner Oma' : 'Staff Surabaya',
                  role: dbState.role,
                  branch_id:
                    dbState.role === 'branch_admin' ? SURABAYA_ID : null,
                  is_active: true,
                },
                error: null,
              };
            }

            if (table === 'branches') {
              return {
                data: { id: SURABAYA_ID, name: 'Surabaya', is_active: true },
                error: null,
              };
            }

            if (table === 'products') {
              const prod = dbState.products.get(filters.id as string);
              return {
                data: prod ? projectAdminProductRow(prod) : null,
                error: null,
              };
            }

            return { data: null, error: null };
          },
        };
        return builder;
      },
    })),
  };
});

async function makePngBuffer(width = 32, height = 32): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 30, b: 40 },
    },
  })
    .png()
    .toBuffer();
}

function makeJsonPutRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'PUT',
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('F17 server routes: media upload + atomic product configuration', () => {
  beforeEach(() => {
    resetDbState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('denies anonymous (401) and staff branch_admin (403) across F17 routes', async () => {
    dbState.userId = null;
    dbState.role = null;

    const anonBootstrap = await bootstrapRoute(
      new Request('http://localhost:3000/api/admin/products/editor-bootstrap'),
    );
    expect(anonBootstrap.status).toBe(401);

    const anonUpload = await uploadMediaRoute(
      new Request('http://localhost:3000/api/admin/media/upload', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
      }),
    );
    expect(anonUpload.status).toBe(401);

    dbState.userId = STAFF_ID;
    dbState.role = 'branch_admin';

    const staffSave = await saveConfigurationRoute(
      makeJsonPutRequest(
        `http://localhost:3000/api/admin/products/${PROD_SIMPLE_ID}/configuration`,
        {},
      ),
      { params: Promise.resolve({ id: PROD_SIMPLE_ID }) },
    );
    expect(staffSave.status).toBe(403);

    const staffUpload = await uploadMediaRoute(
      new Request('http://localhost:3000/api/admin/media/upload', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
      }),
    );
    expect(staffUpload.status).toBe(403);
  });

  it('validates media upload magic bytes/SVG/size/dimensions and uploads re-encoded image to private media-drafts', async () => {
    const validPng = await makePngBuffer(64, 48);
    const fdValid = new FormData();
    fdValid.append(
      'file',
      new File([new Uint8Array(validPng)], '../../evil-path.png', {
        type: 'image/png',
      }),
    );

    const res = await uploadMediaRoute(
      new Request('http://localhost:3000/api/admin/media/upload', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
        body: fdValid,
      }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.storageBucket).toBe('media-drafts');
    expect(json.data.storagePath).toMatch(
      new RegExp(`^${OWNER_ID}/drafts/[0-9a-f-]{36}\\.png$`),
    );
    expect(json.data.originalFileName).toBe('evil-path.png');
    expect(json.data.previewUrl).toContain('signed/media-drafts');
    expect(
      dbState.storageBuckets['media-drafts'].has(json.data.storagePath),
    ).toBe(true);

    // Reject disguised SVG uploaded with image/png MIME header
    const svgFd = new FormData();
    svgFd.append(
      'file',
      new File(
        [
          new TextEncoder().encode(
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
          ),
        ],
        'xss.png',
        { type: 'image/png' },
      ),
    );
    const svgRes = await uploadMediaRoute(
      new Request('http://localhost:3000/api/admin/media/upload', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
        body: svgFd,
      }),
    );
    expect(svgRes.status).toBe(422);

    // Reject > 5 MiB oversize file (413)
    const bigBytes = new Uint8Array(5 * 1024 * 1024 + 64);
    bigBytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const bigFd = new FormData();
    bigFd.append(
      'file',
      new File([bigBytes], 'huge.png', { type: 'image/png' }),
    );
    const bigRes = await uploadMediaRoute(
      new Request('http://localhost:3000/api/admin/media/upload', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
        body: bigFd,
      }),
    );
    expect(bigRes.status).toBe(413);
  });

  it('promotes draft image to product-images on save, cleans up orphan on RPC rollback, and preserves shared referenced files', async () => {
    const png = await makePngBuffer(40, 40);
    const draftPath = `${OWNER_ID}/drafts/d1700000-0000-4000-8000-000000000055.png`;
    dbState.storageBuckets['media-drafts'].set(draftPath, new Uint8Array(png));

    const validConfig = {
      expectedUpdatedAt: '2026-11-12T00:00:00.000Z',
      product: {
        name: 'Chiffon Cheese Original Terpublikasi',
        productType: 'simple' as const,
        status: 'published' as const,
        shortDescription: 'Siap tampil.',
        description: 'Kue keju spesial.',
        ingredientsInfo: null,
        storageInstructions: null,
        isFeatured: true,
        isBestSeller: false,
        isNew: false,
        needsOwnerReview: false,
        sortOrder: 5,
      },
      categories: [{ categoryId: CAT_PUB_ID, isPrimary: true }],
      variants: [
        {
          id: VAR_SIMPLE_ID,
          sku: 'ROK-CHS-20',
          name: '20 cm',
          sizeLabel: '20 cm',
          basePriceIdr: 148_000,
          status: 'active' as const,
          sortOrder: 10,
          maxQuantityPerOrder: 99,
          isDefault: true,
          bundleRecipe: null,
          bundleUnitsTotal: null,
          bundleRulesVerified: false,
          fixedComponents: [],
          optionGroups: [],
          dietaryTags: [
            {
              dietaryTagId: GF_TAG_ID,
              verificationStatus: 'verified' as const,
              verifiedAt: '2026-11-12T00:00:00Z',
              note: 'Dicek Owner 12 Nov 2026.',
            },
          ],
          allergens: [],
        },
      ],
      images: [
        {
          id: 'e2700000-0000-4000-8000-000000000099',
          variantId: null,
          storageBucket: 'media-drafts' as const,
          storagePath: draftPath,
          altText: 'Foto resmi keju',
          isApproved: true,
          isPrimary: true,
          sortOrder: 10,
        },
      ],
    };

    // 1) Simulate DB rollback inside save_product_configuration RPC after media promotion
    dbState.forceRpcError = {
      code: '23514',
      message: 'product_not_publish_ready',
    };
    const failedRes = await saveConfigurationRoute(
      makeJsonPutRequest(
        `http://localhost:3000/api/admin/products/${PROD_SIMPLE_ID}/configuration`,
        validConfig,
      ),
      { params: Promise.resolve({ id: PROD_SIMPLE_ID }) },
    );
    expect(failedRes.status).toBe(422);
    // Product remained untouched at old updated_at & old name!
    expect(dbState.products.get(PROD_SIMPLE_ID)?.name).toBe(
      'Chiffon Cheese Original',
    );
    expect(dbState.products.get(PROD_SIMPLE_ID)?.status).toBe('draft');
    // Promoted orphan file in product-images MUST have been cleaned up while shared EXISTING_APPROVED_PATH remains intact!
    expect(dbState.removedStorageLog.length).toBe(1);
    expect(dbState.removedStorageLog[0].bucket).toBe('product-images');
    expect(
      dbState.storageBuckets['product-images'].has(EXISTING_APPROVED_PATH),
    ).toBe(true);

    // 2) Clear forced RPC error and save cleanly
    dbState.forceRpcError = null;
    dbState.removedStorageLog = [];
    const okRes = await saveConfigurationRoute(
      makeJsonPutRequest(
        `http://localhost:3000/api/admin/products/${PROD_SIMPLE_ID}/configuration`,
        validConfig,
      ),
      { params: Promise.resolve({ id: PROD_SIMPLE_ID }) },
    );
    expect(okRes.status).toBe(200);
    const okJson = await okRes.json();
    expect(okJson.data.editor.product.status).toBe('published');
    expect(okJson.data.editor.images[0].storageBucket).toBe('product-images');
    expect(okJson.data.editor.images[0].storagePath).toMatch(/^approved\//);
    expect(okJson.data.editor.variants[0].basePriceIdr).toBe(148_000);
    // EXISTING_APPROVED_PATH was removed from PROD_SIMPLE_ID, NOT deleted from storage because PROD_SHARED_REF_ID still references it!
    expect(
      dbState.storageBuckets['product-images'].has(EXISTING_APPROVED_PATH),
    ).toBe(true);
    expect(
      dbState.removedStorageLog.some((x) => x.path === EXISTING_APPROVED_PATH),
    ).toBe(false);
  });

  it('rejects concurrency stale conflict (409), invalid bundle GF propagation (422), and loads aggregate via GET ?include=editor', async () => {
    const staleRes = await saveConfigurationRoute(
      makeJsonPutRequest(
        `http://localhost:3000/api/admin/products/${PROD_SIMPLE_ID}/configuration`,
        {
          expectedUpdatedAt: '2026-11-01T00:00:00.000Z',
          product: {
            name: 'Stale Write',
            productType: 'simple',
            status: 'draft',
            shortDescription: null,
            description: null,
            ingredientsInfo: null,
            storageInstructions: null,
            isFeatured: false,
            isBestSeller: false,
            isNew: false,
            needsOwnerReview: true,
            sortOrder: 0,
          },
          categories: [{ categoryId: CAT_PUB_ID, isPrimary: true }],
          variants: [
            {
              id: VAR_SIMPLE_ID,
              sku: 'ROK-CHS-20',
              name: '20 cm',
              sizeLabel: '20 cm',
              basePriceIdr: 120_000,
              status: 'active',
              sortOrder: 10,
              maxQuantityPerOrder: 99,
              isDefault: true,
              bundleRecipe: null,
              bundleUnitsTotal: null,
              bundleRulesVerified: false,
              fixedComponents: [],
              optionGroups: [],
              dietaryTags: [],
              allergens: [],
            },
          ],
          images: [],
        },
      ),
      { params: Promise.resolve({ id: PROD_SIMPLE_ID }) },
    );
    expect(staleRes.status).toBe(409);

    // Bundle with non-GF component trying to verify GF on bundle fails cleanly (422)
    const gfInvalidRes = await saveConfigurationRoute(
      makeJsonPutRequest(
        `http://localhost:3000/api/admin/products/${PROD_BUNDLE_ID}/configuration`,
        {
          expectedUpdatedAt: '2026-11-12T00:00:00.000Z',
          product: {
            name: 'Mix 12 Slice Paket',
            productType: 'bundle',
            status: 'draft',
            shortDescription: null,
            description: null,
            ingredientsInfo: null,
            storageInstructions: null,
            isFeatured: false,
            isBestSeller: false,
            isNew: false,
            needsOwnerReview: false,
            sortOrder: 30,
          },
          categories: [{ categoryId: CAT_PUB_ID, isPrimary: true }],
          variants: [
            {
              id: 'b1700000-0000-4000-8000-000000000002',
              sku: 'ROK-MIX-12',
              name: 'Box 12 Slice',
              sizeLabel: '12 potong',
              basePriceIdr: 195_000,
              status: 'active',
              sortOrder: 10,
              maxQuantityPerOrder: 20,
              isDefault: true,
              bundleRecipe: 'chiffon_mix',
              bundleUnitsTotal: 12,
              bundleRulesVerified: true,
              fixedComponents: [
                {
                  id: 'f1700000-0000-4000-8000-000000000001',
                  componentVariantId: VAR_COMP_CHEESE,
                  componentSlot: 'cheese',
                  quantity: 3,
                  sortOrder: 10,
                },
                {
                  id: 'f1700000-0000-4000-8000-000000000002',
                  componentVariantId: VAR_COMP_CHOCO,
                  componentSlot: 'choco',
                  quantity: 3,
                  sortOrder: 20,
                },
              ],
              optionGroups: [
                {
                  id: 'a2700000-0000-4000-8000-000000000001',
                  name: 'Grup 1',
                  minSelect: 1,
                  maxSelect: 1,
                  quantityPerSelection: 3,
                  sortOrder: 10,
                  isRequired: true,
                  choices: [
                    {
                      id: 'c2700000-0000-4000-8000-000000000001',
                      label: 'Pandan',
                      componentVariantId: VAR_COMP_PANDAN_NOGF,
                      priceDeltaIdr: 0,
                      isActive: true,
                      sortOrder: 10,
                    },
                  ],
                },
                {
                  id: 'a2700000-0000-4000-8000-000000000002',
                  name: 'Grup 2',
                  minSelect: 1,
                  maxSelect: 1,
                  quantityPerSelection: 3,
                  sortOrder: 20,
                  isRequired: true,
                  choices: [
                    {
                      id: 'c2700000-0000-4000-8000-000000000002',
                      label: 'Mocha GF',
                      componentVariantId: VAR_COMP_MOCHA,
                      priceDeltaIdr: 0,
                      isActive: true,
                      sortOrder: 10,
                    },
                  ],
                },
              ],
              dietaryTags: [
                {
                  dietaryTagId: GF_TAG_ID,
                  verificationStatus: 'verified',
                  verifiedAt: '2026-11-12T00:00:00Z',
                  note: 'Klaim manual belum cek komponen pandan.',
                },
              ],
              allergens: [],
            },
          ],
          images: [],
        },
      ),
      { params: Promise.resolve({ id: PROD_BUNDLE_ID }) },
    );
    expect(gfInvalidRes.status).toBe(422);
    const gfJson = await gfInvalidRes.json();
    expect(
      gfJson.error.fieldErrors['variants.0.dietaryTags.0.verificationStatus'],
    ).toBeDefined();

    // GET aggregate ?include=editor
    const detailRes = await getProductRoute(
      new Request(
        `http://localhost:3000/api/admin/products/${PROD_SIMPLE_ID}?include=editor`,
      ),
      { params: Promise.resolve({ id: PROD_SIMPLE_ID }) },
    );
    expect(detailRes.status).toBe(200);
    const detailJson = await detailRes.json();
    expect(detailJson.data.editor.referenceData.dietaryTags.length).toBe(1);
    expect(detailJson.data.editor.referenceData.componentVariants.length).toBe(
      4,
    );
  });
});
