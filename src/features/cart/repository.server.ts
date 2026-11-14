import 'server-only';
import { CATALOG_LIMITS } from '@/constants/catalog.constant';
import { createPublicReadClient } from '@/lib/supabase/public-read.server';

function withDeadline(signal?: AbortSignal) {
  const deadline = AbortSignal.timeout(CATALOG_LIMITS.READ_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, deadline]) : deadline;
}

export async function readCartVariantsByIds(
  variantIds: string[],
  signal?: AbortSignal,
) {
  if (variantIds.length === 0) return [];
  const client = createPublicReadClient();
  const { data, error } = await client
    .from('product_variants')
    .select(
      'id,sku,name,size_label,base_price_idr,status,max_quantity_per_order,bundle_recipe,bundle_units_total,bundle_rules_verified,products(id,name,slug,product_type,status,needs_owner_review,product_categories(category_id,is_primary),product_images(alt_text,is_primary,sort_order)),branch_variant_offers(branch_id,is_listed,availability_status,stock_quantity,price_override_idr),option_groups(id,name,min_select,max_select,quantity_per_selection,is_required,sort_order,option_choices(id,label,price_delta_idr,component_variant_id,is_active,sort_order)),bundle_fixed_components!bundle_fixed_components_bundle_variant_id_fkey(id,component_slot,component_variant_id,quantity,sort_order)',
    )
    .in('id', variantIds)
    .retry(false)
    .abortSignal(withDeadline(signal));

  if (error) throw new Error('Cart variants read unavailable');
  return data ?? [];
}
