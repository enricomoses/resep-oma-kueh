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
