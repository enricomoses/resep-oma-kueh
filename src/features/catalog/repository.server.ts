import 'server-only';
import { CATALOG_LIMITS } from '@/constants/catalog.constant';
import { createPublicReadClient } from '@/lib/supabase/public-read.server';

function withDeadline(signal?: AbortSignal) {
  const deadline = AbortSignal.timeout(CATALOG_LIMITS.READ_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, deadline]) : deadline;
}

export async function readPublishedCategories(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('categories')
    .select('id,name,slug,description,sort_order,status')
    .eq('status', 'published')
    .retry(false)
    .order('sort_order')
    .order('name')
    .order('id')
    .limit(CATALOG_LIMITS.MAX_CATEGORIES_READ)
    .abortSignal(withDeadline(signal));
  if (error) throw new Error('Categories read unavailable');
  return data;
}

export async function readPublishedCatalogProducts(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('products')
    .select(
      'id,name,slug,short_description,description,product_type,is_featured,is_best_seller,is_new,status,sort_order,created_at,product_categories(category_id,is_primary,categories(id,name,slug,status)),product_images(alt_text,is_primary,sort_order),product_variants(id,sku,name,size_label,base_price_idr,status,sort_order,is_default,branch_variant_offers(branch_id,is_listed,availability_status,stock_quantity,price_override_idr),option_groups(id,name,min_select,max_select,quantity_per_selection,is_required,sort_order,option_choices(id,label,price_delta_idr,is_active,sort_order)),variant_dietary_tags(dietary_tag_id,verification_status,verified_at,dietary_tags(id,slug,name)))',
    )
    .eq('status', 'published')
    .retry(false)
    .order('sort_order')
    .order('id')
    .limit(CATALOG_LIMITS.MAX_PRODUCTS_READ)
    .abortSignal(withDeadline(signal));
  if (error) throw new Error('Catalog products read unavailable');
  return data;
}

export async function readActiveCatalogPromotions(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('promotions')
    .select(
      'id,title,slug,description,discount_type,discount_value,min_spend_idr,max_discount_idr,scope,starts_at,ends_at,status,is_enabled,is_stackable,priority,promotion_branches(branch_id),promotion_categories(category_id),promotion_products(product_id),promotion_variants(variant_id)',
    )
    .eq('status', 'published')
    .eq('is_enabled', true)
    .retry(false)
    .order('priority', { ascending: false })
    .order('id')
    .limit(CATALOG_LIMITS.MAX_PROMOTIONS_READ)
    .abortSignal(withDeadline(signal));
  if (error) throw new Error('Catalog promotions read unavailable');
  return data;
}

export async function readPublishedProductBySlug(
  slug: string,
  signal?: AbortSignal,
) {
  const client = createPublicReadClient();
  const { data, error } = await client
    .from('products')
    .select(
      'id,name,slug,short_description,description,ingredients_info,storage_instructions,product_type,is_featured,is_best_seller,is_new,status,needs_owner_review,sort_order,created_at,product_categories(category_id,is_primary,categories(id,name,slug,status)),product_images(id,variant_id,storage_bucket,storage_path,alt_text,is_approved,is_primary,sort_order),product_variants(id,sku,name,size_label,base_price_idr,status,sort_order,is_default,max_quantity_per_order,bundle_recipe,bundle_units_total,bundle_rules_verified,branch_variant_offers(branch_id,is_listed,availability_status,stock_quantity,price_override_idr),option_groups(id,name,min_select,max_select,quantity_per_selection,is_required,sort_order,option_choices(id,label,price_delta_idr,component_variant_id,is_active,sort_order)),bundle_fixed_components!bundle_fixed_components_bundle_variant_id_fkey(id,component_slot,component_variant_id,quantity,sort_order),variant_dietary_tags(dietary_tag_id,verification_status,verified_at,dietary_tags(id,slug,name)),variant_allergens(allergen_id,presence,verified_at,allergens(id,slug,name)))',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .retry(false)
    .abortSignal(withDeadline(signal))
    .maybeSingle();
  if (error) throw new Error('Product detail read unavailable');
  return data;
}

export async function readComponentVariantsByIds(
  variantIds: string[],
  signal?: AbortSignal,
) {
  if (variantIds.length === 0) return [];
  const { data, error } = await createPublicReadClient()
    .from('product_variants')
    .select(
      'id,sku,name,product_id,status,variant_dietary_tags(verification_status,verified_at,dietary_tags(id,slug,name)),branch_variant_offers(branch_id,is_listed,availability_status,stock_quantity)',
    )
    .in('id', variantIds)
    .retry(false)
    .abortSignal(withDeadline(signal));
  if (error) throw new Error('Component variants read unavailable');
  return data ?? [];
}

export function resolvePublicProductImageUrl(
  storageBucket: string,
  storagePath: string,
): string | null {
  if (storageBucket !== 'product-images' || !storagePath.trim()) {
    return null;
  }
  try {
    const { data } = createPublicReadClient()
      .storage.from(storageBucket)
      .getPublicUrl(storagePath);
    return data.publicUrl || null;
  } catch {
    return null;
  }
}
